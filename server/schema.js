import { z } from "zod";

// Fields the AI tries to read from an uploaded land/property document.
// Every value is a *candidate* that a surveyor must confirm.
export const EXTRACTED_FIELDS = [
  "document_type",
  "owner_name",
  "parcel_number",
  "plot_area",
  "land_use",
  "floors",
  "address",
  "district",
  "issuing_authority",
  "document_date",
];

const fieldJsonSchema = {
  type: "object",
  properties: {
    value: { type: "string", description: "Value exactly as written in the document, or empty string if absent." },
    confidence: { type: "number", description: "0 to 1. How sure you are the value is correct and legible." },
    source_quote: { type: "string", description: "Short verbatim snippet the value came from, or empty string." },
  },
  required: ["value", "confidence", "source_quote"],
  additionalProperties: false,
};

export const EXTRACTION_JSON_SCHEMA = {
  type: "object",
  properties: {
    fields: {
      type: "object",
      properties: Object.fromEntries(EXTRACTED_FIELDS.map((name) => [name, fieldJsonSchema])),
      required: EXTRACTED_FIELDS,
      additionalProperties: false,
    },
    warnings: {
      type: "array",
      items: { type: "string" },
      description: "Legibility problems, inconsistencies, signs of tampering, or missing pages.",
    },
    summary: { type: "string", description: "One or two plain sentences describing the document." },
  },
  required: ["fields", "warnings", "summary"],
  additionalProperties: false,
};

const fieldSchema = z.object({
  value: z.string().max(500),
  confidence: z.number().transform((n) => Math.min(1, Math.max(0, n))),
  source_quote: z.string().max(1000),
});

export const extractionResultSchema = z.object({
  fields: z.object(Object.fromEntries(EXTRACTED_FIELDS.map((name) => [name, fieldSchema]))),
  warnings: z.array(z.string().max(500)).max(20),
  summary: z.string().max(1000),
});

export const ALLOWED_MEDIA_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export const extractRequestSchema = z.object({
  filename: z.string().min(1).max(255),
  media_type: z.enum(ALLOWED_MEDIA_TYPES),
  data: z.string().min(1).regex(/^[A-Za-z0-9+/]+={0,2}$/, "data must be base64 without line breaks"),
});
