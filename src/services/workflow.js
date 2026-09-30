import { localClient } from "@/api/localClient";
import { nextNumber, nextDemoUlpin } from "@/lib/ids";

const E = localClient.entities;
const now = () => new Date().toISOString();
const who = (u) => u?.full_name || u?.email || "User";
const isGovernmentReviewer = (user) => user?.demo_role === "government";
const isSurveyor = (user) => user?.demo_role === "surveyor";
const REVIEW_CHECKLIST = ["Parcel Information", "Coordinates", "Building Information", "Documents", "3D Representation"];

function isChecklistComplete(checklist) {
  return REVIEW_CHECKLIST.every((item) => checklist?.[item]);
}

function requireGovernmentReviewer(user) {
  if (!isGovernmentReviewer(user)) throw new Error("Government reviewer access is required for this action.");
}

export async function upsertStatus(property_id, patch) {
  const [row] = await E.PropertyStatus.filter({ property_id });
  return row ? E.PropertyStatus.update(row.id, patch) : E.PropertyStatus.create({ property_id, ...patch });
}

const log = (property_id, event, description, event_date = now()) =>
  E.PropertyHistory.create({ property_id, event, description, event_date });

const notify = (user_id, title, message, link) =>
  user_id ? E.Notification.create({ user_id, title, message, link, read: false }) : null;

/* ---------------- ULPIN applications ---------------- */
export async function submitApplication(form, user) {
  const application_number = await nextNumber("ULPINApplication", "application_number", "ULP");
  const app = await E.ULPINApplication.create({
    ...form,
    application_number,
    status: "Submitted",
    submitted_at: now(),
    history: [{ status: "Submitted", note: "Application submitted by applicant.", at: now(), by: who(user) }],
  });
  if (form.property_id) {
    await upsertStatus(form.property_id, { ulpin_status: "Application Submitted" });
    await log(form.property_id, "ULPIN Application Submitted", `${application_number} submitted (demo workflow).`);
  }
  await notify(user.id, "ULPIN request submitted", `Your ULPIN request ${application_number} has been submitted.`, "/applications");
  return app;
}

const APP_TO_ULPIN = {
  "Under GIS Validation": "Under Verification",
  "Under Verification": "Under Verification",
  "Correction Required": "Application Submitted",
  Rejected: "Not Requested",
};

export async function reviewApplication(app, status, note, reviewer, extra = {}) {
  if (status === "Under Government Review") {
    throw new Error("Government review starts only after a Surveyor completes the application review.");
  }
  const surveyorStatuses = ["Under GIS Validation", "Under Verification", "Correction Required", "Surveyor Review Complete"];
  if (surveyorStatuses.includes(status)) {
    if (!isSurveyor(reviewer)) throw new Error("Surveyor access is required for document verification.");
  } else {
    requireGovernmentReviewer(reviewer);
  }

  if (status === "Surveyor Review Complete" && !isChecklistComplete(extra.checklist || app.checklist)) {
    throw new Error("Complete every verification checklist item before handing off to Government.");
  }
  if (["Approved", "Rejected"].includes(status) && app.status !== "Surveyor Review Complete") {
    throw new Error("A Surveyor must complete the review before Government can decide.");
  }
  if (status === "Approved" && !isChecklistComplete(extra.checklist || app.checklist)) {
    throw new Error("Complete every verification checklist item before Government approval.");
  }

  const by = who(reviewer);
  const history = [...(app.history || [])];
  const patch = { ...extra, status, reviewed_at: now(), remarks: note || app.remarks || "" };
  let message = `Your application ${app.application_number} is now: ${status}.`;

  if (status === "Surveyor Review Complete") {
    patch.surveyor_review = {
      reviewer_id: reviewer.id,
      reviewer_name: by,
      reviewed_at: patch.reviewed_at,
      checklist: extra.checklist || app.checklist,
      remarks: note || "",
    };
    history.push({ status, note: note || "Surveyor document and property checks completed.", at: patch.reviewed_at, by });
    message = `Surveyor review is complete for ${app.application_number}; it is ready for Government review.`;
    if (app.property_id) await log(app.property_id, "Surveyor Review Complete", `${by} completed the surveyor checklist for ${app.application_number}.`);
  } else if (status === "Approved") {
    const ulpin = await nextDemoUlpin();
    history.push({ status: "Approved", note: note || "Demo approval by Government reviewer.", at: now(), by });
    history.push({ status: "ULPIN Assigned", note: `Demo ULPIN ${ulpin} assigned.`, at: now(), by });
    Object.assign(patch, { status: "ULPIN Assigned", demo_ulpin: ulpin });
    message = `Demo ULPIN ${ulpin} has been assigned for application ${app.application_number}.`;
    if (app.property_id) {
      await upsertStatus(app.property_id, { ulpin, ulpin_status: "Assigned", verification_status: "Verified" });
      await E.Verification.create({
        property_id: app.property_id, reviewer_name: by, reviewer_role: "Government Administrator (Demo)",
        status: "Verified", remarks: `Verified during review of ${app.application_number}.`, checklist: extra.checklist || app.checklist || {},
      });
      await log(app.property_id, "Demo ULPIN Assigned", `${ulpin} assigned after simulated government approval.`);
    }
  } else {
    history.push({ status, note: note || "", at: now(), by });
    if (app.property_id && APP_TO_ULPIN[status]) await upsertStatus(app.property_id, { ulpin_status: APP_TO_ULPIN[status] });
    if (status === "Under Verification") message = `Your application ${app.application_number} is under verification.`;
    if (status === "Correction Required") message = `Additional documents are required for ${app.application_number}.`;
  }

  patch.history = history;
  await E.ULPINApplication.update(app.id, patch);
  await notify(app.created_by_id, `Application: ${patch.status}`, message, "/applications");
}

