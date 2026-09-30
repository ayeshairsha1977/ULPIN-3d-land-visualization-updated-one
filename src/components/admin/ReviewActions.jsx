import React, { useState } from "react";
import { Loader2, CheckCircle2, AlertTriangle, XCircle, ScanLine, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useRole } from "@/hooks/useRole";
import { useInvalidate } from "@/hooks/useData";
import { reviewApplication } from "@/services/workflow";

export default function ReviewActions({ app, checklist, allChecked }) {
  const { user, role } = useRole();
  const invalidate = useInvalidate();
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const isSurveyor = role === "surveyor";
  const isGovernment = role === "government";
  const readyForGovernment = app.status === "Surveyor Review Complete";
  const closed = ["ULPIN Assigned", "Rejected"].includes(app.status);

  const act = async (status) => {
    if (status === "Correction Required" && !remarks.trim()) return setErr("Please add remarks describing the correction needed.");
    if (status === "Surveyor Review Complete" && !allChecked) return setErr("Complete every checklist item before submitting the review.");
    if (["Approved", "Rejected"].includes(status) && !readyForGovernment) return setErr("A Surveyor must complete the review before Government can decide.");
    setErr("");
    setBusy(status);
    try {
      await reviewApplication(app.id, status, remarks.trim(), checklist);
      invalidate("ULPINApplication", "PropertyStatus", "Verification", "PropertyHistory", "Notification");
      setRemarks("");
    } catch (error) {
      setErr(error.message || "The review action could not be completed.");
    } finally {
      setBusy("");
    }
  };
  const spin = (s, Icon) => (busy === s ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Icon className="w-4 h-4 mr-2" />);

  if (closed) return <p className="text-sm text-muted-foreground">This application is closed ({app.status}).</p>;
  if (!isSurveyor && !isGovernment) return <p className="text-sm text-muted-foreground">Reviewer access is required for this application.</p>;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="remarks">{isSurveyor ? "Surveyor review remarks" : "Government decision remarks"}</Label>
         <textarea id="remarks" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add notes for the applicant…" disabled={isGovernment && !readyForGovernment}
          className="w-full rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
      {isSurveyor && !readyForGovernment && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" disabled={!!busy || app.status === "Under GIS Validation"} onClick={() => act("Under GIS Validation")}>{spin("Under GIS Validation", ScanLine)}GIS Validation</Button>
            <Button variant="outline" size="sm" disabled={!!busy || app.status === "Under Verification"} onClick={() => act("Under Verification")}>{spin("Under Verification", Search)}Document Review</Button>
          </div>
          <Button className="w-full bg-emerald-700 hover:bg-emerald-800" disabled={!!busy || !allChecked} onClick={() => act("Surveyor Review Complete")}>{spin("Surveyor Review Complete", CheckCircle2)}Complete Surveyor Review</Button>
          {!allChecked && <p className="text-xs text-muted-foreground">Complete all checklist items before handing this to Government.</p>}
          <Button variant="outline" className="w-full border-orange-300 text-orange-800 hover:bg-orange-50" disabled={!!busy} onClick={() => act("Correction Required")}>{spin("Correction Required", AlertTriangle)}Request Correction</Button>
          <p className="text-[11px] text-muted-foreground">Completing this step records the surveyor findings. It does not verify the property.</p>
        </>
      )}
      {isSurveyor && readyForGovernment && (
        <p className="rounded-md border border-line bg-muted/50 p-3 text-sm">Surveyor review completed by {app.surveyor_review?.reviewer_name || "Surveyor"}. This application is waiting for Government's decision.</p>
      )}
      {isGovernment && (
        <>
          {app.surveyor_review?.reviewed_at && (
            <div className="rounded-md border border-line bg-muted/50 p-3 text-sm">
              Optional Surveyor review by <strong>{app.surveyor_review.reviewer_name}</strong>.
              {app.surveyor_review.remarks && <p className="mt-1 text-muted-foreground">{app.surveyor_review.remarks}</p>}
            </div>
          )}
          {!readyForGovernment ? (
            <p className="rounded-md border border-line bg-muted/50 p-3 text-sm">Waiting for mandatory Surveyor document and property review. Government decisions unlock after Surveyor handoff.</p>
          ) : (
            <>
              <p className="rounded-md border border-line bg-muted/50 p-3 text-sm">Surveyor review completed by <strong>{app.surveyor_review?.reviewer_name || "Surveyor"}</strong>. Government may now make the final decision.</p>
              <Button className="w-full bg-emerald-700 hover:bg-emerald-800" disabled={!!busy || !allChecked} onClick={() => act("Approved")}>{spin("Approved", CheckCircle2)}Approve and Assign Demo ULPIN</Button>
              <Button variant="outline" className="w-full border-red-300 text-red-700 hover:bg-red-50" disabled={!!busy} onClick={() => act("Rejected")}>{spin("Rejected", XCircle)}Reject Application</Button>
              {!allChecked && <p className="text-xs text-muted-foreground">Complete the checklist before approving.</p>}
            </>
          )}
        </>
      )}
      <p className="text-[11px] text-muted-foreground">Demo workflow. The server checks your role and records every decision in the audit log.</p>
    </div>
  );
}