import { z } from "zod";
import { deletePropertyPhoto, removeVerification, setPropertyPhoto, verifyProperty } from "../services/properties.js";
import { notFound, requireUser } from "../services/errors.js";
import { parse, removeVerificationInput, verifyInput } from "../services/validation.js";

const photoInput = z.object({ file_id: z.string().uuid() });

export default async function propertyRoutes(app) {
  // Deterministic GIS facts computed by PostGIS (geodesic area on WGS84).
  app.get("/:id/geo", async (request) => {
    const { rows } = await app.pool.query(
      `SELECT id, round(ST_Area(geom::geography)::numeric, 1) AS area_sqm,
              round(ST_Perimeter(geom::geography)::numeric, 1) AS perimeter_m,
              ST_Y(ST_Centroid(geom)) AS centroid_lat, ST_X(ST_Centroid(geom)) AS centroid_lng
         FROM properties WHERE id = $1`,
      [request.params.id],
    );
    if (!rows[0]) throw notFound("Property not found.");
    const r = rows[0];
    return { success: true, data: { ...r, area_sqm: Number(r.area_sqm), perimeter_m: Number(r.perimeter_m) } };
  });

  app.post("/:id/verify", async (request) => {
    const user = requireUser(request);
    await verifyProperty(app.pool, request.params.id, parse(verifyInput, request.body), user);
    return { success: true, data: null };
  });

  app.post("/:id/remove-verification", async (request) => {
    const user = requireUser(request);
    await removeVerification(app.pool, request.params.id, parse(removeVerificationInput, request.body), user);
    return { success: true, data: null };
  });

  app.put("/:id/photo", async (request) => {
    const user = requireUser(request);
    await setPropertyPhoto(app.pool, request.params.id, parse(photoInput, request.body).file_id, user);
    return { success: true, data: null };
  });

  app.delete("/:id/photo", async (request) => {
    await deletePropertyPhoto(app.pool, request.params.id, requireUser(request));
    return { success: true, data: null };
  });
}
