import { createHash } from "node:crypto";
import { DUMMY_HASH, hashPassword, verifyPassword } from "../auth/passwords.js";
import { SESSION_COOKIE, createSession, deleteSession } from "../auth/sessions.js";
import { audit } from "../repos/store.js";
import { HttpError } from "../services/errors.js";
import { loginInput, parse, registerInput } from "../services/validation.js";

const publicUser = (u) => ({ id: u.id, email: u.email, full_name: u.full_name, role: u.role, created_date: u.created_at });

export default async function authRoutes(app) {
  const AUTH_LIMIT = app.limit("auth");
  const startSession = async (reply, user) => {
    const { token, expiresAt } = await createSession(app.pool, user.id);
    reply.setCookie(SESSION_COOKIE, token, { ...app.cookieOptions, expires: expiresAt });
  };

  // Self-registration always creates a citizen. Staff accounts are provisioned separately.
  app.post("/register", AUTH_LIMIT, async (request, reply) => {
    const input = parse(registerInput, request.body);
    const hash = await hashPassword(input.password);
    const { rows } = await app.pool.query(
      `INSERT INTO users (email, full_name, role, password_hash) VALUES ($1, $2, 'citizen', $3)
       ON CONFLICT (email) DO NOTHING RETURNING *`,
      [input.email, input.full_name, hash],
    );
    if (!rows[0]) throw new HttpError(409, "An account with this email already exists.");
    await audit(app.pool, rows[0], "auth.register", "user", rows[0].id);
    await startSession(reply, rows[0]);
    return reply.code(201).send({ success: true, data: publicUser(rows[0]) });
  });

  app.post("/login", AUTH_LIMIT, async (request, reply) => {
    const input = parse(loginInput, request.body);
    const { rows } = await app.pool.query("SELECT * FROM users WHERE email = $1", [input.email]);
    const user = rows[0];
    const ok = await verifyPassword(input.password, user?.password_hash || DUMMY_HASH);
    if (!user || !ok) {
      // Hashed so failed attempts cannot write arbitrary text into the permanent audit log.
      const emailHash = createHash("sha256").update(input.email).digest("hex").slice(0, 16);
      await audit(app.pool, null, "auth.login_failed", "user", user?.id || null, { email_sha256_16: emailHash });
      throw new HttpError(401, "Incorrect email or password.");
    }
    await audit(app.pool, user, "auth.login", "user", user.id);
    await startSession(reply, user);
    return { success: true, data: publicUser(user) };
  });

  app.post("/logout", async (request, reply) => {
    await deleteSession(app.pool, request.cookies[SESSION_COOKIE]);
    reply.clearCookie(SESSION_COOKIE, app.cookieOptions);
    return { success: true, data: null };
  });

  app.get("/me", async (request) => ({ success: true, data: request.user ? publicUser(request.user) : null }));
}
