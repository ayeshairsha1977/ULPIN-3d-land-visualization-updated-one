// Write-side data access used by the workflow service. Every query is parameterized and
// column names come from fixed allow-lists, never from request input.

const JSON_COLUMNS = new Set([
  "details", "documents", "checklist", "gis_check", "surveyor_review", "ai_extractions",
  "history", "evidence", "review", "revocation",
]);

const UPDATABLE = {
  applications: ["status", "checklist", "surveyor_review", "ai_extractions", "remarks", "demo_ulpin", "history", "reviewed_at"],
  complaints: ["status", "priority", "assigned_officer", "review", "history", "details"],
  property_status: ["ulpin", "ulpin_status", "verification_status", "revocation"],
};

const encode = (column, value) => (JSON_COLUMNS.has(column) && value !== null ? JSON.stringify(value) : value);

function updateStatement(table, key, id, patch) {
  const columns = Object.keys(patch);
  const unknown = columns.filter((c) => !UPDATABLE[table].includes(c));
  if (unknown.length) throw new Error(`Cannot update ${table}.${unknown.join(", ")}`);
  const sets = columns.map((c, i) => `${c} = $${i + 2}`);
  return {
    text: `UPDATE ${table} SET ${[...sets, "updated_at = now()"].join(", ")} WHERE ${key} = $1 RETURNING *`,
    values: [id, ...columns.map((c) => encode(c, patch[c]))],
  };
}

export async function nextNumber(db, sequence, format) {
  if (!SEQUENCES.has(sequence)) throw new Error(`Unknown sequence ${sequence}`);
  const { rows } = await db.query("SELECT nextval($1::regclass) AS n", [sequence]);
  return format(Number(rows[0].n));
}

export const APPLICATION_SEQ = "application_number_seq";
export const COMPLAINT_SEQ = "complaint_number_seq";
export const DEMO_ULPIN_SEQ = "demo_ulpin_seq";
const SEQUENCES = new Set([APPLICATION_SEQ, COMPLAINT_SEQ, DEMO_ULPIN_SEQ]);

// Row locks stop two reviewers acting on the same record at once.
export async function lockApplication(db, id) {
  const { rows } = await db.query("SELECT * FROM applications WHERE id = $1 FOR UPDATE", [id]);
  return rows[0] || null;
}

export async function lockComplaint(db, id) {
  const { rows } = await db.query("SELECT * FROM complaints WHERE id = $1 FOR UPDATE", [id]);
  return rows[0] || null;
}

export async function insertApplication(db, a) {
  const { rows } = await db.query(
    `INSERT INTO applications (application_number, created_by_id, property_id, status, latitude, longitude, details, documents, gis_check, history)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [a.application_number, a.created_by_id, a.property_id, a.status, a.latitude, a.longitude,
      JSON.stringify(a.details), JSON.stringify(a.documents), JSON.stringify(a.gis_check), JSON.stringify(a.history)],
  );
  return rows[0];
}

export async function updateApplication(db, id, patch) {
  const { rows } = await db.query(updateStatement("applications", "id", id, patch));
  return rows[0];
}

export async function insertComplaint(db, c) {
  const { rows } = await db.query(
    `INSERT INTO complaints (complaint_number, created_by_id, property_id, status, category, description, details, evidence, history)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [c.complaint_number, c.created_by_id, c.property_id, c.status, c.category, c.description,
      JSON.stringify(c.details), JSON.stringify(c.evidence), JSON.stringify(c.history)],
  );
  return rows[0];
}

export async function updateComplaint(db, id, patch) {
  const { rows } = await db.query(updateStatement("complaints", "id", id, patch));
  return rows[0];
}

export async function getStatus(db, propertyId, { lock = false } = {}) {
  const { rows } = await db.query(`SELECT * FROM property_status WHERE property_id = $1${lock ? " FOR UPDATE" : ""}`, [propertyId]);
  return rows[0] || null;
}

export async function updateStatus(db, propertyId, patch) {
  const { rows } = await db.query(updateStatement("property_status", "property_id", propertyId, patch));
  return rows[0];
}

export async function insertVerification(db, v) {
  await db.query(
    `INSERT INTO verifications (property_id, status, reviewer_id, reviewer_name, reviewer_role, remarks, removal_reason, checklist, complaint_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [v.property_id, v.status, v.reviewer_id, v.reviewer_name, v.reviewer_role, v.remarks || "",
      v.removal_reason || null, JSON.stringify(v.checklist || {}), v.complaint_id || null],
  );
}

export const logHistory = (db, propertyId, event, description) =>
  db.query("INSERT INTO property_history (property_id, event, description) VALUES ($1, $2, $3)", [propertyId, event, description]);

export const notify = (db, userId, title, message, link) =>
  db.query("INSERT INTO notifications (user_id, title, message, link) VALUES ($1, $2, $3, $4)", [userId, title, message, link]);

export const audit = (db, actor, action, entity, entityId, details = {}) =>
  db.query(
    "INSERT INTO audit_log (actor_id, actor_role, action, entity, entity_id, details) VALUES ($1, $2, $3, $4, $5, $6)",
    [actor?.id || null, actor?.role || null, action, entity, entityId ? String(entityId) : null, JSON.stringify(details)],
  );

export async function latestSurveyorReviewAt(db, propertyId) {
  const { rows } = await db.query(
    "SELECT max((surveyor_review->>'reviewed_at')::timestamptz) AS at FROM applications WHERE property_id = $1",
    [propertyId],
  );
  return rows[0].at;
}

// Deterministic GIS check: is the submitted point inside the parcel, and how big is the parcel?
export async function gisCheck(db, propertyId, latitude, longitude) {
  if (!propertyId) return null;
  const { rows } = await db.query(
    `SELECT ST_Contains(geom, pt) AS inside,
            round(ST_Area(geom::geography)::numeric, 1) AS parcel_area_sqm,
            round(ST_Distance(geom::geography, pt::geography)::numeric, 1) AS distance_m
       FROM properties, ST_SetSRID(ST_MakePoint($3, $2), 4326) AS pt
      WHERE id = $1`,
    [propertyId, latitude, longitude],
  );
  if (!rows[0]) return null;
  return {
    point_inside_parcel: rows[0].inside,
    parcel_area_sqm: Number(rows[0].parcel_area_sqm),
    distance_from_parcel_m: Number(rows[0].distance_m),
    method: "PostGIS ST_Contains / geodesic ST_Area (WGS84)",
    checked_at: new Date().toISOString(),
  };
}

export async function filesOwnedBy(db, fileIds, ownerId) {
  if (!fileIds.length) return [];
  const { rows } = await db.query("SELECT * FROM files WHERE id = ANY($1::uuid[]) AND owner_id = $2", [fileIds, ownerId]);
  return rows;
}
