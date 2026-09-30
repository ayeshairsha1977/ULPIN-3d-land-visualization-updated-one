import { describe, expect, it } from "vitest";
import { compareValue, compareWithApplication } from "@/lib/aiCompare";

describe("compareValue", () => {
  it("matches ignoring case and punctuation", () => {
    expect(compareValue("parcel_number", "Sy. No 123/4A", "sy no 123-4a")).toBe("match");
  });

  it("matches areas that differ only by formatting or rounding", () => {
    expect(compareValue("plot_area", "1,245.2 sq.m", "1245 m² (demo boundary)")).toBe("match");
  });

  it("treats different sub-division numbers as different parcels", () => {
    expect(compareValue("parcel_number", "12/3", "123")).toBe("differs");
    expect(compareValue("parcel_number", "1234", "12345")).toBe("differs");
    expect(compareValue("parcel_number", "Survey 12/3", "12/34")).toBe("differs");
  });

  it("compares floors as storey counts", () => {
    expect(compareValue("floors", "6", "G + 5")).toBe("match");
    expect(compareValue("floors", "2", "3")).toBe("differs");
    expect(compareValue("floors", "G+1", "1")).toBe("differs");
  });

  it("requires plot area units to agree", () => {
    expect(compareValue("plot_area", "1200 sq ft", "1200 sq m")).toBe("differs");
    expect(compareValue("plot_area", "1200", "1200 sq m")).toBe("match");
  });

  it("flags a real difference", () => {
    expect(compareValue("parcel_number", "123/4A", "456/1")).toBe("differs");
    expect(compareValue("plot_area", "900 sq.m", "1245 m²")).toBe("differs");
  });

  it("reports values the document or application does not contain", () => {
    expect(compareValue("owner_name", "", "Asha")).toBe("not-found");
    expect(compareValue("owner_name", "Asha", "")).toBe("not-declared");
  });
});

describe("compareWithApplication", () => {
  const field = (value, confidence = 0.9) => ({ value, confidence, source_quote: "" });
  const result = {
    fields: {
      document_type: field("Sale deed"),
      owner_name: field("Asha Rani"),
      parcel_number: field("123/4A", 0.4),
      plot_area: field(""),
      land_use: field("Residential"),
      floors: field(""),
      address: field(""),
      district: field("Medchal"),
      issuing_authority: field(""),
      document_date: field(""),
    },
  };
  const app = { applicant_name: "Asha Rani", parcel_number: "999/1", land_type: "Residential", district: "Medchal-Malkajgiri" };

  it("returns one row per field with the declared value", () => {
    const rows = compareWithApplication(result, app);
    expect(rows).toHaveLength(10);
    expect(rows.find((r) => r.field === "owner_name").comparison).toBe("match");
    expect(rows.find((r) => r.field === "district").comparison).toBe("match");
    expect(rows.find((r) => r.field === "document_type").comparison).toBe("not-declared");
  });

  it("flags low-confidence values and differences", () => {
    const parcel = compareWithApplication(result, app).find((r) => r.field === "parcel_number");
    expect(parcel.comparison).toBe("differs");
    expect(parcel.lowConfidence).toBe(true);
  });
});