// Stores an AI extraction only after a reviewer has looked at it. The AI output is
// kept as a candidate next to the reviewer's note; it never changes any status.
export async function recordAiExtractionReview(app, document_label, result, note, reviewer) {
  if (!isSurveyor(reviewer) && !isGovernmentReviewer(reviewer)) {
    throw new Error("Surveyor or Government access is required to record an AI review.");
  }
  if (!note?.trim()) throw new Error("Add a note describing what you checked against the original document.");
  const reviewed_at = now();
  const by = who(reviewer);
  const entry = {
    document_label,
    result,
    reviewer_id: reviewer.id,
    reviewer_name: by,
    reviewer_role: reviewer.demo_role,
    reviewer_note: note.trim(),
    reviewed_at,
  };
  await E.ULPINApplication.update(app.id, {
    ai_extractions: [...(app.ai_extractions || []).filter((x) => x.document_label !== document_label), entry],
    history: [...(app.history || []), {
      status: "AI Extraction Reviewed",
      note: `${document_label}: ${note.trim()}`,
      at: reviewed_at,
      by,
    }],
  });
}

/* ---------------- Complaints ---------------- */
export async function submitComplaint(form, user) {
  const complaint_number = await nextNumber("Complaint", "complaint_number", "CMP");
  const c = await E.Complaint.create({
    ...form,
    complaint_number,
    status: "Submitted",
    priority: "Medium",
    reporter_name: user.full_name || "",
    reporter_email: user.email,
    history: [{ status: "Submitted", note: "Complaint submitted.", at: now(), by: who(user) }],
  });
  if (form.property_id) await log(form.property_id, "Complaint Raised", `${complaint_number}: ${form.category}`);
  await notify(user.id, "Complaint submitted", `Your complaint ${complaint_number} has been submitted.`, "/complaints");
  return c;
}

export async function assignComplaint(c, officer, reviewer) {
  requireGovernmentReviewer(reviewer);
  if (isFinalComplaintDecision(c.status)) throw new Error("This complaint has already received a government decision.");
  const history = [...(c.history || []), { status: "Officer Assigned", note: `Assigned to ${officer}.`, at: now(), by: who(reviewer) }];
  await E.Complaint.update(c.id, { assigned_officer: officer, history });
  await notify(c.created_by_id, "Complaint assigned", `Your complaint ${c.complaint_number} has been assigned for review.`, "/complaints");
}

export async function updateComplaint(c, status, note, reviewer, extra = {}) {
  requireGovernmentReviewer(reviewer);
  if (isFinalComplaintDecision(c.status)) throw new Error("This complaint has already received a government decision.");
  const updatedAt = now();
  const reviewerName = who(reviewer);
  const history = [...(c.history || []), {
    status,
    note: note || "",
    at: updatedAt,
    by: reviewerName,
    reviewer_id: reviewer.id,
    reviewer_role: reviewer.demo_role,
  }];
  const patch = { ...extra, status, history };
  if (status === "Under Government Review") {
    Object.assign(patch, {
      government_review_started_at: updatedAt,
      government_review_started_by_id: reviewer.id,
      government_review_started_by: reviewerName,
    });
  }
  await E.Complaint.update(c.id, patch);
  await notify(c.created_by_id, "Complaint update", `Your complaint ${c.complaint_number} is now: ${status}.`, "/complaints");
}

const isFinalComplaintDecision = (status) => ["Complaint Valid / Confirmed", "Complaint Rejected"].includes(status);

