// Read side: turns rows into the record shape the React app already uses, and applies
// row-level access rules per role. Filters are limited to indexed, allow-listed columns.

const iso = (d) => (d instanceof Date ? d.toISOString() : d ?? null);

const fileUri = (id) => `/api/files/${id}`;

const mapDocuments = (docs = []) => docs.map((d) => ({ ...d, file_uri: fileUri(d.file_id) }));

const MAPPERS = {
  ULPINApplication: (r) => ({
    ...r.details,
    id: r.id,
    application_number: r.application_number,
    created_by_id: r.created_by_id,
    property_id: r.property_id,
    status: r.status,
    latitude: r.latitude,
    longitude: r.longitude,
    documents: mapDocuments(r.documents),
    checklist: r.checklist,
    gis_check: r.gis_check,
    surveyor_review: r.surveyor_review,
    ai_extractions: r.ai_extractions,
    remarks: r.remarks,
    demo_ulpin: r.demo_ulpin,
    history: r.history,
    submitted_at: iso(r.submitted_at),
    reviewed_at: iso(r.reviewed_at),
    created_date: iso(r.created_at),
    updated_date: iso(r.updated_at),
  }),
  Complaint: (r) => ({
    ...r.details,
    id: r.id,
    complaint_number: r.complaint_number,
    created_by_id: r.created_by_id,
    property_id: r.property_id,
    status: r.status,
    priority: r.priority,
    category: r.category,
    description: r.description,
    evidence: mapDocuments(r.evidence),
    assigned_officer: r.assigned_officer,
    review: r.review,
    history: r.history,
    created_date: iso(r.created_at),
    updated_date: iso(r.updated_at),
  }),
  // Public record types: staff see reviewer details; everyone else gets only what a
  // public property record should show (no names, ids, remarks or complaint links).
  PropertyStatus: (r, staff) => ({
    id: `status-${r.property_id}`,
    property_id: r.property_id,
    ulpin: r.ulpin || "",
    ulpin_status: r.ulpin_status,
    verification_status: r.verification_status,
    ...(staff ? r.revocation || {} : { verification_revoked_at: r.revocation?.verification_revoked_at }),
    created_date: iso(r.updated_at),
  }),
  Verification: (r, staff) => ({
    id: r.id,
    property_id: r.property_id,
    status: r.status,
    reviewer_role: r.reviewer_role,
    removal_reason: r.removal_reason,
    ...(staff ? {
      reviewer_id: r.reviewer_id, reviewer_name: r.reviewer_name, remarks: r.remarks,
      checklist: r.checklist, complaint_id: r.complaint_id,
    } : {}),
    reviewed_at: iso(r.created_at),
    created_date: iso(r.created_at),
  }),
  PropertyHistory: (r) => ({
    id: r.id, property_id: r.property_id, event: r.event, description: r.description,
    event_date: iso(r.event_date), created_date: iso(r.created_at),
  }),
  Notification: (r) => ({
    id: r.id, user_id: r.user_id, title: r.title, message: r.message, link: r.link, read: r.read, created_date: iso(r.created_at),
  }),
  PropertyPhoto: (r, staff) => ({
    id: r.id,
    property_id: r.property_id,
    file_uri: fileUri(r.file_id),
    file_name: r.original_name,
    ...(staff ? { uploaded_by: r.uploaded_by } : {}),
    created_date: iso(r.created_at),
    updated_date: iso(r.updated_at),
  }),
};

const isStaff = (user) => user?.role === "surveyor" || user?.role === "government";

// scope(user) returns an extra WHERE clause (using $OWNER for the user id) or null for "no access".
const ANYONE = () => "";
const OWN_UNLESS = (...staffRoles) => (user) => {
  if (!user) return null;
  return staffRoles.includes(user.role) ? "" : "created_by_id = $OWNER";
};

const SOURCES = {
  ULPINApplication: { table: "applications", filters: ["id", "property_id", "created_by_id"], scope: OWN_UNLESS("surveyor", "government") },
  Complaint: { table: "complaints", filters: ["id", "property_id", "created_by_id"], scope: OWN_UNLESS("government") },
  Notification: { table: "notifications", filters: ["id", "user_id"], scope: (user) => (user ? "user_id = $OWNER" : null) },
  PropertyStatus: { table: "property_status", filters: ["property_id"], scope: ANYONE, order: "property_id" },
  Verification: { table: "verifications", filters: ["property_id"], scope: ANYONE },
  PropertyHistory: { table: "property_history", filters: ["property_id"], scope: ANYONE },
  PropertyPhoto: {
    table: "property_photos",
    select: `SELECT p.*, f.original_name, u.full_name AS uploaded_by
               FROM property_photos p JOIN files f ON f.id = p.file_id JOIN users u ON u.id = p.uploaded_by_id`,
    column: (c) => `p.${c}`,
    filters: ["property_id"],
    scope: ANYONE,
    order: "p.created_at DESC",
  },
};

export const RECORD_ENTITIES = Object.keys(SOURCES);

export class AccessError extends Error {}

export async function listRecords(db, entity, query, user, limit = 200) {
  const source = SOURCES[entity];
  if (!source) throw new AccessError(`Unknown record type: ${entity}`);
  const scope = source.scope(user);
  if (scope === null) return null;

  const column = source.column || ((c) => c);
  const clauses = [];
  const values = [];
  for (const [key, value] of Object.entries(query)) {
    if (!source.filters.includes(key)) throw new AccessError(`Cannot filter ${entity} by ${key}`);
    values.push(String(value));
    clauses.push(`${column(key)}::text = $${values.length}`);
  }
  if (scope) {
    values.push(user.id);
    clauses.push(column(scope.replace("$OWNER", `$${values.length}`)));
  }
  values.push(limit);
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const select = source.select || `SELECT * FROM ${source.table}`;
  const order = source.order || "created_at DESC";
  const { rows } = await db.query(`${select} ${where} ORDER BY ${order} LIMIT $${values.length}`, values);
  const staff = isStaff(user);
  return rows.map((row) => MAPPERS[entity](row, staff));
}

export const toApplication = MAPPERS.ULPINApplication;
export const toComplaint = MAPPERS.Complaint;
