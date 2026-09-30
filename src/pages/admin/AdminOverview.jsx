import React from "react";
import { Link } from "react-router-dom";
import { ClipboardList, MessageSquareWarning, ShieldAlert, ShieldCheck, FileBadge, Map as MapIcon, ArrowRight } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import Panel from "@/components/common/Panel";
import StatusBadge from "@/components/common/StatusBadge";
import { useEntityList, useStatuses } from "@/hooks/useData";
import { PROPERTIES } from "@/data/properties";
import { PENDING_APP, ACTIVE_COMPLAINT } from "@/data/constants";

const SECTIONS = [
  { to: "/admin/applications", label: "ULPIN Applications", icon: ClipboardList, text: "Review, approve or request correction." },
  { to: "/admin/complaints", label: "Complaints", icon: MessageSquareWarning, text: "Assign, investigate and resolve issues." },
  { to: "/admin/properties", label: "Property Verification", icon: ShieldCheck, text: "Verify 2D map, 3D model, data and documents." },
  { to: "/admin/records", label: "3D Property Records", icon: FileBadge, text: "Open digital property records and history." },
  { to: "/map", label: "Map Management", icon: MapIcon, text: "Inspect demo parcel boundaries on the map." },
];

export default function AdminOverview() {
  const apps = useEntityList("ULPINApplication");
  const complaints = useEntityList("Complaint");
  const statuses = useStatuses();
  const verified = PROPERTIES.filter((p) => statuses.get(p.id).verification_status === "Verified").length;
  const loading = apps.isLoading || complaints.isLoading || statuses.isLoading;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <PageHeader eyebrow="Government Demo" title="Government Dashboard" subtitle="Simulated review workflow. Actions here are demo actions and do not perform any official government approval." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending ULPIN Requests" value={(apps.data || []).filter(PENDING_APP).length} icon={ClipboardList} to="/admin/applications" loading={loading} />
        <StatCard label="Pending Complaints" value={(complaints.data || []).filter(ACTIVE_COMPLAINT).length} icon={MessageSquareWarning} to="/admin/complaints" loading={loading} />
        <StatCard label="Awaiting Verification" value={PROPERTIES.length - verified} icon={ShieldAlert} to="/admin/properties" loading={loading} />
        <StatCard label="Verified Properties" value={verified} icon={ShieldCheck} to="/admin/records" loading={loading} />
      </div>
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {SECTIONS.map(({ to, label, icon: I, text }) => (
          <Link key={label} to={to} className="group rounded-xl border border-line bg-card p-4 hover:border-primary/40">
            <I className="w-5 h-5 text-primary" />
            <p className="mt-3 text-sm font-bold text-ink flex items-center gap-1">{label}<ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" /></p>
            <p className="text-xs text-muted-foreground mt-1">{text}</p>
          </Link>
        ))}
      </div>
      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <Panel title="Latest ULPIN Applications" icon={ClipboardList}>
          {(apps.data || []).length === 0 ? <p className="text-sm text-muted-foreground">No ULPIN applications yet.</p> : (
            <ul className="divide-y divide-line">{apps.data.slice(0, 5).map((a) => (
              <li key={a.id}><Link to={`/admin/applications/${a.id}`} className="flex items-center gap-3 py-2.5 text-sm hover:text-primary">
                <span className="font-mono text-xs">{a.application_number}</span><span className="flex-1 truncate">{a.property_name}</span><StatusBadge status={a.status} />
              </Link></li>))}</ul>
          )}
        </Panel>
        <Panel title="Latest Complaints" icon={MessageSquareWarning}>
          {(complaints.data || []).length === 0 ? <p className="text-sm text-muted-foreground">No complaints yet.</p> : (
            <ul className="divide-y divide-line">{complaints.data.slice(0, 5).map((c) => (
              <li key={c.id}><Link to={`/admin/complaints/${c.id}`} className="flex items-center gap-3 py-2.5 text-sm hover:text-primary">
                <span className="font-mono text-xs">{c.complaint_number}</span><span className="flex-1 truncate">{c.category}</span><StatusBadge status={c.status} />
              </Link></li>))}</ul>
          )}
        </Panel>
      </div>
    </div>
  );
}