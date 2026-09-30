import http from "node:http";
import { pathToFileURL } from "node:url";
import { ExtractionError, MAX_DOCUMENT_BYTES, MODEL, extractDocument, parseExtractRequest } from "./extract.js";

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
// base64 inflates by ~4/3; leave room for the JSON wrapper.
const MAX_BODY_BYTES = Math.ceil(MAX_DOCUMENT_BYTES * 1.4);
const RATE_LIMIT = { windowMs: 60_000, max: 10 };

// Fixed-window counter per client address. Behind a reverse proxy remoteAddress is the
// proxy, so a deployment would key this on the authenticated user instead.
const windows = new Map();

export function isRateLimited(ip, now = Date.now()) {
  const current = windows.get(ip);
  if (!current || now >= current.resetAt) {
    windows.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return false;
  }
  if (current.count >= RATE_LIMIT.max) return true;
  windows.set(ip, { ...current, count: current.count + 1 });
  return false;
}

function sweepExpiredWindows(now = Date.now()) {
  for (const [ip, { resetAt }] of windows) if (now >= resetAt) windows.delete(ip);
}

function send(res, status, body) {
  if (res.headersSent || res.destroyed) return;
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(JSON.stringify(body));
}

const tooLarge = () => new ExtractionError("The document is larger than 10 MB.", 413);

// Rejects oversized bodies but keeps draining them, so the 413 reply reaches the client
// instead of a connection reset.
function readJson(req) {
  return new Promise((resolve, reject) => {
    if (Number(req.headers["content-length"]) > MAX_BODY_BYTES) {
      req.resume();
      reject(tooLarge());
      return;
    }
    const chunks = [];
    let size = 0;
    let overflowed = false;
    req.on("data", (chunk) => {
      if (overflowed) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        overflowed = true;
        chunks.length = 0;
        reject(tooLarge());
        return;
      }
      chunks.push(chunk);
    });
    req.on("aborted", () => reject(new ExtractionError("The upload was cancelled.", 400)));
    req.on("end", () => {
      if (overflowed) return;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new ExtractionError("Request body must be JSON.", 400));
      }
    });
    req.on("error", reject);
  });
}

async function handleExtract(req, res) {
  if (!req.headers["content-type"]?.startsWith("application/json")) {
    return send(res, 415, { success: false, error: "Content-Type must be application/json." });
  }
  if (isRateLimited(req.socket.remoteAddress || "unknown")) {
    return send(res, 429, { success: false, error: "Too many extraction requests. Please wait a minute." });
  }
  const document = parseExtractRequest(await readJson(req));
  // Stop the (billed) model call if the browser goes away before we answer.
  const controller = new AbortController();
  res.on("close", () => { if (!res.writableFinished) controller.abort(); });
  const data = await extractDocument(document, { signal: controller.signal });
  return send(res, 200, { success: true, data });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/api/health") {
      return send(res, 200, { success: true, data: { model: MODEL } });
    }
    if (req.method === "POST" && req.url === "/api/extract") return await handleExtract(req, res);
    return send(res, 404, { success: false, error: "Not found." });
  } catch (error) {
    if (error instanceof ExtractionError) return send(res, error.status, { success: false, error: error.message });
    console.error("[extract] unexpected error", error);
    return send(res, 500, { success: false, error: "Unexpected server error." });
  }
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  setInterval(sweepExpiredWindows, RATE_LIMIT.windowMs).unref();
  server.listen(PORT, HOST, () => console.info(`[extract] AI extraction API on http://${HOST}:${PORT}`));
}

export default server;
