// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildApp } from "./app.js";

let app;
let dir;

beforeAll(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "ulpin-static-"));
  await mkdir(path.join(dir, "assets"));
  await writeFile(path.join(dir, "index.html"), "<!doctype html><div id=root></div>");
  await writeFile(path.join(dir, "assets", "index-abc123.js"), "console.log(1)");
  const pool = { query: async () => ({ rows: [] }) };
  app = await buildApp({ pool, storageDir: dir, staticDir: dir });
});

afterAll(async () => {
  await app.close();
  await rm(dir, { recursive: true, force: true });
});

describe("serving the built web app", () => {
  it("serves index.html at / with a strict CSP", async () => {
    const res = await app.inject({ method: "GET", url: "/" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-security-policy"]).toMatch(/script-src 'self'/);
    expect(res.headers["x-frame-options"]).toBe("DENY");
  });

  it("falls back to index.html for client-side routes", async () => {
    const res = await app.inject({ method: "GET", url: "/admin/applications/123" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('id=root');
    expect((await app.inject({ method: "HEAD", url: "/dashboard" })).statusCode).toBe(200);
  });

  it("caches fingerprinted assets for a year", async () => {
    const res = await app.inject({ method: "GET", url: "/assets/index-abc123.js" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["cache-control"]).toMatch(/immutable/);
  });

  it("keeps API 404s as JSON and uncached", async () => {
    const res = await app.inject({ method: "GET", url: "/api/nope" });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ success: false, error: "Not found." });
    expect(res.headers["cache-control"]).toBe("no-store");
  });
});
