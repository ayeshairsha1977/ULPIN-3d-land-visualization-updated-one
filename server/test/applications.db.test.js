// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FULL_CHECKLIST, OUTSIDE, PDF, PROPERTY_ID, applicationPayload, body, createUser, setupTestApp, signIn,
} from "./helpers.js";

const fakeExtract = vi.fn(async () => ({
  fields: { parcel_number: { value: "DEMO-PCL-0101", confidence: 0.9, source_quote: "Plot DEMO-PCL-0101" } },
  warnings: [], summary: "Sale deed.", model: "claude-opus-5-5", generated_at: new Date().toISOString(), disclaimer: "candidate",
}));

let ctx;
let citizen;
let other;
let surveyor;
let government;

beforeAll(async () => { ctx = await setupTestApp({ extract: fakeExtract }); });
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

async function submit(overrides) {
  const file = body(await citizen.upload(PDF)).data;
  const res = await citizen.post("/api/applications", applicationPayload(file.id, overrides));
  expect(res.statusCode, res.body).toBe(201);
  return body(res).data;
}

async function surveyed() {
  const app = await submit();
  const res = await surveyor.post(`/api/applications/${app.id}/review`, { status: "Surveyor Review Complete", checklist: FULL_CHECKLIST });
  expect(res.statusCode, res.body).toBe(200);
  return app;
}

const review = (client, id, payload) => client.post(`/api/applications/${id}/review`, payload);
const propertyStatus = async () => body(await citizen.get(`/api/records/PropertyStatus?property_id=${PROPERTY_ID}`)).data[0];

describe("submitting applications", () => {
  it("needs a signed-in citizen", async () => {
    const anon = await ctx.app.inject({ method: "POST", url: "/api/applications", payload: {} });
    expect(anon.statusCode).toBe(401);
    const file = body(await surveyor.upload(PDF)).data;
    expect((await surveyor.post("/api/applications", applicationPayload(file.id))).statusCode).toBe(403);
  });

  it("uses database sequences for application numbers", async () => {
    expect((await submit()).application_number).toMatch(/^ULP-\d{4}-0001$/);
    expect((await submit({ property_id: "sarza-fastfood-hostel", latitude: 17.5571, longitude: 78.4418 })).application_number).toMatch(/^ULP-\d{4}-0002$/);
  });

  it("allows only one open application per property", async () => {
    await submit();
    const file = body(await other.upload(PDF)).data;
    const res = await other.post("/api/applications", applicationPayload(file.id));
    expect(res.statusCode).toBe(409);
  });

  it("refuses applications for a property that already has a ULPIN, leaving its status alone", async () => {
    const app = await surveyed();
    await review(government, app.id, { status: "Approved" });
    const file = body(await other.upload(PDF)).data;
    expect((await other.post("/api/applications", applicationPayload(file.id))).statusCode).toBe(409);
    expect(await propertyStatus()).toMatchObject({ ulpin_status: "Assigned", verification_status: "Verified" });
  });

  it("validates input on the server", async () => {
    const file = body(await citizen.upload(PDF)).data;
    const res = await citizen.post("/api/applications", applicationPayload(file.id, { applicant_phone: "123", latitude: 200 }));
    expect(res.statusCode).toBe(400);
    expect(Object.keys(body(res).fields)).toEqual(expect.arrayContaining(["latitude", "applicant_phone"]));
  });

  it("refuses documents uploaded by someone else", async () => {
    const theirs = body(await other.upload(PDF)).data;
    expect((await citizen.post("/api/applications", applicationPayload(theirs.id))).statusCode).toBe(403);
  });

  it("records a PostGIS check of whether the point is inside the parcel", async () => {
    const inside = await submit();
    expect(inside.gis_check).toMatchObject({ point_inside_parcel: true });
    expect(inside.gis_check.parcel_area_sqm).toBeGreaterThan(800);
    const outside = await submit({ ...OUTSIDE, property_id: "mrecw-block-3" });
    expect(outside.gis_check.point_inside_parcel).toBe(false);
    expect(outside.gis_check.distance_from_parcel_m).toBeGreaterThan(500);
  });
});

