import React from "react";
import InfoGrid from "@/components/common/InfoGrid";

export default function StepReview({ form, goTo }) {
  const sections = [
    ["Property Location", 0, [["Property", form.property_name], ["State", form.state], ["District", form.district], ["Mandal", form.mandal], ["Village / Locality", form.locality], ["Coordinates", `${form.latitude}, ${form.longitude}`]]],
    ["Parcel Information", 1, [["Parcel Number", form.parcel_number], ["Plot Area", form.plot_area], ["Land Type", form.land_type], ["Property Type", form.property_type], ["Building Type", form.building_type], ["Number of Floors", form.floors]]],
    ["Applicant Information", 2, [["Full Name", form.applicant_name], ["Mobile Number", form.applicant_phone], ["Email", form.applicant_email], ["Address", form.applicant_address]]],
    ["Documents", 3, form.documents.map((d) => [d.label, d.name])],
  ];
  return (
    <div className="space-y-5">
      {sections.map(([title, step, rows]) => (
        <div key={title} className="rounded-lg border border-line p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-ink">{title}</p>
            <button type="button" onClick={() => goTo(step)} className="text-xs font-semibold text-primary hover:underline">Edit</button>
          </div>
          <InfoGrid items={rows.map(([label, value]) => ({ label, value }))} cols="sm:grid-cols-2 lg:grid-cols-3" />
        </div>
      ))}
      <p className="text-xs text-muted-foreground">By submitting, you create a demo ULPIN application. It will be reviewed in the simulated government workflow — no official ULPIN is issued.</p>
    </div>
  );
}