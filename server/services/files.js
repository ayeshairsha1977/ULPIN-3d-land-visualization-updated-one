import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { ALLOWED_MEDIA_TYPES, MAX_FILE_BYTES, matchesSignature } from "../lib/fileTypes.js";
import { audit } from "../repos/store.js";
import { badRequest, forbidden, notFound } from "./errors.js";

export const USER_QUOTA = { files: 100, bytes: 200 * 1024 * 1024 };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function assertWithinQuota(pool, userId, incomingBytes) {
  const { rows } = await pool.query("SELECT count(*)::int AS n, coalesce(sum(size_bytes), 0)::bigint AS bytes FROM files WHERE owner_id = $1", [userId]);
  if (rows[0].n >= USER_QUOTA.files || Number(rows[0].bytes) + incomingBytes > USER_QUOTA.bytes) {
    throw badRequest("Upload limit reached for this account.");
  }
}

// Files live on local disk under a random id; the original name is only metadata.
// A deployment would swap this for object storage plus malware scanning.
export async function saveUpload(pool, storageDir, user, { name, mediaType, bytes }) {
  if (!user) throw forbidden("Sign in to upload files.");
  const originalName = String(name || "").replace(/[\\/\0]/g, "_").slice(0, 255);
  if (!originalName) throw badRequest("A file name is required.");
  if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) throw badRequest("Please upload a PDF, JPG, PNG or WEBP file.");
  if (!bytes?.length) throw badRequest("The file is empty.");
  if (bytes.length > MAX_FILE_BYTES) throw badRequest("The file is larger than 10 MB.");
  if (!matchesSignature(bytes, mediaType)) throw badRequest("The file content does not match its type.");
  await assertWithinQuota(pool, user.id, bytes.length);

  const id = randomUUID();
  const target = path.join(storageDir, id);
  await mkdir(storageDir, { recursive: true });
  await writeFile(target, bytes, { flag: "wx" });
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  try {
    await pool.query(
      "INSERT INTO files (id, owner_id, original_name, media_type, size_bytes, sha256) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, user.id, originalName, mediaType, bytes.length, sha256],
    );
  } catch (error) {
    await unlink(target).catch(() => {});
    throw error;
  }
  await audit(pool, user, "file.upload", "file", id, { size: bytes.length, sha256 });
  return { id, name: originalName, type: mediaType, size: bytes.length, file_uri: `/api/files/${id}` };
}

// Staff may open a file only through a record they are allowed to review.
async function staffCanRead(pool, fileId, role) {
  const ref = JSON.stringify([{ file_id: fileId }]);
  const { rows } = await pool.query(
    `SELECT EXISTS (SELECT 1 FROM applications WHERE documents @> $1::jsonb) AS in_application,
            EXISTS (SELECT 1 FROM complaints WHERE evidence @> $1::jsonb) AS in_complaint`,
    [ref],
  );
  return rows[0].in_application || (role === "government" && rows[0].in_complaint);
}

export async function openFile(pool, storageDir, id, user) {
  if (!UUID.test(id)) throw notFound("File not found.");
  const { rows } = await pool.query("SELECT * FROM files WHERE id = $1", [id]);
  const file = rows[0];
  if (!file) throw notFound("File not found.");
  const allowed = file.is_public
    || (user && user.id === file.owner_id)
    || (user && ["surveyor", "government"].includes(user.role) && await staffCanRead(pool, file.id, user.role));
  if (!allowed) throw notFound("File not found.");
  return { file, stream: createReadStream(path.join(storageDir, file.id)) };
}
