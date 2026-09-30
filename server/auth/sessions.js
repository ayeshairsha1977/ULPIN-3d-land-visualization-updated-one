import { createHash, randomBytes } from "node:crypto";

export const SESSION_COOKIE = "ulpin_session";
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const hashToken = (token) => createHash("sha256").update(token).digest("hex");

export async function createSession(db, userId) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.query("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)", [hashToken(token), userId, expiresAt]);
  return { token, expiresAt };
}

export async function findSessionUser(db, token) {
  if (!token) return null;
  const { rows } = await db.query(
    `SELECT u.id, u.email, u.full_name, u.role, u.created_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [hashToken(token)],
  );
  return rows[0] || null;
}

export async function deleteSession(db, token) {
  if (token) await db.query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]);
}

export const deleteExpiredSessions = (db) => db.query("DELETE FROM sessions WHERE expires_at <= now()");
