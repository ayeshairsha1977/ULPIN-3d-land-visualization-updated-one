import Fastify from "fastify";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { SESSION_COOKIE, findSessionUser } from "./auth/sessions.js";
import { ExtractionError, extractDocument } from "./extract.js";
import { AccessError } from "./repos/records.js";
import { HttpError } from "./services/errors.js";
import { ValidationError } from "./services/validation.js";
import authRoutes from "./routes/auth.js";
import recordRoutes from "./routes/records.js";
import applicationRoutes from "./routes/applications.js";
import complaintRoutes from "./routes/complaints.js";
import propertyRoutes from "./routes/properties.js";
import { MAX_FILE_BYTES } from "./lib/fileTypes.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function errorReply(error, request, reply) {
  if (error instanceof ValidationError) return reply.code(400).send({ success: false, error: error.message, fields: error.fields });
  if (error instanceof HttpError || error instanceof ExtractionError) {
    return reply.code(error.status).send({ success: false, error: error.message });
  }
  if (error instanceof AccessError) return reply.code(400).send({ success: false, error: error.message });
  if (error.statusCode && error.statusCode < 500) {
    const message = error.statusCode === 413 ? "The upload is larger than 10 MB." : error.message;
    return reply.code(error.statusCode).send({ success: false, error: message });
  }
  request.log.error({ err: error }, "unhandled error");
  return reply.code(500).send({ success: false, error: "Unexpected server error." });
}

/**
 * @param {{ pool: import("pg").Pool, storageDir: string, allowedOrigins?: string[],
 *           secureCookies?: boolean, extract?: typeof extractDocument, logger?: boolean | object,
 *           rateLimits?: typeof DEFAULT_RATE_LIMITS, trustProxy?: boolean | number | string }} options
 */
export const DEFAULT_RATE_LIMITS = { global: 300, auth: 10, upload: 30, ai: 10, submit: 10 };

export async function buildApp({
  pool, storageDir, allowedOrigins = ["http://localhost:5173"], secureCookies = false,
  extract = extractDocument, logger = false, rateLimits = DEFAULT_RATE_LIMITS, trustProxy = false,
}) {
  // Behind a reverse proxy set trustProxy, or every client shares the proxy's IP for rate limits.
  const app = Fastify({ logger, bodyLimit: 1024 * 1024, trustProxy });
  await app.register(cookie);
  await app.register(rateLimit, { global: true, max: rateLimits.global, timeWindow: "1 minute" });

  app.decorate("pool", pool);
  app.decorate("storageDir", storageDir);
  app.decorate("extract", extract);
  app.decorate("limit", (name) => ({ config: { rateLimit: { max: rateLimits[name], timeWindow: "1 minute" } } }));
  app.decorate("cookieOptions", { httpOnly: true, sameSite: "strict", secure: secureCookies, path: "/" });
  app.decorateRequest("user", null);

  app.addContentTypeParser(["application/pdf", "image/jpeg", "image/png", "image/webp"],
    { parseAs: "buffer", bodyLimit: MAX_FILE_BYTES }, (_req, body, done) => done(null, body));

  // CSRF defence in depth: cookies are SameSite=Strict, and browser writes must come from our origin.
  app.addHook("onRequest", async (request, reply) => {
    const origin = request.headers.origin;
    if (!SAFE_METHODS.has(request.method) && origin && !allowedOrigins.includes(origin)) {
      return reply.code(403).send({ success: false, error: "Cross-origin request blocked." });
    }
    request.user = await findSessionUser(pool, request.cookies[SESSION_COOKIE]);
  });

  // Record ids are UUIDs; anything else is simply "not found" rather than a database error.
  app.addHook("preValidation", async (request, reply) => {
    const id = request.params?.id;
    if (id && /^\/api\/(applications|complaints)\//.test(request.routeOptions.url || "") && !UUID.test(id)) {
      return reply.code(404).send({ success: false, error: "Not found." });
    }
  });

  app.addHook("onSend", async (_request, reply, payload) => {
    reply.header("Cache-Control", "no-store");
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("X-Frame-Options", "DENY");
    reply.header("Referrer-Policy", "no-referrer");
    if (secureCookies) reply.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    return payload;
  });

  app.setErrorHandler(errorReply);
  app.setNotFoundHandler((_request, reply) => reply.code(404).send({ success: false, error: "Not found." }));

  app.get("/api/health", async () => {
    await pool.query("SELECT 1");
    return { success: true, data: { database: "ok" } };
  });

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(recordRoutes, { prefix: "/api" });
  await app.register(applicationRoutes, { prefix: "/api/applications" });
  await app.register(complaintRoutes, { prefix: "/api/complaints" });
  await app.register(propertyRoutes, { prefix: "/api/properties" });
  return app;
}
