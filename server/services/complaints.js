import { withTransaction } from "../db/pool.js";
import {
  COMPLAINT_SEQ, audit, filesOwnedBy, getStatus, insertComplaint, insertVerification, lockComplaint, logHistory,
  nextNumber, notify, updateComplaint, updateStatus,
} from "../repos/store.js";
import { toComplaint } from "../repos/records.js";
import { ROLE_TITLES, badRequest, conflict, forbidden, notFound, requireRole, who } from "./errors.js";

const FINAL = ["Complaint Valid / Confirmed", "Complaint Rejected"];
const OPEN_STATUSES = ["Under Government Review", "Under Review", "Field Verification", "Action Required"];
const GOV_ONLY = "Government reviewer access is required for this action.";
const now = () => new Date().toISOString();

async function loadOpenComplaint(tx, id, reviewer) {
  requireRole(reviewer, ["government"], GOV_ONLY);
  const c = await lockComplaint(tx, id);
  if (!c) throw notFound("Complaint not found.");
  if (FINAL.includes(c.status)) throw conflict("This complaint has already received a government decision.");
  return c;
}

export async function submitComplaint(pool, input, user) {
  if (!user) throw forbidden("Sign in to raise a complaint.");
  return withTransaction(pool, async (tx) => {
    const { rows: props } = await tx.query("SELECT id, name FROM properties WHERE id = $1", [input.property_id]);
    if (!props[0]) throw badRequest("Please select a valid property.");
    const ids = input.evidence.map((e) => e.file_id);
    const owned = await filesOwnedBy(tx, ids, user.id);
    if (owned.length !== new Set(ids).size) throw forbidden("Evidence must be files you uploaded.");
    const status = await getStatus(tx, input.property_id);

    const complaint_number = await nextNumber(tx, COMPLAINT_SEQ, (n) => `CMP-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`);
    const row = await insertComplaint(tx, {
      complaint_number,
      created_by_id: user.id,
      property_id: input.property_id,
      status: "Submitted",
      category: input.category,
      description: input.description,
      details: {
        property_name: props[0].name, property_code: input.property_code, location: input.location,
        ulpin: status?.ulpin || "", reporter_name: user.full_name, reporter_email: user.email,
      },
      evidence: owned.map((f) => ({ file_id: f.id, name: f.original_name, type: f.media_type, size: f.size_bytes })),
      history: [{ status: "Submitted", note: "Complaint submitted.", at: now(), by: who(user) }],
    });
    await logHistory(tx, input.property_id, "Complaint Raised", "A complaint was raised about this property. It does not change verification by itself.");
    await notify(tx, user.id, "Complaint submitted", `Your complaint ${complaint_number} has been submitted.`, "/complaints");
    await audit(tx, user, "complaint.submit", "complaint", row.id, { complaint_number });
    return toComplaint(row);
  });
}

export async function assignComplaint(pool, id, { officer }, reviewer) {
  return withTransaction(pool, async (tx) => {
    const c = await loadOpenComplaint(tx, id, reviewer);
    const history = [...c.history, { status: "Officer Assigned", note: `Assigned to ${officer}.`, at: now(), by: who(reviewer) }];
    const updated = await updateComplaint(tx, id, { assigned_officer: officer, history });
    await notify(tx, c.created_by_id, "Complaint assigned", `Your complaint ${c.complaint_number} has been assigned for review.`, "/complaints");
    await audit(tx, reviewer, "complaint.assign", "complaint", id, { officer });
    return toComplaint(updated);
  });
}

export async function setComplaintPriority(pool, id, { priority }, reviewer) {
  return withTransaction(pool, async (tx) => {
    await loadOpenComplaint(tx, id, reviewer);
    const updated = await updateComplaint(tx, id, { priority });
    await audit(tx, reviewer, "complaint.priority", "complaint", id, { priority });
    return toComplaint(updated);
  });
}

export async function updateComplaintStatus(pool, id, { status, note }, reviewer) {
  if (!OPEN_STATUSES.includes(status)) throw badRequest(`Use the decision action for final outcomes. Allowed: ${OPEN_STATUSES.join(", ")}.`);
  return withTransaction(pool, async (tx) => {
    const c = await loadOpenComplaint(tx, id, reviewer);
    const at = now();
    const by = who(reviewer);
    const history = [...c.history, { status, note: note || "", at, by, reviewer_id: reviewer.id, reviewer_role: reviewer.role }];
    const details = status === "Under Government Review"
      ? { ...c.details, government_review_started_at: at, government_review_started_by_id: reviewer.id, government_review_started_by: by }
      : c.details;
    const updated = await updateComplaint(tx, id, { status, history, details });
    await notify(tx, c.created_by_id, "Complaint update", `Your complaint ${c.complaint_number} is now: ${status}.`, "/complaints");
    await audit(tx, reviewer, "complaint.status", "complaint", id, { from: c.status, to: status });
    return toComplaint(updated);
  });
}

export async function decideComplaint(pool, id, { decision, reason }, reviewer) {
  if (!FINAL.includes(decision)) throw badRequest("Choose a valid complaint decision.");
  if (!reason?.trim()) throw badRequest("A review reason is required.");
  return withTransaction(pool, async (tx) => {
    const c = await loadOpenComplaint(tx, id, reviewer);
    if (c.status !== "Under Government Review") throw conflict("Start government review before recording a decision.");

    const at = now();
    const by = who(reviewer);
    const why = reason.trim();
    const review = { decision, reason: why, reviewer_id: reviewer.id, reviewer_name: by, reviewer_role: reviewer.role, reviewed_at: at };
    const updated = await updateComplaint(tx, id, {
      status: decision,
      review,
      history: [...c.history, { status: decision, note: why, at, by, reviewer_id: reviewer.id, reviewer_role: reviewer.role }],
    });

    if (decision === "Complaint Valid / Confirmed") {
      await getStatus(tx, c.property_id, { lock: true });
      await updateStatus(tx, c.property_id, {
        verification_status: "Verification Revoked",
        revocation: {
          verification_revocation_reason: why, verification_revoked_by_id: reviewer.id, verification_revoked_by: by,
          verification_revoked_at: at, verification_revoked_complaint_id: c.id,
        },
      });
      await insertVerification(tx, {
        property_id: c.property_id, status: "Verification Revoked", reviewer_id: reviewer.id, reviewer_name: by,
        reviewer_role: `${ROLE_TITLES.government} (Demo)`, remarks: why, removal_reason: "Complaint confirmed", complaint_id: c.id,
      });
      await logHistory(tx, c.property_id, "Verification Revoked", "Government confirmed a complaint after review and revoked verification.");
    } else {
      await logHistory(tx, c.property_id, "Complaint Rejected", "Government reviewed a complaint and rejected it. Verification status was not changed.");
    }
    await notify(tx, c.created_by_id, `Complaint ${decision === "Complaint Rejected" ? "rejected" : "confirmed"}`,
      `Your complaint ${c.complaint_number} was reviewed: ${decision}.`, "/complaints");
    await audit(tx, reviewer, "complaint.decide", "complaint", id, { decision, reason: why });
    return toComplaint(updated);
  });
}
