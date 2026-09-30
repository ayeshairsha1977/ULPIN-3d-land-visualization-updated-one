// Approximate planar measurements on DEMO boundaries (not survey-grade).
const toXY = ([lat, lng], lat0) => [lng * 111320 * Math.cos((lat0 * Math.PI) / 180), lat * 110540];

export function polygonAreaSqm(poly) {
  const lat0 = poly[0][0];
  const pts = poly.map((p) => toXY(p, lat0));
  let a = 0;
  pts.forEach(([x1, y1], i) => {
    const [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  });
  return Math.abs(a / 2);
}

export function polygonPerimeterM(poly) {
  const lat0 = poly[0][0];
  const pts = poly.map((p) => toXY(p, lat0));
  return pts.reduce((s, [x1, y1], i) => {
    const [x2, y2] = pts[(i + 1) % pts.length];
    return s + Math.hypot(x2 - x1, y2 - y1);
  }, 0);
}

export const allBounds = (props) => props.flatMap((p) => p.polygon);

export const fmtNum = (n) => Math.round(n).toLocaleString("en-IN");