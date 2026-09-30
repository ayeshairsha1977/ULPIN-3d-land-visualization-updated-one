// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import server from "./index.js";

let base;

beforeAll(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

const post = (body, contentType = "application/json") =>
  fetch(`${base}/api/extract`, { method: "POST", headers: { "Content-Type": contentType }, body });

describe("AI extraction HTTP API", () => {
  it("reports health with the configured model", async () => {
    const res = await fetch(`${base}/api/health`);
    expect(res.status).toBe(200);
    expect((await res.json()).data.model).toMatch(/^claude-/);
  });

  it("returns 404 for unknown routes", async () => {
    expect((await fetch(`${base}/api/nope`)).status).toBe(404);
  });

  it("requires a JSON content type", async () => {
    const res = await post("hello", "text/plain");
    expect(res.status).toBe(415);
  });

  it("rejects malformed JSON", async () => {
    const res = await post("{not json");
    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
  });

  it("rejects a file whose bytes do not match its declared type", async () => {
    const res = await post(JSON.stringify({ filename: "x.pdf", media_type: "application/pdf", data: Buffer.from("MZ....").toString("base64") }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/not a valid application\/pdf/);
  });

  it("answers 413 for bodies larger than the upload limit", async () => {
    const res = await post(JSON.stringify({ filename: "x.pdf", media_type: "application/pdf", data: "A".repeat(15 * 1024 * 1024) }));
    expect(res.status).toBe(413);
    expect((await res.json()).error).toMatch(/larger than 10 MB/);
  });
});
