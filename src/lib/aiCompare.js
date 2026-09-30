// Compares AI-extracted document values with what the applicant declared.
// The result only points the surveyor at differences; it never decides anything.

export const FIELD_LABELS = {
  document_type: "Document Type",
  owner_name: "Owner Name",
  parcel_number: "Parcel / Survey No.",
  plot_area: "Plot Area",
  land_use: "Land Use",
  floors: "Floors",
  address: "Address",
  district: "District",
  issuing_authority: "Issuing Authority",
  document_date: "Document Date",
};

// AI field -> application field
const DECLARED_FIELD = {
  owner_name: "applicant_name",
  parcel_number: "parcel_number",
  plot_area: "plot_area",
  land_use: "land_type",
  floors: "floors",
  district: "district",
};

export const LOW_CONFIDENCE = 0.6;

const normalise = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

// "Sy. No. 123/4A" -> ["123", "4a"]. Separators matter: 12/3 and 123 are different parcels.
const LABEL_TOKENS = new Set(["sy", "no", "survey", "number", "plot", "sno", "s"]);
const parcelTokens = (value) =>
  String(value ?? "").toLowerCase().split(/[^a-z0-9]+/).filter((t) => t && !LABEL_TOKENS.has(t));

// "G + 5" / "Ground + 5 floors" -> 6 storeys, "4" -> 4.
function storeys(value) {
  const text = String(value ?? "").toLowerCase();
  const groundPlus = text.match(/\b(?:g|ground)\s*\+\s*(\d+)/);
  if (groundPlus) return Number(groundPlus[1]) + 1;
  const n = text.match(/\d+/);
  return n ? Number(n[0]) : null;
}

function areaUnit(value) {
  const text = String(value ?? "").toLowerCase();
  if (/sq\.?\s*f|sft|ft|feet/.test(text)) return "sqft";
  if (/sq\.?\s*y|yard|gaj/.test(text)) return "sqyd";
  if (/acre/.test(text)) return "acre";
  if (/sq\.?\s*m|m²|m2|metre|meter/.test(text)) return "sqm";
  return null;
}

const firstNumber = (value) => {
  const match = String(value ?? "").replace(/,/g, "").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const COMPARERS = {
  parcel_number: (a, b) => {
    const x = parcelTokens(a);
    const y = parcelTokens(b);
    return x.length > 0 && x.join("/") === y.join("/");
  },
  floors: (a, b) => storeys(a) !== null && storeys(a) === storeys(b),
  plot_area: (a, b) => {
    const ua = areaUnit(a);
    const ub = areaUnit(b);
    if (ua && ub && ua !== ub) return false;
    const x = firstNumber(a);
    const y = firstNumber(b);
    return x !== null && y !== null && Math.abs(x - y) <= y * 0.01;
  },
};

// Names and places may be written more or less fully ("Medchal" vs "Medchal-Malkajgiri").
const LOOSE_FIELDS = new Set(["owner_name", "land_use", "district"]);

/** @returns {"match" | "differs" | "not-found" | "not-declared"} */
export function compareValue(field, extracted, declared) {
  if (!String(extracted ?? "").trim()) return "not-found";
  if (!String(declared ?? "").trim()) return "not-declared";
  if (COMPARERS[field]) return COMPARERS[field](extracted, declared) ? "match" : "differs";
  const a = normalise(extracted);
  const b = normalise(declared);
  if (a === b) return "match";
  if (LOOSE_FIELDS.has(field) && a.length > 3 && b.length > 3 && (a.includes(b) || b.includes(a))) return "match";
  return "differs";
}

export function compareWithApplication(result, application) {
  return Object.keys(FIELD_LABELS).map((field) => {
    const extracted = result.fields[field] || { value: "", confidence: 0, source_quote: "" };
    const declaredField = DECLARED_FIELD[field];
    const declared = declaredField ? application[declaredField] || "" : "";
    return {
      field,
      label: FIELD_LABELS[field],
      ...extracted,
      declared,
      comparison: declaredField ? compareValue(field, extracted.value, declared) : "not-declared",
      lowConfidence: Boolean(extracted.value) && extracted.confidence < LOW_CONFIDENCE,
    };
  });
}
