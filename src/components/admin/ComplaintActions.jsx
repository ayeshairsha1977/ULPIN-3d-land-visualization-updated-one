import React, { useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRole } from "@/hooks/useRole";
import { useInvalidate } from "@/hooks/useData";
import { assignComplaint, decideComplaint, setComplaintPriority, updateComplaint } from "@/services/workflow";

export default function ComplaintActions({ complaint: c }) {
  const { isGov } = useRole();
  const invalidate = useInvalidate();
  const [officer, setOfficer] = useState(c.assigned_officer || "Field Officer (Demo)");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [decisionReason, setDecisionReason] = useState("");
  const refresh = () => invalidate("Complaint", "Notification");
  const finalDecision = ["Complaint Valid / Confirmed", "Complaint Rejected"].includes(c.status);
  const underReview = c.status === "Under Government Review";

  const run = async (key, fn) => {
    setBusy(key);
    setError("");
    try {
      await fn();
      refresh();
      setNote("");
    } catch (err) {
      setError(err.message || "The action could not be completed.");
    } finally {
      setBusy("");
    }
  };

  const decide = async (status) => {
    if (!decisionReason.trim()) {
      setError("Enter the review reason before recording a decision.");
      return;
    }
    await run(status, async () => {
      await decideComplaint(c.id, status, decisionReason);
      invalidate("PropertyStatus", "Verification", "PropertyHistory");
      setDecisionReason("");
    });
  };

  const setPriority = (priority) => run("priority", () => setComplaintPriority(c.id, priority));

  if (!isGov) return <p className="text-sm text-muted-foreground">Government reviewer access is required to manage this complaint.</p>;

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {finalDecision && (
        <div className="rounded-md border border-line bg-muted/50 p-3 text-sm">
          Government decision recorded: <strong>{c.status}</strong>.
          {c.review?.reason && <p className="mt-1 text-muted-foreground">{c.review.reason}</p>}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="priority">Priority</Label>
        <Select value={c.priority || "Medium"} onValueChange={setPriority} disabled={!!busy || finalDecision}>
          <SelectTrigger id="priority" className="h-10"><SelectValue /></SelectTrigger>
          <SelectContent>{["High", "Medium", "Low"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="officer">Assign officer</Label>
        <div className="flex gap-2">
          <Input id="officer" value={officer} onChange={(e) => setOfficer(e.target.value)} className="h-10" disabled={!!busy || finalDecision} />
          <Button variant="outline" disabled={!!busy || finalDecision || !officer.trim()} onClick={() => run("assign", () => assignComplaint(c.id, officer.trim()))}>
            {busy === "assign" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Assign
          </Button>
        </div>
      </div>
      {!underReview && !finalDecision && (
        <div className="space-y-2">
          <div className="space-y-1.5">
            <Label htmlFor="review-note">Review note (optional)</Label>
            <textarea id="review-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          </div>
          <Button className="w-full" disabled={!!busy} onClick={() => run("review", async () => {
            if (!c.assigned_officer) await assignComplaint(c.id, officer.trim());
            await updateComplaint(c.id, "Under Government Review", note.trim());
          })}>
            {busy === "review" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Start Government Review
          </Button>
        </div>
      )}
      {underReview && (
        <div className="space-y-3 border-t border-line pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="decision-reason">Decision reason *</Label>
            <textarea id="decision-reason" rows={3} value={decisionReason} onChange={(e) => setDecisionReason(e.target.value)} placeholder="Record the findings supporting the decision." className="w-full rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          </div>
          <Button className="w-full bg-emerald-700 hover:bg-emerald-800" disabled={!!busy || !decisionReason.trim()} onClick={() => decide("Complaint Valid / Confirmed")}>
            {busy === "Complaint Valid / Confirmed" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}Complaint Valid / Confirmed
          </Button>
          <Button variant="outline" className="w-full" disabled={!!busy || !decisionReason.trim()} onClick={() => decide("Complaint Rejected")}>
            {busy === "Complaint Rejected" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}Complaint Rejected
          </Button>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">Only a government reviewer can record a decision. Submitting a complaint does not change verification status.</p>
    </div>
  );
}