import { RECORD_ENTITIES, listRecords } from "../repos/records.js";
import { openFile, saveUpload } from "../services/files.js";
import { HttpError, requireUser } from "../services/errors.js";

export default async function recordRoutes(app) {
  const UPLOAD_LIMIT = app.limit("upload");
  // GET /api/records/Complaint?property_id=... -> rows the signed-in user may see.
  app.get("/records/:entity", async (request) => {
    const { entity } = request.params;
    if (!RECORD_ENTITIES.includes(entity)) throw new HttpError(404, "Unknown record type.");
    const rows = await listRecords(app.pool, entity, request.query || {}, request.user);
    if (rows === null) throw new HttpError(401, "Please sign in.");
    return { success: true, data: rows };
  });

  app.post("/notifications/read-all", async (request) => {
    const user = requireUser(request);
    await app.pool.query("UPDATE notifications SET read = true WHERE user_id = $1 AND read = false", [user.id]);
    return { success: true, data: null };
  });

  // Raw file body; the original name travels in a header so no multipart parser is needed.
  app.post("/files", UPLOAD_LIMIT, async (request, reply) => {
    const user = requireUser(request);
    let name;
    try {
      name = decodeURIComponent(String(request.headers["x-file-name"] || ""));
    } catch {
      throw new HttpError(400, "The file name header is not valid.");
    }
    const data = await saveUpload(app.pool, app.storageDir, user, {
      name,
      mediaType: request.headers["content-type"],
      bytes: request.body,
    });
    return reply.code(201).send({ success: true, data });
  });

  app.get("/files/:id", async (request, reply) => {
    const { file, stream } = await openFile(app.pool, app.storageDir, request.params.id, request.user);
    return reply
      .header("Content-Type", file.media_type)
      .header("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(file.original_name)}`)
      .header("Content-Security-Policy", "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox")
      .header("Content-Length", file.size_bytes)
      .send(stream);
  });
}
