// Thin fetch wrapper for the ULPIN API. The session lives in an httpOnly cookie, so no
// token is ever stored or readable in JavaScript.

export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = fields || {};
  }
}

async function request(method, url, { json, body, headers } = {}) {
  let response;
  try {
    response = await fetch(url, {
      method,
      credentials: "same-origin",
      headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
      body: json !== undefined ? JSON.stringify(json) : body,
    });
  } catch {
    throw new ApiError("The server is not reachable. Is `npm run server` running?", 0);
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    throw new ApiError(payload?.error || `Request failed (HTTP ${response.status}).`, response.status, payload?.fields);
  }
  return payload.data;
}

export const api = {
  get: (url) => request("GET", url),
  post: (url, json = {}) => request("POST", url, { json }),
  put: (url, json = {}) => request("PUT", url, { json }),
  delete: (url) => request("DELETE", url),
  upload: (file) => request("POST", "/api/files", {
    body: file,
    headers: { "Content-Type": file.type, "X-File-Name": encodeURIComponent(file.name) },
  }),
};

export function listRecords(entity, query) {
  const params = new URLSearchParams(Object.entries(query || {}).filter(([, v]) => v !== undefined && v !== null));
  const qs = params.toString();
  return api.get(`/api/records/${entity}${qs ? `?${qs}` : ""}`);
}
