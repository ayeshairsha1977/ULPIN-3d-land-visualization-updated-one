import React, { useState } from "react";
import { AlertTriangle, Loader2, ScanText, ShieldAlert, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Panel from "@/components/common/Panel";
import AIExtractionTable from "@/components/admin/AIExtractionTable";
import { compareWithApplication } from "@/lib/aiCompare";
import { fmtDateTime } from "@/lib/ids";
import { useRole } from "@/hooks/useRole";
import { useInvalidate } from "@/hooks/useData";
import { recordAiExtractionReview, runAiExtraction } from "@/services/workflow";

const CLOSED = ["ULPIN Assigned", "Rejected"];

export default function AIDocumentExtraction({ app }) {
  const { role } = useRole();
  const invalidate = useInvalidate();
  const documents = app.documents || [];
  const [label, setLabel] = useState(documents[0]?.label || "");
  const [result, setResult] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const canReview = (role === "surveyor" || role === "government") && !CLOSED.includes(app.status);
  const reviewed = (app.ai_extractions || []).find((x) => x.document_label === label);
  // A result belongs to the document it was requested for; ignore it once another is selected.
  const fresh = result?.label === label ? result.data : null;
  const shown = fresh || reviewed?.result || null;
  const rows = shown ? compareWithApplication(shown, app) : [];
  const differences = rows.filter((r) => r.comparison === "differs" || r.lowConfidence).length;

  const selectDocument = (next) => { setLabel(next); setResult(null); setNote(""); setError(""); };

  const run = async () => {
    const doc = documents.find((d) => d.label === label);
    if (!doc) return;
    setBusy("extract");
    setError("");
    try {
      setResult({ label: doc.label, data: await runAiExtraction(app.id, doc.label) });
    } catch (err) {
      console.error("AI extraction failed", err);
      setError(err.message || "AI extraction failed.");
    } finally {
      setBusy("");
    }
  };

  const record = async () => {
    setBusy("record");
    setError("");
    try {
      await recordAiExtractionReview(app.id, result.data.run_id, note);
      invalidate("ULPINApplication");
      setResult(null);
      setNote("");
    } catch (err) {
      setError(err.message || "Could not record the review.");
    } finally {
      setBusy("");
    }
  };

  if (!documents.length) return null;

  return (
    <Panel title="AI Document Extraction" icon={ScanText} action={<span className="text-[11px] font-semibold uppercase tracking-wider text-violet-700">Human review required</span>}>
      <div className="flex flex-wrap items-center gap-2">
        <select value={label} onChange={(e) => selectDocument(e.target.value)} aria-label="Document to analyse" disabled={!!busy}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          {documents.map((d) => <option key={d.label} value={d.label}>{d.label} — {d.name}</option>)}
        </select>
        {canReview && (
          <Button variant="outline" onClick={run} disabled={!!busy}>
            {busy === "extract" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ScanText className="w-4 h-4 mr-2" />}
            {busy === "extract" ? "Reading document…" : "Extract with AI"}
          </Button>
        )}
      </div>

      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}

      {!shown && !error && (
        <p className="mt-3 text-sm text-muted-foreground">
          Claude reads the uploaded document and proposes values for the parcel, owner, area and floors, with a confidence score and the text it read them from. You compare those against the original before relying on them.
        </p>
      )}

      {shown && (
        <div className="mt-4 space-y-3">
          {reviewed && !fresh && (
            <p className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
              <UserCheck className="w-3.5 h-3.5" />Reviewed by {reviewed.reviewer_name} on {fmtDateTime(reviewed.reviewed_at)}: {reviewed.reviewer_note}
            </p>
          )}
          <p className="text-sm text-ink">{shown.summary}</p>
          {differences > 0 && <p className="text-xs font-medium text-orange-800">{differences} field(s) differ from the application or have low confidence. Check them against the original.</p>}
          <AIExtractionTable rows={rows} />
          {shown.warnings.length > 0 && (
            <ul className="space-y-1">
              {shown.warnings.map((w, i) => <li key={`${i}-${w}`} className="flex gap-2 text-xs text-amber-800"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />{w}</li>)}
            </ul>
          )}
          <p className="flex gap-2 text-[11px] text-muted-foreground"><ShieldAlert className="w-3.5 h-3.5 shrink-0" />{shown.disclaimer} Model: {shown.model}.</p>

          {fresh && canReview && (
            <div className="border-t border-line pt-3 space-y-2">
              <label htmlFor="ai-review-note" className="text-sm font-medium text-ink">What did you check against the original?</label>
              <textarea id="ai-review-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Parcel number and area confirmed on page 2; owner name spelling differs."
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              <Button onClick={record} disabled={!!busy || !note.trim()}>
                {busy === "record" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserCheck className="w-4 h-4 mr-2" />}Record my review
              </Button>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