export async function decideComplaint(c, decision, reason, reviewer) {
  requireGovernmentReviewer(reviewer);
  if (!isFinalComplaintDecision(decision)) throw new Error("Choose a valid complaint decision.");
  if (c.status !== "Under Government Review") throw new Error("Start government review before recording a decision.");
  if (!reason?.trim()) throw new Error("A review reason is required.");
  if (!c.property_id) throw new Error("This complaint is not linked to a property.");

  const reviewedAt = now();
  const reviewerName = who(reviewer);
  const historyEntry = {
    status: decision,
    note: reason.trim(),
    at: reviewedAt,
    by: reviewerName,
    reviewer_id: reviewer.id,
    reviewer_role: reviewer.demo_role,
  };
  const review = {
    decision,
    reason: reason.trim(),
    reviewer_id: reviewer.id,
    reviewer_name: reviewerName,
    reviewer_role: reviewer.demo_role,
    reviewed_at: reviewedAt,
  };

  await E.Complaint.update(c.id, {
    status: decision,
    review,
    history: [...(c.history || []), historyEntry],
  });

  if (decision === "Complaint Valid / Confirmed") {
    await upsertStatus(c.property_id, {
      verification_status: "Verification Revoked",
      verification_revocation_reason: reason.trim(),
      verification_revoked_by_id: reviewer.id,
      verification_revoked_by: reviewerName,
      verification_revoked_at: reviewedAt,
      verification_revoked_complaint_id: c.id,
    });
    await E.Verification.create({
      property_id: c.property_id,
      reviewer_name: reviewerName,
      reviewer_id: reviewer.id,
      reviewer_role: "Government Administrator (Demo)",
      status: "Verification Revoked",
      remarks: reason.trim(),
      removal_reason: reason.trim(),
      complaint_id: c.id,
      complaint_number: c.complaint_number,
      reviewed_at: reviewedAt,
    });
    await log(
      c.property_id,
      "Verification Revoked",
      `Complaint ${c.complaint_number} confirmed by ${reviewerName} on ${reviewedAt}. Reason: ${reason.trim()}`,
      reviewedAt,
    );
  } else {
    await log(
      c.property_id,
      "Complaint Rejected",
      `Complaint ${c.complaint_number} rejected by ${reviewerName} on ${reviewedAt}. Verification status was not changed. Reason: ${reason.trim()}`,
      reviewedAt,
    );
  }

  await notify(
    c.created_by_id,
    `Complaint ${decision === "Complaint Rejected" ? "rejected" : "confirmed"}`,
    `Your complaint ${c.complaint_number} was reviewed: ${decision}.`,
    "/complaints",
  );
}

/* ---------------- Property verification ---------------- */
export async function verifyProperty(property_id, status, remarks, checklist, reviewer, role) {
  requireGovernmentReviewer(reviewer);
  if (status === "Verified") {
    const applications = await E.ULPINApplication.filter({ property_id });
    const propertyStatus = await E.PropertyStatus.filter({ property_id });
    const latestSurveyorReview = applications
      .map((application) => application.surveyor_review?.reviewed_at)
      .filter(Boolean)
      .sort()
      .at(-1);
    const revokedAt = propertyStatus[0]?.verification_revoked_at;
    if (!latestSurveyorReview || (revokedAt && latestSurveyorReview <= revokedAt)) {
      throw new Error("A Surveyor must complete a new review before Government can verify this property.");
    }
  }
  if (status === "Verified" && !Object.values(checklist || {}).length) {
    throw new Error("Complete the property verification checklist before marking the property verified.");
  }
  if (status === "Verified" && !Object.values(checklist).every(Boolean)) {
    throw new Error("Complete every property verification checklist item before marking the property verified.");
  }
  await E.Verification.create({ property_id, reviewer_name: who(reviewer), reviewer_role: role, status, remarks, checklist });
  await upsertStatus(property_id, { verification_status: status });
  await log(property_id, status === "Verified" ? "Property Verified" : "Verification: Correction Required", remarks || `Marked ${status} (demo workflow).`);
}

export async function removeVerification(property_id, reason, remarks, reviewer) {
  requireGovernmentReviewer(reviewer);
  const by = who(reviewer);
  await E.Verification.create({
    property_id,
    reviewer_name: by,
    reviewer_role: "Government Administrator (Demo)",
    status: "Verification Removed",
    remarks: remarks ? `${reason} — ${remarks}` : reason,
    removal_reason: reason,
  });
  await upsertStatus(property_id, { verification_status: "Verification Removed" });
  await log(
    property_id,
    "Verification Removed",
    `Verification removed by ${by} — Reason: ${reason}.${remarks ? ` Remarks: ${remarks}.` : ""} The previous verification remains in history; the property is eligible for re-verification.`
  );
}