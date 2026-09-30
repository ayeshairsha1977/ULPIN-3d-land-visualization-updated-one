import { beforeEach, describe, expect, it } from "vitest";
import { localClient } from "@/api/localClient";
import {
  decideComplaint,
  recordAiExtractionReview,
  removeVerification,
  reviewApplication,
  submitApplication,
  submitComplaint,
  updateComplaint,
  verifyProperty,
} from "@/services/workflow";

const E = localClient.entities;
const PROPERTY_ID = "sree-lalitha-hostel-2";
const FULL_CHECKLIST = {
  "Parcel Information": true,
  Coordinates: true,
  "Building Information": true,
  Documents: true,
  "3D Representation": true,
};

const citizen = { id: "u-citizen", full_name: "Citizen", demo_role: "citizen" };
const surveyor = { id: "u-surveyor", full_name: "Surveyor", demo_role: "surveyor" };
const government = { id: "u-gov", full_name: "Officer", demo_role: "government" };

const reload = async (entity, id) => (await E[entity].filter({ id }))[0];
const statusOf = async () => (await E.PropertyStatus.filter({ property_id: PROPERTY_ID }))[0];

async function newApplication() {
  return submitApplication({ property_id: PROPERTY_ID, property_name: "Hostel" }, citizen);
}

async function surveyedApplication() {
  const app = await newApplication();
  await reviewApplication(app, "Surveyor Review Complete", "ok", surveyor, { checklist: FULL_CHECKLIST });
  return reload("ULPINApplication", app.id);
}

