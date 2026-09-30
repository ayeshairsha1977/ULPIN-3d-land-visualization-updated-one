import React from "react";
import { Link } from "react-router-dom";
import { Building2, ClipboardList, MessageSquareWarning, ShieldCheck, Plus, Fingerprint, Map as MapIcon, Bell } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import Panel from "@/components/common/Panel";
import StatusBadge from "@/components/common/StatusBadge";
import { useEntityList, useStatuses } from "@/hooks/useData";
import { useRole } from "@/hooks/useRole";
import { ACTIVE_COMPLAINT } from "@/data/constants";
import { getProperty } from "@/data/properties";
import { fmtDateTime } from "@/lib/ids";

const ACTIONS = [
  { to: "/ulpin/request", label: "Register Property", icon: Plus },
  { to: "/ulpin/request", label: "Request ULPIN", icon: Fingerprint },
  { to: "/complaints/new", label: "Raise Complaint", icon: MessageSquareWarning },
  { to: "/map", label: "View Map", icon: MapIcon },
];

const Row = ({ to, left, sub, right }) => (
  <li><Link to={to} className="flex items-center gap-3 py-2.5 hover:bg-muted/50 -mx-2 px-2 rounded">
    <span className="flex-1 min-w-0"><span className="block text-sm font-medium truncate">{left}</span><span className="block text-xs text-muted-foreground truncate">{sub}</span></span>{right}
  </Link></li>
);
const Empty = ({ text, to, cta }) => <p className="text-sm text-muted-foreground">{text} <Link to={to} className="text-primary font-medium">{cta}</Link></p>;

export default function Dashboard() {
  const { user } = useRole();
  const opts = { enabled: !!user?.id };
  const apps = useEntityList("ULPINApplication", { created_by_id: user?.id }, opts);
  const complaints = useEntityList("Complaint", { created_by_id: user?.id }, opts);
  const notes = useEntityList("Notification", { user_id: user?.id }, opts);
  const statuses = useStatuses();
  const myProps = [...new Set((apps.data || []).map((a) => a.property_id).filter(Boolean))].map(getProperty).filter(Boolean);
  const loading = apps.isLoading || complaints.isLoading;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <PageHeader eyebrow="Citizen Dashboard" title={`Welcome back${user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}`} subtitle="Your properties, ULPIN applications and complaints in one place." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="My Properties" value={myProps.length} icon={Building2} to="/properties" loading={loading} />
        <StatCard label="ULPIN Applications" value={(apps.data || []).length} icon={ClipboardList} to="/applications" loading={loading} />
        <StatCard label="Active Complaints" value={(complaints.data || []).filter(ACTIVE_COMPLAINT).length} icon={MessageSquareWarning} to="/complaints" loading={loading} />
        <StatCard label="Verified Properties" value={myProps.filter((p) => statuses.get(p.id).verification_status === "Verified").length} icon={ShieldCheck} loading={loading} />
      </div>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {ACTIONS.map(({ to, label, icon: I }) => (
          <Link key={label} to={to} className="flex items-center gap-3 rounded-xl border border-line bg-card px-4 py-3.5 text-sm font-semibold text-ink hover:border-primary/40 hover:bg-accent/40">
            <I className="w-4 h-4 text-primary" />{label}
          </Link>
        ))}
      </div>
      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <Panel title="My Properties" icon={Building2}>
          {myProps.length ? <ul>{myProps.map((p) => <Row key={p.id} to={`/property/${p.id}`} left={p.name} sub={p.type} right={<StatusBadge status={statuses.get(p.id).verification_status} />} />)}</ul>
            : <Empty text="No properties registered." to="/ulpin/request" cta="Register a property" />}
        </Panel>
        <Panel title="My Applications" icon={ClipboardList}>
          {(apps.data || []).length ? <ul>{apps.data.slice(0, 4).map((a) => <Row key={a.id} to="/applications" left={a.application_number} sub={a.property_name} right={<StatusBadge status={a.status} />} />)}</ul>
            : <Empty text="No ULPIN applications yet." to="/ulpin/request" cta="Request ULPIN" />}
        </Panel>
        <Panel title="My Complaints" icon={MessageSquareWarning}>
          {(complaints.data || []).length ? <ul>{complaints.data.slice(0, 4).map((c) => <Row key={c.id} to="/complaints" left={c.complaint_number} sub={`${c.category} · ${c.property_name}`} right={<StatusBadge status={c.status} />} />)}</ul>
            : <Empty text="No complaints yet." to="/complaints/new" cta="Raise a complaint" />}
        </Panel>
        <Panel title="Recent Activity" icon={Bell}>
          {(notes.data || []).length ? <ul>{notes.data.slice(0, 5).map((n) => <Row key={n.id} to={n.link || "/dashboard"} left={n.title} sub={`${n.message} · ${fmtDateTime(n.created_date)}`} />)}</ul>
            : <Empty text="No activity yet." to="/map" cta="Explore the map" />}
        </Panel>
      </div>
    </div>
  );
}