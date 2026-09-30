// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { FULL_CHECKLIST, PDF, PNG, PROPERTY_ID, applicationPayload, body, createUser, setupTestApp, signIn } from "./helpers.js";

let ctx;
let citizen;
let other;
let surveyor;
let government;

beforeAll(async () => { ctx = await setupTestApp(); });
afterAll(() => ctx.close());
beforeEach(async () => {
  await ctx.reset();
  for (const role of ["citizen", "surveyor", "government"]) await createUser(ctx.pool, role);
  await createUser(ctx.pool, "citizen", "other@test.local");
  citizen = await signIn(ctx.app, "citizen@test.local");
  other = await signIn(ctx.app, "other@test.local");
  surveyor = await signIn(ctx.app, "surveyor@test.local");
  government = await signIn(ctx.app, "government@test.local");
});

const status = async () => body(await citizen.get(`/api/records/PropertyStatus?property_id=${PROPERTY_ID}`)).data[0];

async function raise() {
  const res = await citizen.post("/api/complaints", { property_id: PROPERTY_ID, category: "Wrong floor count", description: "Floor count differs from site" });
  expect(res.statusCode, res.body).toBe(201);
  return body(res).data;
}

async function underReview() {
  const c = await raise();
  expect((await government.post(`/api/complaints/${c.id}/status`, { status: "Under Government Review" })).statusCode).toBe(200);
  return c;
}

async function surveyApplication() {
  const file = body(await citizen.upload(PDF)).data;
  const app = body(await citizen.post("/api/applications", applicationPayload(file.id))).data;
  await surveyor.post(`/api/applications/${app.id}/review`, { status: "Surveyor Review Complete", checklist: FULL_CHECKLIST });
}

describe("complaints", () => {
  it("fills reporter details from the session, not the request", async () => {
    const res = await citizen.post("/api/complaints", {
      property_id: PROPERTY_ID, category: "Other", description: "Something is off here", reporter_email: "fake@evil.example",
    });
    expect(body(res).data.reporter_email).toBe("citizen@test.local");
  });

  it("does not change verification when submitted", async () => {
    await raise();
    expect((await status()).verification_status).toBe("Pending Verification");
  });

  it("hides complaints from other citizens and from surveyors", async () => {
    await raise();
    expect(body(await other.get("/api/records/Complaint")).data).toHaveLength(0);
    expect(body(await surveyor.get("/api/records/Complaint")).data).toHaveLength(0);
    expect(body(await government.get("/api/records/Complaint")).data).toHaveLength(1);
  });

  it("only lets government act on complaints", async () => {
    const c = await raise();
    expect((await surveyor.post(`/api/complaints/${c.id}/status`, { status: "Under Government Review" })).statusCode).toBe(403);
    expect((await citizen.post(`/api/complaints/${c.id}/priority`, { priority: "High" })).statusCode).toBe(403);
  });

  it("requires review to start, and a reason, before a decision", async () => {
    const c = await raise();
    expect((await government.post(`/api/complaints/${c.id}/decision`, { decision: "Complaint Rejected", reason: "no" })).statusCode).toBe(409);
    await government.post(`/api/complaints/${c.id}/status`, { status: "Under Government Review" });
    expect((await government.post(`/api/complaints/${c.id}/decision`, { decision: "Complaint Rejected", reason: "  " })).statusCode).toBe(400);
  });

  it("keeps verification when rejected, revokes it when confirmed", async () => {
    const rejected = await underReview();
    await government.post(`/api/complaints/${rejected.id}/decision`, { decision: "Complaint Rejected", reason: "Records match" });
    expect((await status()).verification_status).toBe("Pending Verification");

    const confirmed = await underReview();
    const res = await government.post(`/api/complaints/${confirmed.id}/decision`, { decision: "Complaint Valid / Confirmed", reason: "Extra floor on site" });
    expect(body(res).data.review.reviewer_role).toBe("government");
    const staffView = body(await government.get(`/api/records/PropertyStatus?property_id=${PROPERTY_ID}`)).data[0];
    expect(staffView).toMatchObject({ verification_status: "Verification Revoked", verification_revoked_complaint_id: confirmed.id });
    const publicView = await status();
    expect(publicView.verification_status).toBe("Verification Revoked");
    expect(publicView.verification_revoked_complaint_id).toBeUndefined();
    expect(publicView.verification_revocation_reason).toBeUndefined();
  });

  it("refuses to change a complaint after its decision", async () => {
    const c = await underReview();
    await government.post(`/api/complaints/${c.id}/decision`, { decision: "Complaint Rejected", reason: "No issue" });
    expect((await government.post(`/api/complaints/${c.id}/status`, { status: "Under Review" })).statusCode).toBe(409);
  });

  it("does not allow final outcomes through the plain status route", async () => {
    const c = await raise();
    expect((await government.post(`/api/complaints/${c.id}/status`, { status: "Complaint Rejected" })).statusCode).toBe(400);
  });
});

