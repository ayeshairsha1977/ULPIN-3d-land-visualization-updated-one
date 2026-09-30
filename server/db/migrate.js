import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { createPool, withTransaction } from "./pool.js";

const MIGRATIONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations");

// Applies every migrations/*.sql file not yet recorded, each in its own transaction.
export async function migrate(pool) {
  await pool.query("CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
  const { rows } = await pool.query("SELECT name FROM schema_migrations");
  const applied = new Set(rows.map((r) => r.name));
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();
  const ran = [];
  for (const file of files.filter((f) => !applied.has(f))) {
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
    await withTransaction(pool, async (tx) => {
      await tx.query(sql);
      await tx.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
    });
    ran.push(file);
  }
  return ran;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pool = createPool();
  migrate(pool)
    .then((ran) => console.info(ran.length ? `Applied: ${ran.join(", ")}` : "Database is up to date."))
    .catch((error) => { console.error("Migration failed:", error.message); process.exitCode = 1; })
    .finally(() => pool.end());
}