describe("who can see applications", () => {
  it("shows citizens only their own applications, staff all of them", async () => {
    await submit();
    expect(body(await other.get("/api/records/ULPINApplication")).data).toHaveLength(0);
    expect(body(await citizen.get("/api/records/ULPINApplication")).data).toHaveLength(1);
    expect(body(await surveyor.get("/api/records/ULPINApplication")).data).toHaveLength(1);
  });

  it("does not let a citizen widen the filter to someone else", async () => {
    const app = await submit();
    const res = await other.get(`/api/records/ULPINApplication?created_by_id=${app.created_by_id}`);
    expect(body(res).data).toHaveLength(0);
  });

  it("rejects filters on non-allow-listed columns", async () => {
    expect((await surveyor.get("/api/records/ULPINApplication?details=x")).statusCode).toBe(400);
  });

  it("serves a file to its owner, to staff only once it is attached to an application, never to other citizens", async () => {
    const file = body(await citizen.upload(PDF)).data;
    expect((await citizen.get(file.file_uri)).statusCode).toBe(200);
    expect((await surveyor.get(file.file_uri)).statusCode).toBe(404);
    await citizen.post("/api/applications", applicationPayload(file.id));
    expect((await surveyor.get(file.file_uri)).statusCode).toBe(200);
    expect((await other.get(file.file_uri)).statusCode).toBe(404);
  });

  it("returns 404, not 500, for malformed ids", async () => {
    expect((await surveyor.post("/api/applications/not-a-uuid/review", { status: "Under Verification" })).statusCode).toBe(404);
    expect((await citizen.get("/api/files/aaaaaaaa-aaaa-aaaa-aaaa")).statusCode).toBe(404);
  });

  it("rejects a file whose bytes do not match its type", async () => {
    const res = await citizen.upload(Buffer.from("MZ\x90\x00 not a pdf"), "application/pdf", "evil.pdf");
    expect(res.statusCode).toBe(400);
  });
});

describe("review workflow", () => {
  it("only lets surveyors do document checks", async () => {
    const app = await submit();
    expect((await review(citizen, app.id, { status: "Under Verification" })).statusCode).toBe(403);
    expect((await review(government, app.id, { status: "Under Verification" })).statusCode).toBe(403);
    expect((await review(surveyor, app.id, { status: "Under Verification" })).statusCode).toBe(200);
  });

  it("blocks surveyor hand-off with an incomplete checklist", async () => {
    const app = await submit();
    const res = await review(surveyor, app.id, { status: "Surveyor Review Complete", checklist: { Coordinates: true } });
    expect(res.statusCode).toBe(400);
  });

  it("blocks a government decision before the surveyor review", async () => {
    const app = await submit();
    expect((await review(government, app.id, { status: "Approved" })).statusCode).toBe(409);
  });

  it("does not let a surveyor approve", async () => {
    const app = await surveyed();
    expect((await review(surveyor, app.id, { status: "Approved" })).statusCode).toBe(403);
  });

  it("assigns a sequential demo ULPIN, verifies the property, and records who did it", async () => {
    const app = await surveyed();
    const res = await review(government, app.id, { status: "Approved", note: "ok" });
    const approved = body(res).data;
    expect(approved.status).toBe("ULPIN Assigned");
    expect(approved.demo_ulpin).toBe("DEMO-ULPIN-000001");
    expect(approved.surveyor_review.reviewer_name).toBe("surveyor user");
    expect(await propertyStatus()).toMatchObject({ verification_status: "Verified", ulpin: "DEMO-ULPIN-000001" });

    const { rows } = await ctx.pool.query("SELECT action, actor_role FROM audit_log WHERE entity = 'application' ORDER BY id");
    expect(rows.map((r) => `${r.actor_role}:${r.action}`)).toEqual([
      "citizen:application.submit", "surveyor:application.review", "government:application.review",
    ]);
  });

  it("refuses changes once the application is closed", async () => {
    const app = await surveyed();
    await review(government, app.id, { status: "Approved" });
    expect((await review(government, app.id, { status: "Rejected" })).statusCode).toBe(409);
  });

  it("notifies the applicant", async () => {
    await surveyed();
    const notes = body(await citizen.get("/api/records/Notification")).data;
    expect(notes.map((n) => n.title)).toContain("Application: Surveyor Review Complete");
    expect(body(await other.get("/api/records/Notification")).data).toHaveLength(0);
  });
});

describe("AI extraction runs", () => {
  it("runs extraction server-side for staff only and stores the run", async () => {
    const app = await submit();
    expect((await citizen.post(`/api/applications/${app.id}/ai-extract`, { document_label: "Ownership Document" })).statusCode).toBe(403);
    const res = await surveyor.post(`/api/applications/${app.id}/ai-extract`, { document_label: "Ownership Document" });
    expect(res.statusCode, res.body).toBe(200);
    expect(body(res).data.run_id).toBeTruthy();
    expect(fakeExtract).toHaveBeenCalledWith(expect.objectContaining({ media_type: "application/pdf" }), expect.anything());
  });

  it("only accepts reviews of real runs and never changes status", async () => {
    const app = await submit();
    const run = body(await surveyor.post(`/api/applications/${app.id}/ai-extract`, { document_label: "Ownership Document" })).data;
    const forged = await surveyor.post(`/api/applications/${app.id}/ai-review`, { run_id: "00000000-0000-4000-8000-000000000000", note: "ok" });
    expect(forged.statusCode).toBe(404);
    const res = await surveyor.post(`/api/applications/${app.id}/ai-review`, { run_id: run.run_id, note: "Parcel no. confirmed" });
    const updated = body(res).data;
    expect(updated.status).toBe("Submitted");
    expect(updated.ai_extractions[0]).toMatchObject({ reviewer_role: "surveyor", reviewer_note: "Parcel no. confirmed" });
    expect(updated.history.at(-1).status).toBe("AI Extraction Reviewed");
  });
});
