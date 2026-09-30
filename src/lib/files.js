import { api } from "@/api/apiClient";

// Client-side checks give fast feedback. The server repeats the type, size and
// signature checks before it stores anything.
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 5;

const TYPES = {
  "application/pdf": { ext: /\.pdf$/i, magic: [[0x25, 0x50, 0x44, 0x46]] }, // %PDF
  "image/jpeg": { ext: /\.jpe?g$/i, magic: [[0xff, 0xd8, 0xff]] },
  "image/png": { ext: /\.png$/i, magic: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
};

export const isSupported = (file) => Boolean(TYPES[file?.type]?.ext.test(file?.name || ""));

const startsWith = (bytes, signature) => signature.every((b, i) => bytes[i] === b);

async function readHeader(file, length = 8) {
  const blob = file.slice(0, length);
  const buffer = typeof blob.arrayBuffer === "function"
    ? await blob.arrayBuffer()
    : await new Response(blob).arrayBuffer();
  return new Uint8Array(buffer);
}

// Returns an error message, or "" when the file passes every check.
export async function validateFile(file) {
  if (!file) return "No file selected.";
  if (!isSupported(file)) return "Please upload a supported document (PDF, JPG or PNG).";
  if (file.size === 0) return `${file.name} is empty.`;
  if (file.size > MAX_FILE_BYTES) return `${file.name} is larger than ${MAX_FILE_BYTES / (1024 * 1024)} MB.`;
  const header = await readHeader(file);
  if (!TYPES[file.type].magic.some((sig) => startsWith(header, sig))) {
    return `${file.name} does not look like a real ${file.type === "application/pdf" ? "PDF" : "image"} file.`;
  }
  return "";
}

export async function validateFiles(files, alreadyAttached = 0) {
  if (files.length + alreadyAttached > MAX_FILES_PER_UPLOAD) {
    return `You can attach at most ${MAX_FILES_PER_UPLOAD} files.`;
  }
  for (const file of files) {
    const error = await validateFile(file);
    if (error) return error;
  }
  return "";
}

export async function uploadPrivate(file) {
  const saved = await api.upload(file);
  return { file_id: saved.id, name: saved.name, type: saved.type, size: saved.size, file_uri: saved.file_uri };
}

// file_uri is always a same-origin /api/files/<id> path, served only to permitted users.
export function openPrivate(file_uri) {
  if (!String(file_uri).startsWith("/api/files/")) return;
  window.open(file_uri, "_blank", "noopener");
}
