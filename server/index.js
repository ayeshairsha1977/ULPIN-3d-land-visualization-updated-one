import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "./app.js";
import { deleteExpiredSessions } from "./auth/sessions.js";
import { createPool } from "./db/pool.js";
import { migrate } from "./db/migrate.js";
import { chooseExtractor } from "./ai/provider.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";

const pool = createPool();
const ai = chooseExtractor();
await migrate(pool);

const app = await buildApp({
  pool,
  storageDir: process.env.STORAGE_DIR || path.join(HERE, "storage"),
  allowedOrigins: (process.env.APP_ORIGINS || "http://localhost:5173").split(",").map((o) => o.trim()),
  // Fail closed: cookies are Secure unless explicitly disabled for plain-http local development.
  secureCookies: process.env.COOKIE_SECURE !== "false",
  trustProxy: process.env.TRUST_PROXY ? JSON.parse(process.env.TRUST_PROXY) : false,
  logger: { level: process.env.LOG_LEVEL || "info" },
  extract: ai.extract,
  // Set in the Docker image: serve the built web app from the same origin as the API.
  staticDir: process.env.STATIC_DIR ? path.resolve(process.env.STATIC_DIR) : null,
});
app.log.info(`AI document extraction provider: ${ai.name}`);

setInterval(() => deleteExpiredSessions(pool).catch((err) => app.log.error({ err }, "session cleanup failed")), 60 * 60 * 1000).unref();

const shutdown = async () => {
  await app.close();
  await pool.end();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await app.listen({ port: PORT, host: HOST });
