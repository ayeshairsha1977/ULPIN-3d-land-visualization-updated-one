import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import FilterBar from "@/components/common/FilterBar";
import DataTable from "@/components/common/DataTable";
import EmptyState from "@/components/common/EmptyState";
import StatusBadge from "@/components/common/StatusBadge";
import { useEntityList } from "@/hooks/useData";
import { APP_STATUSES, PROPERTY_CATEGORIES } from "@/data/constants";
import { getProperty } from "@/data/properties";
import { fmtDate } from "@/lib/ids";
import { SORT_OPTIONS, sortByDate, withAll, matches } from "@/lib/listUtils";

const COLUMNS = [
  { key: "application_number", label: "Application ID", render: (r) => <span className="font-mono text-xs font-semibold">{r.application_number}</span> },
  { key: "property_name", label: "Property" },
  { key: "applicant_name", label: "Applicant" },
  { key: "property_type", label: "Property Type" },
  { key: "date", label: "Date", render: (r) => fmtDate(r.submitted_at || r.created_date) },
  { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
  { key: "action", label: "Action", render: (r) => <span className="text-primary font-semibold text-sm">{["Surveyor Review Complete", "ULPIN Assigned", "Rejected"].includes(r.status) ? "Open" : "Waiting for Surveyor"}</span> },
];

export default function AdminApplications() {
  const nav = useNavigate();
  const { data = [], isLoading } = useEntityList("ULPINApplication");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("newest");
  const rows = sortByDate(data.filter((a) =>
    matches(a, q, ["application_number", "property_name", "applicant_name", "parcel_number"]) &&
    (status === "all" || a.status === status) &&
    (type === "all" || getProperty(a.property_id)?.category === type)), sort);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <PageHeader eyebrow="Surveyor / Government Demo" title="ULPIN Applications" subtitle="Surveyors verify documents and property details; Government makes the final decision." />
      <FilterBar search={q} onSearch={setQ} placeholder="Search application ID, property, applicant…" filters={[
        { label: "Status", value: status, onChange: setStatus, options: withAll("All statuses", APP_STATUSES) },
        { label: "Property Type", value: type, onChange: setType, options: withAll("All property types", PROPERTY_CATEGORIES) },
        { label: "Sort", value: sort, onChange: setSort, options: SORT_OPTIONS },
      ]} />
      <DataTable columns={COLUMNS} rows={rows} loading={isLoading} onRowClick={(r) => nav(`/admin/applications/${r.id}`)}
        empty={<div className="bg-card border border-line rounded-xl"><EmptyState icon={ClipboardList} title="No ULPIN applications yet." text="Applications submitted by citizens will appear here." actionLabel="Open Map" actionTo="/map" /></div>} />
    </div>
  );
}