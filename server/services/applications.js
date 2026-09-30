import { withTransaction } from "../db/pool.js";
import {
  APPLICATION_SEQ, DEMO_ULPIN_SEQ, audit, filesOwnedBy, getStatus, gisCheck, insertApplication, insertVerification,
  lockApplication, logHistory, nextNumber, notify, updateApplication, updateStatus,
} from "../repos/store.js";
import { toApplication } from "../repos/records.js";
import { ROLE_TITLES, badRequest, conflict, forbidden, notFound, requireRole, who } from "./errors.js";

export const REVIEW_CHECKLIST = ["Parcel Information", "Coordinates", "Building Information", "Documents", "3D Representation"];
const SURVEYOR_STATUSES = ["Under GIS Validation", "Under Verification", "Correction Required", "Surveyor Review Complete"];
const CLOSED = ["ULPIN Assigned", "Rejected"];
const APP_TO_ULPIN = {
  "Under GIS Validation": "Under Verification",
  "Under Verification": "Under Verification",
  "Correction Required": "Application Submitted",
  Rejected: "Not Requested",
};

const isChecklistComplete = (checklist) => REVIEW_CHECKLIST.every((item) => checklist?.[item] === true);
const year = () => new Date().getFullYear();
const now = () => new Date().toISOString();

export async function submitApplication(pool, input, user) {
  requireRole(user, ["citizen"], "Only citizens can submit ULPIN applications.");
  return withTransaction(pool, async (tx) => {
    if (input.property_id) await assertPropertyOpenForApplication(tx, input.property_id);
    const ids = input.documents.map((d) => d.file_id);
    const owned = await filesOwnedBy(tx, ids, user.id);
    if (owned.length !== new Set(ids).size) throw forbidden("Documents must be files you uploaded.");
    const byId = new Map(owned.map((f) => [f.id, f]));
    const documents = input.documents.map((d) => {
      const f = byId.get(d.file_id);
      return { label: d.label, file_id: f.id, name: f.original_name, type: f.media_type, size: f.size_bytes };
    });

    const { property_id, latitude, longitude, ...rest } = input;
    const details = Object.fromEntries(Object.entries(rest).filter(([key]) => key !== "documents"));
    const application_number = await nextNumber(tx, APPLICATION_SEQ, (n) => `ULP-${year()}-${String(n).padStart(4, "0")}`);
    const row = await insertApplication(tx, {
      application_number,
      created_by_id: user.id,
      property_id: property_id || null,
      status: "Submitted",
      latitude,
      longitude,
      details,
      documents,
      gis_check: await gisCheck(tx, property_id || null, latitude, longitude),
      history: [{ status: "Submitted", note: "Application submitted by applicant.", at: now(), by: who(user) }],
    });
    if (row.property_id) {
      await updateStatus(tx, row.property_id, { ulpin_status: "Application Submitted" });
      await logHistory(tx, row.property_id, "ULPIN Application Submitted", "A ULPIN application was submitted for this property (demo workflow).");
    }
    await notify(tx, user.id, "ULPIN request submitted", `Your ULPIN request ${application_number} has been submitted.`, "/applications");
    await audit(tx, user, "application.submit", "application", row.id, { application_number });
    return toApplication(row);
  });
}

// One open application per property, and never for a property that already has a ULPIN.
// Stops any citizen from resetting the public status of someone else's property.
async function assertPropertyOpenForApplication(tx, propertyId) {
  const status = await getStatus(tx, propertyId, { lock: true });
  if (!status) throw badRequest("Please select a valid property.");
  if (status.ulpin) throw conflict("This property already has a demo ULPIN.");
  const { rows } = await tx.query(
    "SELECT 1 FROM applications WHERE property_id = $1 AND status <> ALL($2::text[]) LIMIT 1",
    [propertyId, CLOSED],
  );
  if (rows.length) throw conflict("This property already has an application under review.");
}

function checkTransition(app, status, checklist, reviewer) {
  if (CLOSED.includes(app.status)) throw conflict(`This application is closed (${app.status}).`);
  if (status === "Under Government Review") throw badRequest("Government review starts only after a Surveyor completes the application review.");
  if (SURVEYOR_STATUSES.includes(status)) {
    requireRole(reviewer, ["surveyor"], "Surveyor access is required for document verification.");
    if (app.status === "Surveyor Review Complete") throw conflict("The surveyor review is already complete.");
  } else if (["Approved", "Rejected"].includes(status)) {
    requireRole(reviewer, ["government"], "Government reviewer access is required for this action.");
    if (app.status !== "Surveyor Review Complete") throw conflict("A Surveyor must complete the review before Government can decide.");
  } else {
    throw badRequest(`Unknown review status: ${status}`);
  }
  if (["Surveyor Review Complete", "Approved"].includes(status) && !isChecklistComplete(checklist)) {
    throw badRequest("Complete every verification checklist item first.");
  }
}

