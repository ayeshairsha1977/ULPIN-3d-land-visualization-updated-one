import React from "react";
import Field from "@/components/ulpin/Field";

export default function StepApplicant({ form, set, errors }) {
  return (
    <div className="grid sm:grid-cols-2 gap-5">
      <Field id="applicant_name" label="Full Name" value={form.applicant_name} onChange={set("applicant_name")} error={errors.applicant_name} autoComplete="name" />
      <Field id="applicant_phone" label="Mobile Number" value={form.applicant_phone} onChange={set("applicant_phone")} error={errors.applicant_phone} inputMode="tel" autoComplete="tel" placeholder="10-digit mobile number" />
      <div className="sm:col-span-2"><Field id="applicant_email" label="Email" type="email" value={form.applicant_email} onChange={set("applicant_email")} error={errors.applicant_email} autoComplete="email" /></div>
      <div className="sm:col-span-2"><Field id="applicant_address" label="Address" textarea value={form.applicant_address} onChange={set("applicant_address")} error={errors.applicant_address} /></div>
    </div>
  );
}