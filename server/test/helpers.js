import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildApp } from "../app.js";
import { hashPassword } from "../auth/passwords.js";
import { migrate } from "../db/migrate.js";
import { createPool } from "../db/pool.js";
import { seedProperties } from "../db/seed.js";

export const TEST_DB_URL = process.env.DATABASE_URL_TEST || "postgres://ulpin:ulpin_local_dev@127.0.0.1:55432/ulpin_test";
export const PASSWORD = "correct-horse-battery";
export const ORIGIN = "http://localhost:5173";
export const PROPERTY_ID = "sree-lalitha-hostel-2";
// Centre of the demo polygon for PROPERTY_ID (inside), and a point ~1 km away (outside).
export const INSIDE = { latitude: 17.5578, longitude: 78.4392 };
export const OUTSIDE = { latitude: 17.5678, longitude: 78.4392 };

export const PDF = Buffer.from("%PDF-1.7\n1 0 obj<<>>endobj\n");
export const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);

const TABLES = [
  "ai_extraction_runs", "property_photos", "notifications", "property_history", "verifications",
  "complaints", "applications", "files", "sessions", "property_status", "properties", "users",
];

let passwordHash;

export async function setupTestApp({ extract } = {}) {
  const pool = createPool(TEST_DB_URL);
  await migrate(pool);
  passwordHash ||= await hashPassword(PASSWORD);
  const storageDir = await mkdtemp(path.join(os.tmpdir(), "ulpin-files-"));
  const app = await buildApp({ pool, storageDir, allowedOrigins: [ORIGIN], extract, rateLimits: { global: 10000, auth: 1000, upload: 1000, ai: 1000, submit: 1000 } });
  return {
    app,
    pool,
    async reset() {
      // audit_log refuses TRUNCATE by design; tests bypass the trigger explicitly.
      await pool.query("ALTER TABLE audit_log DISABLE TRIGGER USER");
      await pool.query(`TRUNCATE audit_log, ${TABLES.join(", ")} RESTART IDENTITY CASCADE`);
      await pool.query("ALTER TABLE audit_log ENABLE TRIGGER USER");
      await pool.query("ALTER SEQUENCE application_number_seq RESTART; ALTER SEQUENCE complaint_number_seq RESTART; ALTER SEQUENCE demo_ulpin_seq RESTART");
      await seedProperties(pool);
    },
    async close() {
      await app.close();
      await pool.end();
      await rm(storageDir, { recursive: true, force: true });
    },
  };
}

export async function createUser(pool, role, email = `${role}@test.local`) {
  const { rows } = await pool.query(
    "INSERT INTO users (email, full_name, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, email, role",
    [email, `${role} user`, role, passwordHash],
  );
  return rows[0];
}

// Returns a small client bound to one signed-in user.
export async function signIn(app, email) {
  const res = await app.inject({ method: "POST", url: "/api/auth/login", payload: { email, password: PASSWORD } });
  if (res.statusCode !== 200) throw new Error(`login failed for ${email}: ${res.body}`);
  const cookie = res.cookies.find((c) => c.name === "ulpin_session");
  const headers = { cookie: `ulpin_session=${cookie.value}`, origin: ORIGIN };
  const call = (method) => (url, payload) => app.inject({ method, url, payload, headers });
  return {
    get: call("GET"),
    post: call("POST"),
    put: call("PUT"),
    delete: call("DELETE"),
    upload: (bytes, type = "application/pdf", name = "deed.pdf") =>
      app.inject({ method: "POST", url: "/api/files", payload: bytes, headers: { ...headers, "content-type": type, "x-file-name": name } }),
  };
}

export const body = (res) => JSON.parse(res.body);

export function applicationPayload(ownershipFileId, overrides = {}) {
  return {
    property_id: PROPERTY_ID,
    property_name: "Sree Lalitha Girls Hostel 2",
    property_type: "Hostel",
    state: "Telangana",
    district: "Medchal-Malkajgiri",
    mandal: "Qutbullapur",
    locality: "Kompally",
    ...INSIDE,
    parcel_number: "DEMO-PCL-0101",
    plot_area: "902 m²",
    land_type: "Residential",
    building_type: "G + 5",
    floors: "G + 5",
    applicant_name: "Asha Rani",
    applicant_phone: "9876543210",
    applicant_email: "asha@example.com",
    applicant_address: "Kompally, Hyderabad",
    documents: [{ label: "Ownership Document", file_id: ownershipFileId }],
    ...overrides,
  };
}

export const FULL_CHECKLIST = {
  "Parcel Information": true, Coordinates: true, "Building Information": true, Documents: true, "3D Representation": true,
};