export async function reviewApplication(pool, id, { status, note, checklist: submitted }, reviewer) {
  return withTransaction(pool, async (tx) => {
    const app = await lockApplication(tx, id);
    if (!app) throw notFound("Application not found.");
    // Only surveyor steps may change the checklist; government acts on what the surveyor signed off.
    const checklist = SURVEYOR_STATUSES.includes(status) ? submitted || app.checklist : app.surveyor_review?.checklist || app.checklist;
    checkTransition(app, status, checklist, reviewer);

    const by = who(reviewer);
    const at = now();
    const history = [...app.history];
    const patch = { status, reviewed_at: at, remarks: note || app.remarks || "", checklist: checklist || app.checklist };
    let message = `Your application ${app.application_number} is now: ${status}.`;

    if (status === "Surveyor Review Complete") {
      patch.surveyor_review = { reviewer_id: reviewer.id, reviewer_name: by, reviewed_at: at, checklist, remarks: note || "" };
      history.push({ status, note: note || "Surveyor document and property checks completed.", at, by });
      message = `Surveyor review is complete for ${app.application_number}; it is ready for Government review.`;
      if (app.property_id) await logHistory(tx, app.property_id, "Surveyor Review Complete", "A surveyor completed the verification checklist.");
    } else if (status === "Approved") {
      const ulpin = await nextNumber(tx, DEMO_ULPIN_SEQ, (n) => `DEMO-ULPIN-${String(n).padStart(6, "0")}`);
      history.push({ status: "Approved", note: note || "Demo approval by Government reviewer.", at, by });
      history.push({ status: "ULPIN Assigned", note: `Demo ULPIN ${ulpin} assigned.`, at, by });
      Object.assign(patch, { status: "ULPIN Assigned", demo_ulpin: ulpin });
      message = `Demo ULPIN ${ulpin} has been assigned for application ${app.application_number}.`;
      if (app.property_id) {
        await updateStatus(tx, app.property_id, { ulpin, ulpin_status: "Assigned", verification_status: "Verified", revocation: null });
        await insertVerification(tx, {
          property_id: app.property_id, status: "Verified", reviewer_id: reviewer.id, reviewer_name: by,
          reviewer_role: `${ROLE_TITLES.government} (Demo)`, remarks: `Verified during review of ${app.application_number}.`, checklist,
        });
        await logHistory(tx, app.property_id, "Demo ULPIN Assigned", `${ulpin} assigned after simulated government approval.`);
      }
    } else {
      history.push({ status, note: note || "", at, by });
      if (app.property_id && APP_TO_ULPIN[status]) {
        const current = await getStatus(tx, app.property_id, { lock: true });
        if (!current.ulpin) await updateStatus(tx, app.property_id, { ulpin_status: APP_TO_ULPIN[status] });
      }
      if (status === "Correction Required") message = `Additional documents are required for ${app.application_number}.`;
    }

    patch.history = history;
    const updated = await updateApplication(tx, id, patch);
    await notify(tx, app.created_by_id, `Application: ${patch.status}`, message, "/applications");
    await audit(tx, reviewer, "application.review", "application", id, { from: app.status, to: patch.status, note: note || "" });
    return toApplication(updated);
  });
}

export async function saveAiRun(pool, applicationId, documentLabel, result, user) {
  const { rows } = await pool.query(
    "INSERT INTO ai_extraction_runs (application_id, document_label, result, created_by_id) VALUES ($1, $2, $3, $4) RETURNING id",
    [applicationId, documentLabel, JSON.stringify(result), user.id],
  );
  await audit(pool, user, "application.ai_extract", "application", applicationId, { document_label: documentLabel, run_id: rows[0].id, model: result.model });
  return rows[0].id;
}

// Records a reviewer's check of a server-run AI extraction. Never changes any status.
export async function recordAiReview(pool, applicationId, { run_id, note }, reviewer) {
  requireRole(reviewer, ["surveyor", "government"], "Surveyor or Government access is required to record an AI review.");
  if (!note?.trim()) throw badRequest("Add a note describing what you checked against the original document.");
  return withTransaction(pool, async (tx) => {
    const app = await lockApplication(tx, applicationId);
    if (!app) throw notFound("Application not found.");
    if (CLOSED.includes(app.status)) throw conflict(`This application is closed (${app.status}).`);
    const { rows } = await tx.query("SELECT * FROM ai_extraction_runs WHERE id = $1 AND application_id = $2", [run_id, applicationId]);
    const run = rows[0];
    if (!run) throw notFound("AI extraction run not found for this application.");

    const at = now();
    const by = who(reviewer);
    const entry = {
      run_id, document_label: run.document_label, result: run.result,
      reviewer_id: reviewer.id, reviewer_name: by, reviewer_role: reviewer.role, reviewer_note: note.trim(), reviewed_at: at,
    };
    const updated = await updateApplication(tx, applicationId, {
      ai_extractions: [...app.ai_extractions.filter((x) => x.document_label !== run.document_label), entry],
      history: [...app.history, { status: "AI Extraction Reviewed", note: `${run.document_label}: ${note.trim()}`, at, by }],
    });
    await audit(tx, reviewer, "application.ai_review", "application", applicationId, { run_id, document_label: run.document_label });
    return toApplication(updated);
  });
}
