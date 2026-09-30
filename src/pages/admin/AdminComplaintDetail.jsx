import React from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Info, FileText, Map as MapIcon, Box, ExternalLink, Gavel } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Panel from "@/components/common/Panel";
import InfoGrid from "@/components/common/InfoGrid";
import StatusBadge from "@/components/common/StatusBadge";
import HistoryLog from "@/components/common/HistoryLog";
import Timeline from "@/components/common/Timeline";
import EmptyState from "@/components/common/EmptyState";
import ComplaintActions from "@/components/admin/ComplaintActions";
import LocationMap from "@/components/property/LocationMap";
import Twin3DPreview from "@/components/property/Twin3DPreview";
import { useEntityList } from "@/hooks/useData";
import { getProperty } from "@/data/properties";
import { COMPLAINT_STAGES, complaintStageIndex } from "@/data/constants";
import { openPrivate } from "@/lib/files";
import { fmtDate } from "@/lib/ids";

export default function AdminComplaintDetail() {
  const { id } = useParams();
  const { data = [], isLoading } = useEntityList("Complaint", { id });
  const c = data[0];
  if (isLoading) return <div className="max-w-7xl mx-auto px-6 py-10"><Skeleton className="h-64 w-full" /></div>;
  if (!c) return <EmptyState icon={FileText} title="Complaint not found." actionLabel="Back to complaints" actionTo="/admin/complaints" />;
  const p = getProperty(c.property_id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link to="/admin/complaints" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink"><ChevronLeft className="w-4 h-4" />Complaint Management</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-ink font-mono">{c.complaint_number}</h1>
        <StatusBadge status={c.status} /><StatusBadge status={c.priority || "Medium"} />
        <span className="text-sm text-muted-foreground">Submitted {fmtDate(c.created_date)}</span>
      </div>
      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="space-y-6">
          <Panel title="Complaint Details" icon={Info}>
            <InfoGrid cols="sm:grid-cols-3" items={[
              { label: "Property", value: c.property_name }, { label: "Property ID", value: c.property_code, mono: true }, { label: "ULPIN", value: c.ulpin || "Not Assigned", mono: true },
              { label: "Category", value: c.category }, { label: "Location", value: c.location }, { label: "Reporter", value: c.reporter_name || c.reporter_email },
            ]} />
            <p className="mt-5 text-xs text-muted-foreground">Description</p>
            <p className="mt-1 text-sm text-ink whitespace-pre-line">{c.description}</p>
          </Panel>
          <Panel title="Evidence" icon={FileText}>
            {(c.evidence || []).length === 0 ? <p className="text-sm text-muted-foreground">No evidence uploaded.</p> : (
              <ul className="grid sm:grid-cols-2 gap-2">{c.evidence.map((e, i) => (
                <li key={i}><button onClick={() => openPrivate(e.file_uri)} className="w-full flex items-center gap-3 rounded-lg border border-line p-3 text-left hover:bg-muted">
                  <FileText className="w-4 h-4 text-primary" /><span className="flex-1 truncate text-sm">{e.name}</span><ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </button></li>))}</ul>
            )}
          </Panel>
          <div className="grid md:grid-cols-2 gap-6">
            <Panel title="2D Map" icon={MapIcon} bodyClass="p-3"><LocationMap propertyId={p?.id} /></Panel>
            <Panel title="3D Property" icon={Box} bodyClass="p-3">{p && <Twin3DPreview property={p} />}</Panel>
          </div>
        </div>
        <div className="space-y-6 lg:sticky lg:top-24">
          <Panel title="Actions" icon={Gavel}><ComplaintActions complaint={c} /></Panel>
          <Panel title="Timeline"><Timeline steps={COMPLAINT_STAGES} current={complaintStageIndex(c)} flag={c.status === "Complaint Rejected" ? { label: "Complaint rejected", tone: "danger" } : c.status === "Action Required" ? { label: "Waiting for more information", tone: "attention" } : null} /></Panel>
          <Panel title="Activity"><HistoryLog items={c.history} /></Panel>
        </div>
      </div>
    </div>
  );
}