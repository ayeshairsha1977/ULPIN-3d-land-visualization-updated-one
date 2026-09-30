import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/common/PageHeader";
import Field from "@/components/ulpin/Field";
import SubmitSuccess from "@/components/ulpin/SubmitSuccess";
import EvidenceUpload from "@/components/complaints/EvidenceUpload";
import { PROPERTIES, getProperty } from "@/data/properties";
import { COMPLAINT_CATEGORIES } from "@/data/constants";
import { useRole } from "@/hooks/useRole";
import { useStatuses, useInvalidate } from "@/hooks/useData";
import { submitComplaint } from "@/services/workflow";

export default function ComplaintNew() {
  const { user } = useRole();
  const statuses = useStatuses();
  const invalidate = useInvalidate();
  const [pid, setPid] = useState(() => new URLSearchParams(window.location.search).get("property") || "");
  const [form, setForm] = useState({ category: "", description: "", evidence: [] });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const p = getProperty(pid);
  const ulpin = p ? statuses.get(p.id).ulpin : "";
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!p) errs.property = "Please select a property.";
    if (!form.category) errs.category = "Please choose a complaint type.";
    if (form.description.trim().length < 10) errs.description = "Please describe the issue (at least 10 characters).";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const c = await submitComplaint({ ...form, property_id: p.id, property_name: p.name, property_code: p.propertyCode, ulpin, location: `${p.location} (${p.lat.toFixed(5)}, ${p.lng.toFixed(5)})` }, user);
      invalidate("Complaint", "PropertyHistory", "Notification");
      setDone(c);
    } catch {
      setErrors({ submit: "We couldn't submit your complaint. Please try again." });
    }
    setSaving(false);
  };

  if (done) {
    return <div className="px-4 py-16"><SubmitSuccess label="Complaint ID" number={done.complaint_number} message="Complaint submitted successfully." primary={{ to: "/complaints", label: "Track Complaint" }} secondary={{ to: `/property/${done.property_id}`, label: "Back to Property" }} /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <PageHeader eyebrow="Complaints" title="Raise Complaint" subtitle="Property details are filled in automatically — just tell us what's wrong." />
      <form onSubmit={submit} className="bg-card border border-line rounded-2xl p-6 sm:p-8 space-y-5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="property">Property</Label>
          <Select value={pid || undefined} onValueChange={setPid}>
            <SelectTrigger id="property" className="h-11"><SelectValue placeholder="Select property" /></SelectTrigger>
            <SelectContent>{PROPERTIES.map((x) => <SelectItem key={x.id} value={x.id}>{x.code} · {x.name}</SelectItem>)}</SelectContent>
          </Select>
          {errors.property && <p className="text-xs text-red-600">{errors.property}</p>}
        </div>
        {p && (
          <div className="grid sm:grid-cols-2 gap-4 rounded-lg bg-muted/60 border border-line p-4 text-sm">
            <div><p className="text-xs text-muted-foreground">Property ID</p><p className="font-mono">{p.propertyCode}</p></div>
            <div><p className="text-xs text-muted-foreground">ULPIN</p><p className="font-mono">{ulpin || "Not Assigned"}</p></div>
            <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Location</p><p>{p.location} · {p.lat.toFixed(5)}, {p.lng.toFixed(5)}</p></div>
          </div>
        )}
        <Field id="category" label="Complaint Type" value={form.category} onChange={set("category")} options={COMPLAINT_CATEGORIES} error={errors.category} />
        <Field id="description" label="Description" textarea value={form.description} onChange={set("description")} error={errors.description} placeholder="Describe the issue you noticed…" />
        <EvidenceUpload files={form.evidence} onChange={set("evidence")} />
        {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}
        <Button type="submit" className="w-full h-11" disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Submit Complaint</Button>
      </form>
    </div>
  );
}