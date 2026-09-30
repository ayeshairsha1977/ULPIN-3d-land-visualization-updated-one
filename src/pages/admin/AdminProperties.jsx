import React, { useState } from "react";
import { Loader2, ShieldCheck, AlertTriangle, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/common/PageHeader";
import Panel from "@/components/common/Panel";
import InfoGrid from "@/components/common/InfoGrid";
import StatusBadge from "@/components/common/StatusBadge";
import Checklist from "@/components/admin/Checklist";
import LocationMap from "@/components/property/LocationMap";
import Twin3DPreview from "@/components/property/Twin3DPreview";
import VerificationCard from "@/components/property/VerificationCard";
import { propertyFields } from "@/components/property/propertyFields";
import { PROPERTIES } from "@/data/properties";
import { useEntityList, useStatuses, useInvalidate } from "@/hooks/useData";
import { useRole, ROLE_TITLES } from "@/hooks/useRole";
import { verifyProperty } from "@/services/workflow";
import RemoveVerificationDialog from "@/components/admin/RemoveVerificationDialog";

const CHECKS = ["2D map & boundary", "3D model", "Property data", "Documents"];

export default function AdminProperties() {
  const { user, role } = useRole();
  const canManageVerification = role === "government";
  const [pid, setPid] = useState(PROPERTIES[2].id);
  const { data: applications = [] } = useEntityList("ULPINApplication", { property_id: pid });
  const statuses = useStatuses();
  const invalidate = useInvalidate();
  const [checks, setChecks] = useState({});
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState("");
  const [actionError, setActionError] = useState("");
  const p = PROPERTIES.find((x) => x.id === pid);
  const s = statuses.get(pid);
  const all = CHECKS.every((c) => checks[c]);
  const hasSurveyorReview = applications.some((application) => application.surveyor_review?.reviewed_at);

  const act = async (status) => {
    if (!canManageVerification) return;
    setBusy(status);
    setActionError("");
    try {
      await verifyProperty(pid, status, remarks.trim(), checks, user, `${ROLE_TITLES[role]} (Demo)`);
      invalidate("PropertyStatus", "Verification", "PropertyHistory");
      setRemarks(""); setChecks({});
    } catch (error) {
      console.error("Property verification failed", error);
      setActionError(error.message || "We couldn't update the verification. Please try again.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <PageHeader eyebrow="Surveyor / Government Demo" title="Property Verification" subtitle="Verify the 2D map, 3D model, property data and documents for each property." />
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        {PROPERTIES.map((x) => (
          <button key={x.id} onClick={() => { setPid(x.id); setChecks({}); }} aria-pressed={pid === x.id}
            className={`text-left rounded-xl border p-4 bg-card transition ${pid === x.id ? "border-primary ring-2 ring-primary/15" : "border-line hover:border-primary/40"}`}>
            <p className="text-xs text-muted-foreground"><span className="font-mono">{x.code}</span> · {x.category}</p>
            <p className="font-semibold text-ink mt-1 truncate">{x.shortName}</p>
            <div className="mt-2"><StatusBadge status={statuses.get(x.id).verification_status} /></div>
          </button>
        ))}
      </div>
      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Panel title="2D Map" bodyClass="p-3"><LocationMap propertyId={pid} /></Panel>
            <Panel title="3D Model" bodyClass="p-3"><Twin3DPreview property={p} /></Panel>
          </div>
          <Panel title="Property Data"><InfoGrid items={propertyFields(p, s)} cols="sm:grid-cols-2 xl:grid-cols-3" /></Panel>
          <VerificationCard property={p} />
        </div>
        <Panel title="Verification Checklist" icon={ListChecks} className="lg:sticky lg:top-24">
          <Checklist items={CHECKS} value={checks} onChange={setChecks} disabled={!canManageVerification} />
          <textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Verification remarks…" aria-label="Verification remarks"
            className="mt-4 w-full rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          {canManageVerification ? (
            <div className="mt-3 grid gap-2">
              <Button className="bg-emerald-700 hover:bg-emerald-800" disabled={!!busy || !all || !hasSurveyorReview} onClick={() => act("Verified")}>
                {busy === "Verified" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}Mark Verified
              </Button>
              <Button variant="outline" className="border-orange-300 text-orange-800 hover:bg-orange-50" disabled={!!busy} onClick={() => act("Correction Required")}>
                {busy === "Correction Required" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}Correction Required
              </Button>
            </div>
          ) : <p className="mt-3 text-xs text-muted-foreground">Only a Government Administrator can change verification status.</p>}
          {actionError && <p role="alert" className="mt-2 text-xs text-red-600">{actionError}</p>}
          {canManageVerification && !hasSurveyorReview && <p className="text-xs text-muted-foreground mt-2">A Surveyor must complete the ULPIN application checklist before this property can be verified.</p>}
          {s.verification_status === "Verified" && (
            <div className="mt-2">
              <RemoveVerificationDialog propertyId={pid} />
              <p className="text-xs text-muted-foreground mt-2">Government only — removes the current verification with a required reason.</p>
            </div>
          )}
          {!all && <p className="text-xs text-muted-foreground mt-2">Complete all checks to mark verified.</p>}
        </Panel>
      </div>
    </div>
  );
}