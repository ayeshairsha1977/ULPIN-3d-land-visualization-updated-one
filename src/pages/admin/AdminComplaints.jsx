import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquareWarning } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import FilterBar from "@/components/common/FilterBar";
import DataTable from "@/components/common/DataTable";
import EmptyState from "@/components/common/EmptyState";
import StatusBadge from "@/components/common/StatusBadge";
import { useEntityList } from "@/hooks/useData";
import { COMPLAINT_STATUSES, COMPLAINT_CATEGORIES } from "@/data/constants";
import { fmtDate } from "@/lib/ids";
import { sortByDate, withAll, matches } from "@/lib/listUtils";

const PRI = { High: 0, Medium: 1, Low: 2 };
const COLUMNS = [
  { key: "complaint_number", label: "Complaint ID", render: (r) => <span className="font-mono text-xs font-semibold">{r.complaint_number}</span> },
  { key: "property_name", label: "Property" },
  { key: "category", label: "Category" },
  { key: "date", label: "Submitted", render: (r) => fmtDate(r.created_date) },
  { key: "priority", label: "Priority", render: (r) => <StatusBadge status={r.priority || "Medium"} /> },
  { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
  { key: "action", label: "Action", render: () => <span className="text-primary font-semibold text-sm">Open</span> },
];

export default function AdminComplaints() {
  const nav = useNavigate();
  const { data = [], isLoading } = useEntityList("Complaint");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  let rows = data.filter((c) => matches(c, q, ["complaint_number", "property_name", "reporter_name", "description"]) && (status === "all" || c.status === status) && (category === "all" || c.category === category));
  rows = sort === "priority" ? [...rows].sort((a, b) => (PRI[a.priority] ?? 1) - (PRI[b.priority] ?? 1)) : sortByDate(rows, sort);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <PageHeader eyebrow="Government Demo" title="Complaint Management" subtitle="Assign officers, verify in the field and resolve complaints." />
      <FilterBar search={q} onSearch={setQ} placeholder="Search complaint ID, property, reporter…" filters={[
        { label: "Status", value: status, onChange: setStatus, options: withAll("All statuses", COMPLAINT_STATUSES) },
        { label: "Category", value: category, onChange: setCategory, options: withAll("All categories", COMPLAINT_CATEGORIES) },
        { label: "Sort", value: sort, onChange: setSort, options: [{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "priority", label: "Priority" }] },
      ]} />
      <DataTable columns={COLUMNS} rows={rows} loading={isLoading} onRowClick={(r) => nav(`/admin/complaints/${r.id}`)}
        empty={<div className="bg-card border border-line rounded-xl"><EmptyState icon={MessageSquareWarning} title="No complaints yet." text="Complaints raised by citizens will appear here." actionLabel="Back to dashboard" actionTo="/admin" /></div>} />
    </div>
  );
}