async function complaintUnderReview() {
  const c = await submitComplaint({ property_id: PROPERTY_ID, category: "Wrong floor count", description: "Floor count differs" }, citizen);
  await updateComplaint(c, "Under Government Review", "", government);
  return reload("Complaint", c.id);
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("ULPIN application workflow", () => {
  it("assigns sequential demo application numbers", async () => {
    const first = await newApplication();
    const second = await newApplication();
    expect(first.application_number).toMatch(/^ULP-\d{4}-0001$/);
    expect(second.application_number).toMatch(/^ULP-\d{4}-0002$/);
  });

  it("rejects a citizen trying to approve an application", async () => {
    const app = await surveyedApplication();
    await expect(reviewApplication(app, "Approved", "", citizen, { checklist: FULL_CHECKLIST }))
      .rejects.toThrow(/Government reviewer access/);
  });

  it("rejects a surveyor trying to make the government decision", async () => {
    const app = await surveyedApplication();
    await expect(reviewApplication(app, "Approved", "", surveyor, { checklist: FULL_CHECKLIST }))
      .rejects.toThrow(/Government reviewer access/);
  });

  it("rejects a citizen doing surveyor document checks", async () => {
    const app = await newApplication();
    await expect(reviewApplication(app, "Under Verification", "", citizen)).rejects.toThrow(/Surveyor access/);
  });

  it("blocks government approval before the surveyor review", async () => {
    const app = await newApplication();
    await expect(reviewApplication(app, "Approved", "", government, { checklist: FULL_CHECKLIST }))
      .rejects.toThrow(/Surveyor must complete the review/);
  });

  it("blocks surveyor hand-off with an incomplete checklist", async () => {
    const app = await newApplication();
    await expect(reviewApplication(app, "Surveyor Review Complete", "", surveyor, { checklist: { Coordinates: true } }))
      .rejects.toThrow(/Complete every verification checklist item/);
  });

  it("never lets anyone jump straight to Under Government Review", async () => {
    const app = await newApplication();
    await expect(reviewApplication(app, "Under Government Review", "", government)).rejects.toThrow(/only after a Surveyor/);
  });

  it("assigns a clearly-labelled demo ULPIN after surveyor + government approval", async () => {
    const app = await surveyedApplication();
    await reviewApplication(app, "Approved", "approved", government, { checklist: FULL_CHECKLIST });

    const updated = await reload("ULPINApplication", app.id);
    expect(updated.status).toBe("ULPIN Assigned");
    expect(updated.demo_ulpin).toMatch(/^DEMO-ULPIN-\d{6}$/);
    expect(updated.surveyor_review.reviewer_id).toBe(surveyor.id);

    const status = await statusOf();
    expect(status.verification_status).toBe("Verified");
    expect(status.ulpin).toBe(updated.demo_ulpin);
  });
});

describe("complaint workflow", () => {
  it("does not change verification when a complaint is submitted", async () => {
    await submitComplaint({ property_id: PROPERTY_ID, category: "Other", description: "Something is off" }, citizen);
    expect((await statusOf()).verification_status).toBe("Pending Verification");
  });

  it("only lets government update complaints", async () => {
    const c = await submitComplaint({ property_id: PROPERTY_ID, category: "Other", description: "Something is off" }, citizen);
    await expect(updateComplaint(c, "Under Government Review", "", surveyor)).rejects.toThrow(/Government reviewer access/);
  });

  it("requires government review to start before a decision", async () => {
    const c = await submitComplaint({ property_id: PROPERTY_ID, category: "Other", description: "Something is off" }, citizen);
    await expect(decideComplaint(c, "Complaint Rejected", "no issue", government)).rejects.toThrow(/Start government review/);
  });

  it("requires a reason for the decision", async () => {
    const c = await complaintUnderReview();
    await expect(decideComplaint(c, "Complaint Rejected", "   ", government)).rejects.toThrow(/reason is required/);
  });

  it("keeps verification when a complaint is rejected", async () => {
    const c = await complaintUnderReview();
    await decideComplaint(c, "Complaint Rejected", "Records match site visit", government);
    expect((await statusOf()).verification_status).toBe("Pending Verification");
    expect((await reload("Complaint", c.id)).review.reviewer_id).toBe(government.id);
  });

  it("revokes verification when a complaint is confirmed", async () => {
    const c = await complaintUnderReview();
    await decideComplaint(c, "Complaint Valid / Confirmed", "Extra floor found on site", government);
    const status = await statusOf();
    expect(status.verification_status).toBe("Verification Revoked");
    expect(status.verification_revoked_complaint_id).toBe(c.id);
  });

  it("refuses to modify a complaint after the final decision", async () => {
    const c = await complaintUnderReview();
    await decideComplaint(c, "Complaint Rejected", "No issue", government);
    const decided = await reload("Complaint", c.id);
    await expect(updateComplaint(decided, "Under Government Review", "", government)).rejects.toThrow(/already received a government decision/);
  });
});

describe("AI extraction review", () => {
  const aiResult = { fields: {}, warnings: [], summary: "Sale deed", model: "claude-opus-5-5" };

  it("does not let a citizen record an AI review", async () => {
    const app = await newApplication();
    await expect(recordAiExtractionReview(app, "Ownership Document", aiResult, "checked", citizen))
      .rejects.toThrow(/Surveyor or Government access/);
  });

  it("requires the reviewer to say what they checked", async () => {
    const app = await newApplication();
    await expect(recordAiExtractionReview(app, "Ownership Document", aiResult, "  ", surveyor))
      .rejects.toThrow(/Add a note/);
  });

  it("stores the AI candidate with the reviewer and never changes status", async () => {
    const app = await newApplication();
    await recordAiExtractionReview(app, "Ownership Document", aiResult, "Parcel no. confirmed on page 2", surveyor);
    const updated = await reload("ULPINApplication", app.id);
    expect(updated.status).toBe("Submitted");
    expect(updated.ai_extractions).toHaveLength(1);
    expect(updated.ai_extractions[0]).toMatchObject({ reviewer_id: surveyor.id, document_label: "Ownership Document" });
    expect(updated.history.at(-1).status).toBe("AI Extraction Reviewed");
    expect((await statusOf()).verification_status).toBe("Pending Verification");
  });
});

describe("property verification", () => {
  const PROPERTY_CHECKS = { "2D map & boundary": true, "3D model": true, "Property data": true, Documents: true };

  it("requires a surveyor review before government can verify", async () => {
    await expect(verifyProperty(PROPERTY_ID, "Verified", "", PROPERTY_CHECKS, government, "Gov"))
      .rejects.toThrow(/Surveyor must complete a new review/);
  });

  it("requires every checklist item before verifying", async () => {
    await surveyedApplication();
    await expect(verifyProperty(PROPERTY_ID, "Verified", "", { "3D model": true, Documents: false }, government, "Gov"))
      .rejects.toThrow(/Complete every property verification checklist item/);
  });

  it("verifies after surveyor review and a full checklist", async () => {
    await surveyedApplication();
    await verifyProperty(PROPERTY_ID, "Verified", "ok", PROPERTY_CHECKS, government, "Gov");
    expect((await statusOf()).verification_status).toBe("Verified");
  });

  it("only lets government remove verification", async () => {
    await expect(removeVerification(PROPERTY_ID, "Other", "", surveyor)).rejects.toThrow(/Government reviewer access/);
    await removeVerification(PROPERTY_ID, "Survey discrepancy", "", government);
    expect((await statusOf()).verification_status).toBe("Verification Removed");
  });
});
