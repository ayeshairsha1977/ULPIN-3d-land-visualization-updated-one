import pg from "pg";

export function createPool(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and start the database with `docker compose up -d`.");
  return new pg.Pool({ connectionString, max: 10 });
}

// Runs fn inside one transaction and rolls back on any error.
export async function withTransaction(pool, fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
