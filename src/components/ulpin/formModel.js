import { polygonAreaSqm, fmtNum } from "@/lib/geo";

export const STEPS = ["Property Location", "Parcel Information", "Applicant Information", "Documents", "Review"];
export const LAND_TYPES = ["Residential", "Commercial", "Mixed-use", "Educational", "Agricultural", "Other"];
export const DOC_SLOTS = ["Ownership Document", "Property Document", "Survey Document", "Supporting Document"];

export const blankForm = (user) => ({
  property_id: "", property_name: "", property_type: "",
  state: "Telangana", district: "", mandal: "", locality: "", latitude: "", longitude: "",
  parcel_number: "", plot_area: "", land_type: "", building_type: "", floors: "",
  applicant_name: user?.full_name || "", applicant_phone: "", applicant_email: user?.email || "", applicant_address: "",
  documents: [],
});

export const fromProperty = (p) => ({
  property_id: p.id, property_name: p.name, property_type: p.type,
  state: p.state, district: p.district, mandal: p.mandal, locality: p.locality,
  latitude: p.lat.toFixed(6), longitude: p.lng.toFixed(6),
  parcel_number: p.parcelNumber, plot_area: `${fmtNum(polygonAreaSqm(p.polygon))} m² (demo boundary)`,
  land_type: p.landUse, building_type: p.buildingType, floors: p.floorsLabel,
});

const req = (f, keys, e) => keys.forEach((k) => { if (!String(f[k] || "").trim()) e[k] = "This field is required."; });

export function validate(step, f) {
  const e = {};
  if (step === 0) {
    req(f, ["property_name", "state", "district", "mandal", "locality"], e);
    if (!f.property_name) e.property_name = "Please select a property.";
    const lat = Number(f.latitude), lng = Number(f.longitude);
    if (!f.latitude || Number.isNaN(lat) || lat < -90 || lat > 90) e.latitude = "Enter a valid latitude.";
    if (!f.longitude || Number.isNaN(lng) || lng < -180 || lng > 180) e.longitude = "Enter a valid longitude.";
  }
  if (step === 1) {
    req(f, ["plot_area", "land_type", "property_type", "building_type", "floors"], e);
    if (!/^[A-Za-z0-9][A-Za-z0-9\-/]{2,}$/.test(f.parcel_number.trim())) e.parcel_number = "Please enter a valid parcel number.";
  }
  if (step === 2) {
    req(f, ["applicant_name", "applicant_address"], e);
    if (!/^[6-9]\d{9}$/.test(f.applicant_phone.replace(/\s|\+91/g, ""))) e.applicant_phone = "Please enter a valid 10-digit mobile number.";
    if (!/^\S+@\S+\.\S+$/.test(f.applicant_email)) e.applicant_email = "Please enter a valid email address.";
  }
  if (step === 3 && !f.documents.some((d) => d.label === "Ownership Document")) e.documents = "Please upload the ownership document.";
  return e;
}