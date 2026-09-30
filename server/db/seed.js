import { pathToFileURL } from "node:url";
import { PROPERTIES } from "../../src/data/properties.js";
import { hashPassword } from "../auth/passwords.js";
import { createPool } from "./pool.js";

// Leaflet-style [lat, lng] ring -> closed WKT polygon in lng/lat order.
export function polygonWkt(latLngRing) {
  const ring = [...latLngRing, latLngRing[0]].map(([lat, lng]) => `${lng} ${lat}`);
  return `POLYGON((${ring.join(", ")}))`;
}

export async function seedProperties(db) {
  for (const p of PROPERTIES) {
    await db.query(
      `INSERT INTO properties (id, name, geom) VALUES ($1, $2, ST_GeomFromText($3, 4326))
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, geom = EXCLUDED.geom`,
      [p.id, p.name, polygonWkt(p.polygon)],
    );
    await db.query("INSERT INTO property_status (property_id) VALUES ($1) ON CONFLICT DO NOTHING", [p.id]);
  }
}

export const DEMO_USERS = [
  { email: "citizen@demo.local", full_name: "Citizen Demo", role: "citizen" },
  { email: "surveyor@demo.local", full_name: "Surveyor Demo", role: "surveyor" },
  { email: "government@demo.local", full_name: "Government Demo", role: "government" },
];

// Staff accounts can only be created here (or by an administrator), never by self-registration.
export async function seedDemoUsers(db, password) {
  const hash = await hashPassword(password);
  for (const u of DEMO_USERS) {
    await db.query(
      `INSERT INTO users (email, full_name, role, password_hash) VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [u.email, u.full_name, u.role, hash],
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pool = createPool();
  const password = process.env.SEED_DEMO_PASSWORD;
  (async () => {
    await seedProperties(pool);
    console.info(`Seeded ${PROPERTIES.length} demo properties.`);
    if (!password) {
      console.info("SEED_DEMO_PASSWORD not set: skipped demo accounts.");
    } else if (password.length < 10) {
      throw new Error("SEED_DEMO_PASSWORD must be at least 10 characters.");
    } else {
      await seedDemoUsers(pool, password);
      console.info(`Demo accounts: ${DEMO_USERS.map((u) => u.email).join(", ")} (password from SEED_DEMO_PASSWORD).`);
    }
  })()
    .catch((error) => { console.error("Seed failed:", error.message); process.exitCode = 1; })
    .finally(() => pool.end());
}
