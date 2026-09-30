import { withTransaction } from "../db/pool.js";
import { audit, getStatus, insertVerification, latestSurveyorReviewAt, logHistory, updateStatus } from "../repos/store.js";
import { ROLE_TITLES, badRequest, conflict, notFound, requireRole, who } from "./errors.js";

export const PROPERTY_CHECKLIST = ["2D map & boundary", "3D model", "Property data", "Documents"];
const GOV_ONLY = "Government reviewer access is required for this action.";

async function lockExistingStatus(tx, propertyId) {
  const status = await getStatus(tx, propertyId, { lock: true });
  if (!status) throw notFound("Property not found.");
  return status;
}

export async function verifyProperty(pool, propertyId, { status, remarks, checklist }, reviewer) {
  requireRole(reviewer, ["government"], GOV_ONLY);
  return withTransaction(pool, async (tx) => {
    const current = await lockExistingStatus(tx, propertyId);
    if (status === "Verified") {
      const surveyedAt = await latestSurveyorReviewAt(tx, propertyId);
      const revokedAt = current.revocation?.verification_revoked_at;
      if (!surveyedAt || (revokedAt && new Date(surveyedAt) <= new Date(revokedAt))) {
        throw conflict("A Surveyor must complete a new review before Government can verify this property.");
      }
      if (!PROPERTY_CHECKLIST.every((item) => checklist[item] === true)) {
        throw badRequest("Complete every property verification checklist item before marking the property verified.");
      }
    }
    await insertVerification(tx, {
      property_id: propertyId, status, reviewer_id: reviewer.id, reviewer_name: who(reviewer),
      reviewer_role: `${ROLE_TITLES.government} (Demo)`, remarks, checklist,
    });
    await updateStatus(tx, propertyId, { verification_status: status });
    await logHistory(tx, propertyId, status === "Verified" ? "Property Verified" : "Verification: Correction Required", `Government marked the property ${status} (demo workflow).`);
    await audit(tx, reviewer, "property.verify", "property", propertyId, { from: current.verification_status, to: status });
  });
}

export async function removeVerification(pool, propertyId, { reason, remarks }, reviewer) {
  requireRole(reviewer, ["government"], GOV_ONLY);
  return withTransaction(pool, async (tx) => {
    const current = await lockExistingStatus(tx, propertyId);
    const by = who(reviewer);
    await insertVerification(tx, {
      property_id: propertyId, status: "Verification Removed", reviewer_id: reviewer.id, reviewer_name: by,
      reviewer_role: `${ROLE_TITLES.government} (Demo)`, remarks: remarks ? `${reason} — ${remarks}` : reason, removal_reason: reason,
    });
    await updateStatus(tx, propertyId, { verification_status: "Verification Removed" });
    await logHistory(tx, propertyId, "Verification Removed",
      `Government removed verification. Reason category: ${reason}. The previous verification remains in history; the property is eligible for re-verification.`);
    await audit(tx, reviewer, "property.remove_verification", "property", propertyId, { from: current.verification_status, reason });
  });
}

export async function setPropertyPhoto(pool, propertyId, fileId, user) {
  requireRole(user, ["government"], GOV_ONLY);
  return withTransaction(pool, async (tx) => {
    await lockExistingStatus(tx, propertyId);
    const { rows } = await tx.query("SELECT media_type FROM files WHERE id = $1 AND owner_id = $2", [fileId, user.id]);
    if (!rows[0]) throw badRequest("Upload the photo first.");
    if (!rows[0].media_type.startsWith("image/")) throw badRequest("The building photo must be an image.");
    await tx.query(
      "UPDATE files SET is_public = false WHERE id = (SELECT file_id FROM property_photos WHERE property_id = $1) AND id <> $2",
      [propertyId, fileId],
    );
    await tx.query("UPDATE files SET is_public = true WHERE id = $1", [fileId]);
    await tx.query(
      `INSERT INTO property_photos (property_id, file_id, uploaded_by_id) VALUES ($1, $2, $3)
       ON CONFLICT (property_id) DO UPDATE SET file_id = EXCLUDED.file_id, uploaded_by_id = EXCLUDED.uploaded_by_id, updated_at = now()`,
      [propertyId, fileId, user.id],
    );
    await audit(tx, user, "property.photo_set", "property", propertyId, { file_id: fileId });
  });
}

export async function deletePropertyPhoto(pool, propertyId, user) {
  requireRole(user, ["government"], GOV_ONLY);
  const { rows } = await pool.query("DELETE FROM property_photos WHERE property_id = $1 RETURNING file_id", [propertyId]);
  if (!rows[0]) throw notFound("This property has no photo.");
  await pool.query("UPDATE files SET is_public = false WHERE id = $1", [rows[0].file_id]);
  await audit(pool, user, "property.photo_delete", "property", propertyId);
}
