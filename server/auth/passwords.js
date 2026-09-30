import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
// N=2^17, r=8 (OWASP guidance). Parameters are stored per hash, so old hashes still verify.
const PARAMS = { N: 131072, r: 8, p: 1 };
const MAXMEM = 256 * 1024 * 1024;

// Stored as scrypt$N$r$p$salt$hash so parameters can be raised later without breaking old hashes.
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, KEY_LENGTH, { ...PARAMS, maxmem: MAXMEM });
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password, stored) {
  const [scheme, N, r, p, salt, hash] = String(stored).split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const key = await scryptAsync(password, Buffer.from(salt, "base64"), expected.length, { N: Number(N), r: Number(r), p: Number(p), maxmem: MAXMEM });
  return timingSafeEqual(key, expected);
}

// Used when the email is unknown, so a failed login takes the same time either way.
export const DUMMY_HASH = await hashPassword(randomBytes(16).toString("hex"));
