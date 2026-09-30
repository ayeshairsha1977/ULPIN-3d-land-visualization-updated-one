import React from "react";
import Field from "@/components/ulpin/Field";
import { LAND_TYPES } from "@/components/ulpin/formModel";

export default function StepParcel({ form, set, errors }) {
  return (
    <div className="grid sm:grid-cols-2 gap-5">
      <Field id="parcel_number" label="Parcel Number" value={form.parcel_number} onChange={set("parcel_number")} error={errors.parcel_number} hint="Letters, numbers, - and / (demo format)" />
      <Field id="plot_area" label="Plot Area" value={form.plot_area} onChange={set("plot_area")} error={errors.plot_area} placeholder="e.g. 450 m²" />
      <Field id="land_type" label="Land Type" value={form.land_type} onChange={set("land_type")} error={errors.land_type} options={LAND_TYPES} />
      <Field id="property_type" label="Property Type" value={form.property_type} onChange={set("property_type")} error={errors.property_type} placeholder="e.g. Residential / Hostel" />
      <Field id="building_type" label="Building Type" value={form.building_type} onChange={set("building_type")} error={errors.building_type} placeholder="e.g. Hostel" />
      <Field id="floors" label="Number of Floors" value={form.floors} onChange={set("floors")} error={errors.floors} placeholder="e.g. G + 3" />
    </div>
  );
}