import { localClient } from "@/api/localClient";

const OK = ["application/pdf", "image/jpeg", "image/png"];

export const isSupported = (file) => OK.includes(file.type);

export async function uploadPrivate(file) {
  const { file_uri } = await localClient.files.upload(file);
  return { name: file.name, file_uri };
}

export async function openPrivate(file_uri) {
  window.open(await localClient.files.getUrl(file_uri), "_blank", "noopener");
}