describe("property verification", () => {
  const CHECKS = { "2D map & boundary": true, "3D model": true, "Property data": true, Documents: true };

  it("needs a surveyor review and a full checklist", async () => {
    expect((await government.post(`/api/properties/${PROPERTY_ID}/verify`, { status: "Verified", checklist: CHECKS })).statusCode).toBe(409);
    await surveyApplication();
    expect((await government.post(`/api/properties/${PROPERTY_ID}/verify`, { status: "Verified", checklist: { "3D model": true } })).statusCode).toBe(400);
    expect((await government.post(`/api/properties/${PROPERTY_ID}/verify`, { status: "Verified", checklist: CHECKS })).statusCode).toBe(200);
    expect((await status()).verification_status).toBe("Verified");
  });

  it("only lets government remove verification", async () => {
    expect((await surveyor.post(`/api/properties/${PROPERTY_ID}/remove-verification`, { reason: "x" })).statusCode).toBe(403);
    expect((await government.post(`/api/properties/${PROPERTY_ID}/remove-verification`, { reason: "Survey discrepancy" })).statusCode).toBe(200);
    expect((await status()).verification_status).toBe("Verification Removed");
  });

  it("computes parcel area with PostGIS", async () => {
    const geo = body(await citizen.get(`/api/properties/${PROPERTY_ID}/geo`)).data;
    expect(geo.area_sqm).toBeGreaterThan(800);
    expect(geo.area_sqm).toBeLessThan(1000);
  });

  it("makes a building photo public while it is set, and private again once replaced or deleted", async () => {
    const guestGet = (uri) => ctx.app.inject({ method: "GET", url: uri });
    const first = body(await government.upload(PNG, "image/png", "front.png")).data;
    expect((await guestGet(first.file_uri)).statusCode).toBe(404);
    expect((await government.put(`/api/properties/${PROPERTY_ID}/photo`, { file_id: first.id })).statusCode).toBe(200);
    expect((await guestGet(first.file_uri)).statusCode).toBe(200);

    const second = body(await government.upload(PNG, "image/png", "side.png")).data;
    await government.put(`/api/properties/${PROPERTY_ID}/photo`, { file_id: second.id });
    expect((await guestGet(first.file_uri)).statusCode).toBe(404);
    await government.delete(`/api/properties/${PROPERTY_ID}/photo`);
    expect((await guestGet(second.file_uri)).statusCode).toBe(404);
  });

  it("does not expose reviewer identities or complaint reasons to guests", async () => {
    const c = await underReview();
    await government.post(`/api/complaints/${c.id}/decision`, { decision: "Complaint Valid / Confirmed", reason: "Secret site finding" });
    const guest = (url) => ctx.app.inject({ method: "GET", url }).then(body);
    const verifications = (await guest(`/api/records/Verification?property_id=${PROPERTY_ID}`)).data;
    const history = (await guest(`/api/records/PropertyHistory?property_id=${PROPERTY_ID}`)).data;
    const text = JSON.stringify({ verifications, history });
    expect(text).not.toMatch(/Secret site finding|government user|reviewer_id|complaint_id|CMP-/);
    expect(verifications[0]).toMatchObject({ status: "Verification Revoked" });
  });

  it("hides complaint evidence from surveyors", async () => {
    const evidence = body(await citizen.upload(PNG, "image/png", "crack.png")).data;
    await citizen.post("/api/complaints", { property_id: PROPERTY_ID, category: "Other", description: "Crack in the wall here", evidence: [{ file_id: evidence.id }] });
    expect((await surveyor.get(evidence.file_uri)).statusCode).toBe(404);
    expect((await government.get(evidence.file_uri)).statusCode).toBe(200);
  });
});
