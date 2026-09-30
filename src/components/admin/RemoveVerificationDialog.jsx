import React, { useState } from "react";
import { Loader2, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRole } from "@/hooks/useRole";
import { useInvalidate } from "@/hooks/useData";
import { removeVerification } from "@/services/workflow";

export const REMOVAL_REASONS = [
  "Incorrect property information",
  "Building structure changed",
  "Documentation issue",
  "Verification error",
  "Property ownership issue",
  "Survey discrepancy",
  "Correction required",
  "Other",
];

export default function RemoveVerificationDialog({ propertyId, onRemoved }) {
  const { user, isGov } = useRole();
  const invalidate = useInvalidate();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [other, setOther] = useState("");
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const finalReason = reason === "Other" ? other.trim() : reason;

  const confirm = async () => {
    if (!finalReason) return setErr("Please select a reason for removing the verification.");
    setBusy(true);
    setErr("");
    await removeVerification(propertyId, finalReason, remarks.trim(), user);
    invalidate("PropertyStatus", "Verification", "PropertyHistory");
    setBusy(false);
    setOpen(false);
    setReason(""); setOther(""); setRemarks("");
    onRemoved?.();
  };

  if (!isGov) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setErr(""); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-red-300 text-red-700 hover:bg-red-50">
          <ShieldX className="w-4 h-4 mr-2" />Remove Verification
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Verification</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove the current verification? The previous verification stays in the
            history and the property becomes eligible for re-verification.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Reason *</Label>
            <Select value={reason} onValueChange={(v) => { setReason(v); setErr(""); }}>
              <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
              <SelectContent>
                {REMOVAL_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {reason === "Other" && (
            <div className="space-y-1.5">
              <Label>Custom reason *</Label>
              <Input value={other} onChange={(e) => setOther(e.target.value)} placeholder="Describe the reason" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Remarks</Label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional remarks for the audit record…"
              aria-label="Removal remarks"
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          {err && <p className="text-xs text-red-600">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-red-600 text-white hover:bg-red-700" disabled={!finalReason || busy} onClick={confirm}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Confirm Removal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}