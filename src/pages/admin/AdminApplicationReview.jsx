import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Info, User, FileText, Map as MapIcon, Box, ListChecks, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Panel from "@/components/common/Panel";
import InfoGrid from "@/components/common/InfoGrid";
import StatusBadge from "@/components/common/StatusBadge";
import HistoryLog from "@/components/common/HistoryLog";
import EmptyState from "@/components/common/EmptyState";
import Checklist from "@/components/admin/Checklist";
import ReviewActions from "@/components/admin/ReviewActions";
import AIDocumentExtraction from "@/components/admin/AIDocumentExtraction";
import GisCheckPanel from "@/components/admin/GisCheckPanel";
import UlpinAssignedBanner from "@/components/admin/UlpinAssignedBanner";
import LocationMap from "@/components/property/LocationMap";
import Twin3DPreview from "@/components/property/Twin3DPreview";
import { useEntityList } from "@/hooks/useData";
import { getProperty } from "@/data/properties";
import { openPrivate } from "@/lib/files";
import { fmtDate } from "@/lib/ids";
import { useRole } from "@/hooks/useRole";

const CHECKS = ["Parcel Information", "Coordinates", "Building Information", "Documents", "3D Representation"];

export default function AdminApplicationReview() {
  const { id } = useParams();
  const { data = [], isLoading } = useEntityList("ULPINApplication", { id });
  const { role } = useRole();
  const app = data[0];
  const [checklist, setChecklist] = useState({});
  useEffect(() => { if (app) setChecklist(app.checklist || {}); }, [app?.id]);

  if (isLoading) return <div className="max-w-7xl mx-auto px-6 py-10 space-y-4"><Skeleton className="h-10 w-72" /><Skeleton className="h-64 w-full" /></div>;
  if (!app) return <EmptyState icon={FileText} title="Application not found." actionLabel="Back to applications" actionTo="/admin/applications" />;
  if (role === "government" && !["Surveyor Review Complete", "ULPIN Assigned", "Rejected"].includes(app.status)) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-5">
        <Link to="/admin/applications" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink"><ChevronLeft className="w-4 h-4" />ULPIN Applications</Link>
        <Panel title="Waiting for Surveyor Review" icon={ListChecks}>
          <p className="text-sm text-muted-foreground">Government can review the documents and make a decision only after a Surveyor completes the required checklist.</p>
          <div className="mt-4 flex items-center gap-3"><span className="font-mono text-sm">{app.application_number}</span><StatusBadge status={app.status} /></div>
          <p className="mt-5 border-t border-line pt-4 text-sm text-muted-foreground">A Surveyor account must complete the checklist first.</p>
        </Panel>
      </div>
    );
  }
  const p = getProperty(app.property_id);
  const point = [app.latitude, app.longitude];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link to="/admin/applications" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink"><ChevronLeft className="w-4 h-4" />ULPIN Applications</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-ink font-mono">{app.application_number}</h1>
        <StatusBadge status={app.status} />
        <span className="text-sm text-muted-foreground">Submitted {fmtDate(app.submitted_at || app.created_date)}</span>
      </div>
      {app.demo_ulpin && <UlpinAssignedBanner ulpin={app.demo_ulpin} propertyId={app.property_id} />}

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="space-y-6">
          <Panel title="Property Information" icon={Info} action={p && <Link to={`/property/${p.id}`} className="text-xs font-semibold text-primary">Property Details</Link>}>
            <InfoGrid cols="sm:grid-cols-3" items={[
              { label: "Property", value: app.property_name }, { label: "Property Type", value: app.property_type }, { label: "Building Type", value: app.building_type },
              { label: "Floors", value: app.floors }, { label: "Location", value: `${app.locality}, ${app.mandal}, ${app.district}, ${app.state}` },
              { label: "Coordinates", value: `${app.latitude}, ${app.longitude}`, mono: true },
            ]} />
          </Panel>
          <Panel title="Parcel Information" icon={MapIcon}>
            <InfoGrid cols="sm:grid-cols-3" items={[{ label: "Parcel Number", value: app.parcel_number, mono: true }, { label: "Plot Area", value: app.plot_area }, { label: "Land Type", value: app.land_type }]} />
          </Panel>
          <Panel title="Applicant Information" icon={User}>
            <InfoGrid cols="sm:grid-cols-2" items={[{ label: "Full Name", value: app.applicant_name }, { label: "Mobile", value: app.applicant_phone }, { label: "Email", value: app.applicant_email }, { label: "Address", value: app.applicant_address }]} />
          </Panel>
          <Panel title="Documents" icon={FileText}>
            {(app.documents || []).length === 0 ? <p className="text-sm text-muted-foreground">No documents uploaded.</p> : (
              <ul className="grid sm:grid-cols-2 gap-2">{app.documents.map((d) => (
                <li key={d.label}><button onClick={() => openPrivate(d.file_uri)} className="w-full flex items-center gap-3 rounded-lg border border-line p-3 text-left hover:bg-muted">
                  <FileText className="w-4 h-4 text-primary" /><span className="flex-1 min-w-0"><span className="block text-sm font-medium">{d.label}</span><span className="block text-xs text-muted-foreground truncate">{d.name}</span></span><ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </button></li>))}</ul>
            )}
          </Panel>
          <GisCheckPanel check={app.gis_check} />
          <AIDocumentExtraction key={app.id} app={app} />
          <div className="grid md:grid-cols-2 gap-6">
            <Panel title="Map Location" icon={MapIcon} bodyClass="p-3"><LocationMap propertyId={p?.id} point={point} /></Panel>
            <Panel title="3D Model" icon={Box} bodyClass="p-3">{p ? <Twin3DPreview property={p} /> : <p className="p-3 text-sm text-muted-foreground">No 3D model is available for this property yet.</p>}</Panel>
          </div>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <Panel title="Verification Checklist" icon={ListChecks}>
            <Checklist items={CHECKS} value={checklist} onChange={setChecklist} disabled={
              ["ULPIN Assigned", "Rejected", "Surveyor Review Complete"].includes(app.status) ||
              (role === "government" && app.status !== "Under Government Review") ||
              (role !== "government" && role !== "surveyor")
            } />
            <div className="mt-5"><ReviewActions app={app} checklist={checklist} allChecked={CHECKS.every((c) => checklist[c])} /></div>
          </Panel>
          <Panel title="Activity"><HistoryLog items={app.history} /></Panel>
        </div>
      </div>
    </div>
  );
}