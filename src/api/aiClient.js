import { readPrivate } from "@/lib/files";

async function toBase64(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

// Sends one stored document to the AI extraction API (server/) and returns its result.
export async function extractDocumentFields(doc) {
  const blob = await readPrivate(doc.file_uri);
  const media_type = blob.type || doc.type;
  let response;
  try {
    response = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: doc.name, media_type, data: await toBase64(blob) }),
    });
  } catch {
    throw new Error("The AI extraction service is not reachable. Start it with `npm run server`.");
  }
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success) {
    throw new Error(body?.error || `The AI extraction service failed (HTTP ${response.status}).`);
  }
  return body.data;
}
