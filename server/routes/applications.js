import { readFile } from "node:fs/promises";
import path from "node:path";
import { recordAiReview, reviewApplication, saveAiRun, submitApplication } from "../services/applications.js";
import { conflict, notFound, requireRole, requireUser } from "../services/errors.js";
import { aiExtractInput, aiReviewInput, applicationInput, parse, reviewInput } from "../services/validation.js";

export default async function applicationRoutes(app) {
  const AI_LIMIT = app.limit("ai");
  app.post("/", app.limit("submit"), async (request, reply) => {
    const user = requireUser(request);
    const data = await submitApplication(app.pool, parse(applicationInput, request.body), user);
    return reply.code(201).send({ success: true, data });
  });

  app.post("/:id/review", async (request) => {
    const user = requireUser(request);
    const data = await reviewApplication(app.pool, request.params.id, parse(reviewInput, request.body), user);
    return { success: true, data };
  });

  // Runs Claude on one stored document. The result is kept server-side as a run that a
  // reviewer can later sign off; nothing about the application changes here.
  app.post("/:id/ai-extract", AI_LIMIT, async (request) => {
    const user = requireUser(request);
    requireRole(user, ["surveyor", "government"], "Surveyor or Government access is required for AI extraction.");
    const { document_label } = parse(aiExtractInput, request.body);
    const { rows } = await app.pool.query("SELECT status, documents FROM applications WHERE id = $1", [request.params.id]);
    if (!rows[0]) throw notFound("Application not found.");
    if (["ULPIN Assigned", "Rejected"].includes(rows[0].status)) throw conflict("This application is closed.");
    const doc = rows[0].documents.find((d) => d.label === document_label);
    if (!doc) throw notFound("That document is not attached to this application.");
    const { rows: files } = await app.pool.query("SELECT * FROM files WHERE id = $1", [doc.file_id]);
    if (!files[0]) throw notFound("The stored file is missing.");

    const bytes = await readFile(path.join(app.storageDir, files[0].id));
    const controller = new AbortController();
    request.raw.on("close", () => { if (!request.raw.complete) controller.abort(); });
    const result = await app.extract(
      { filename: files[0].original_name, media_type: files[0].media_type, data: bytes.toString("base64") },
      { signal: controller.signal },
    );
    const runId = await saveAiRun(app.pool, request.params.id, document_label, result, user);
    return { success: true, data: { run_id: runId, ...result } };
  });

  app.post("/:id/ai-review", async (request) => {
    const user = requireUser(request);
    const data = await recordAiReview(app.pool, request.params.id, parse(aiReviewInput, request.body), user);
    return { success: true, data };
  });
}
