import { z } from "zod";

const text = (max = 200) => z.string().trim().max(max);
const required = (max = 200) => text(max).min(1, "This field is required.");

// Accepts numbers or numeric strings; rejects null/"" instead of silently turning them into 0.
const coordinate = (min, max) => z.preprocess(
  (v) => (typeof v === "string" && v.trim() !== "" ? Number(v) : v),
  z.number({ invalid_type_error: "Enter a valid coordinate." }).finite().min(min).max(max),
);

const documentRef = z.object({
  label: required(80),
  file_id: z.string().uuid(),
});

export const DOCUMENT_SLOTS = ["Ownership Document", "Property Document", "Survey Document", "Supporting Document"];

export const applicationInput = z.object({
  property_id: text(80).optional().default(""),
  property_name: required(),
  property_type: required(80),
  state: required(80),
  district: required(80),
  mandal: required(80),
  locality: required(),
  latitude: coordinate(-90, 90),
  longitude: coordinate(-180, 180),
  parcel_number: text(40).regex(/^[A-Za-z0-9][A-Za-z0-9\-/]{2,}$/, "Please enter a valid parcel number."),
  plot_area: required(80),
  land_type: required(80),
  building_type: required(80),
  floors: required(80),
  applicant_name: required(120),
  applicant_phone: text(20).transform((v) => v.replace(/\s|\+91/g, "")).pipe(z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number.")),
  applicant_email: z.string().trim().email("Please enter a valid email address.").max(200),
  applicant_address: required(500),
  documents: z.array(documentRef.extend({ label: z.enum(DOCUMENT_SLOTS) })).max(DOCUMENT_SLOTS.length)
    .refine((docs) => docs.some((d) => d.label === "Ownership Document"), "Please upload the ownership document.")
    .refine((docs) => new Set(docs.map((d) => d.label)).size === docs.length, "Each document slot can hold one file."),
});

export const complaintInput = z.object({
  property_id: required(80),
  category: required(80),
  description: text(4000).min(10, "Please describe the issue (at least 10 characters)."),
  evidence: z.array(z.object({ file_id: z.string().uuid() })).max(5).default([]),
  // Display-only context from the demo property data; never used for decisions.
  property_code: text(40).optional().default(""),
  location: text(300).optional().default(""),
});

export const reviewInput = z.object({
  status: required(60),
  note: text(2000).optional().default(""),
  checklist: z.record(z.string().max(80), z.boolean()).optional(),
});

export const complaintStatusInput = z.object({ status: required(60), note: text(2000).optional().default("") });
export const complaintAssignInput = z.object({ officer: required(120) });
export const complaintPriorityInput = z.object({ priority: z.enum(["Low", "Medium", "High"]) });
export const complaintDecisionInput = z.object({ decision: required(60), reason: text(2000) });

export const verifyInput = z.object({
  status: z.enum(["Verified", "Correction Required"]),
  remarks: text(2000).optional().default(""),
  checklist: z.record(z.string().max(80), z.boolean()).default({}),
});
export const removeVerificationInput = z.object({ reason: required(200), remarks: text(2000).optional().default("") });

export const aiReviewInput = z.object({ run_id: z.string().uuid(), note: text(2000) });
export const aiExtractInput = z.object({ document_label: z.enum(DOCUMENT_SLOTS) });

export const registerInput = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  full_name: required(120),
  password: z.string().min(10, "Password must be at least 10 characters.").max(200),
});
export const loginInput = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

export class ValidationError extends Error {
  constructor(issues) {
    super(issues[0]?.message || "Invalid input.");
    this.fields = Object.fromEntries(issues.map((i) => [i.path.join(".") || "_", i.message]));
  }
}

export function parse(schema, body) {
  const result = schema.safeParse(body ?? {});
  if (!result.success) throw new ValidationError(result.error.issues);
  return result.data;
}
