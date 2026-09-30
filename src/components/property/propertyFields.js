import { polygonAreaSqm, fmtNum } from "@/lib/geo";

export const propertyFields = (p, status) => [
  { label: "Property ID", value: p.propertyCode, mono: true, demo: true },
  { label: "Parcel Number", value: p.parcelNumber, mono: true, demo: true },
  { label: "Property Type", value: p.type },
  { label: "Land Use", value: p.landUse, demo: true },
  { label: "Area (demo boundary)", value: `≈ ${fmtNum(polygonAreaSqm(p.polygon))} m²`, demo: true },
  { label: "Latitude", value: p.lat.toFixed(5), mono: true, demo: true },
  { label: "Longitude", value: p.lng.toFixed(5), mono: true, demo: true },
  { label: "Number of Floors", value: p.floorsLabel },
  { label: "Building Height", value: p.heightLabel, demo: true },
  { label: "Verification Status", value: status.verification_status },
];