// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ORIGIN, PASSWORD, body, createUser, setupTestApp, signIn } from "./helpers.js";

let ctx;
beforeAll(async () => { ctx = await setupTestApp(); });
afterAll(() => ctx.close());
beforeEach(() => ctx.reset());

const register = (payload, headers = { origin: ORIGIN }) =>
  ctx.app.inject({ method: "POST", url: "/api/auth/register", payload, headers });

describe("authentication", () => {
  it("registers a citizen, sets an httpOnly strict cookie, and never returns the hash", async () => {
    const res = await register({ email: "New@Example.com", full_name: "New User", password: PASSWORD });
    expect(res.statusCode).toBe(201);
    expect(body(res).data).toEqual(expect.objectContaining({ email: "new@example.com", role: "citizen" }));
    expect(res.body).not.toMatch(/password|scrypt/);
    const cookie = res.cookies.find((c) => c.name === "ulpin_session");
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: "Strict" });
  });

  it("ignores a role sent during registration", async () => {
    const res = await register({ email: "sneaky@example.com", full_name: "S", password: PASSWORD, role: "government" });
    expect(body(res).data.role).toBe("citizen");
  });

  it("rejects duplicate emails and short passwords", async () => {
    await register({ email: "a@example.com", full_name: "A", password: PASSWORD });
    expect((await register({ email: "a@example.com", full_name: "A", password: PASSWORD })).statusCode).toBe(409);
    expect((await register({ email: "b@example.com", full_name: "B", password: "short" })).statusCode).toBe(400);
  });

  it("returns the same error for a wrong password and an unknown email", async () => {
    await createUser(ctx.pool, "citizen");
    const wrong = await ctx.app.inject({ method: "POST", url: "/api/auth/login", payload: { email: "citizen@test.local", password: "nope-nope-nope" } });
    const unknown = await ctx.app.inject({ method: "POST", url: "/api/auth/login", payload: { email: "ghost@test.local", password: "nope-nope-nope" } });
    expect(wrong.statusCode).toBe(401);
    expect(body(wrong).error).toBe(body(unknown).error);
  });

  it("reports the signed-in user and forgets them after logout", async () => {
    await createUser(ctx.pool, "surveyor");
    const client = await signIn(ctx.app, "surveyor@test.local");
    expect(body(await client.get("/api/auth/me")).data.role).toBe("surveyor");
    await client.post("/api/auth/logout");
    expect(body(await client.get("/api/auth/me")).data).toBeNull();
  });

  it("ignores a forged session cookie", async () => {
    const res = await ctx.app.inject({ method: "GET", url: "/api/auth/me", headers: { cookie: "ulpin_session=forged" } });
    expect(body(res).data).toBeNull();
  });

  it("blocks state-changing requests from another origin", async () => {
    const res = await register({ email: "x@example.com", full_name: "X", password: PASSWORD }, { origin: "https://evil.example" });
    expect(res.statusCode).toBe(403);
  });

  it("rate limits login attempts", async () => {
    const { buildApp } = await import("../app.js");
    const strict = await buildApp({ pool: ctx.pool, storageDir: "/tmp", rateLimits: { global: 100, auth: 2, upload: 2, ai: 2, submit: 2 } });
    const attempt = () => strict.inject({ method: "POST", url: "/api/auth/login", payload: { email: "x@test.local", password: "wrong-password" } });
    expect((await attempt()).statusCode).toBe(401);
    expect((await attempt()).statusCode).toBe(401);
    expect((await attempt()).statusCode).toBe(429);
    await strict.close();
  });

  it("writes login attempts to the append-only audit log", async () => {
    await createUser(ctx.pool, "citizen");
    await signIn(ctx.app, "citizen@test.local");
    const { rows } = await ctx.pool.query("SELECT action FROM audit_log");
    expect(rows.map((r) => r.action)).toContain("auth.login");
    await expect(ctx.pool.query("UPDATE audit_log SET action = 'x'")).rejects.toThrow(/append-only/);
    await expect(ctx.pool.query("DELETE FROM audit_log")).rejects.toThrow(/append-only/);
  });
});
