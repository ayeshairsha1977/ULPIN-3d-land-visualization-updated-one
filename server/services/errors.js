export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const forbidden = (message) => new HttpError(403, message);
export const notFound = (message) => new HttpError(404, message);
export const conflict = (message) => new HttpError(409, message);
export const badRequest = (message) => new HttpError(400, message);

export const who = (user) => user?.full_name || user?.email || "User";

export const ROLE_TITLES = {
  citizen: "Citizen / Property Owner",
  surveyor: "Surveyor / Verifier",
  government: "Government Administrator",
};

export function requireUser(request) {
  if (!request.user) throw new HttpError(401, "Please sign in.");
  return request.user;
}

export function requireRole(user, roles, message) {
  if (!user) throw new HttpError(401, "Please sign in.");
  if (!roles.includes(user.role)) throw forbidden(message);
}
