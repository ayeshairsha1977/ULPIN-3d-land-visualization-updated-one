import { CheckCircle2, Clock, AlertTriangle, XCircle, CircleDashed, CircleDot } from "lucide-react";

const TONES = {
  success: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  warning: { cls: "bg-amber-50 text-amber-800 border-amber-200", icon: Clock },
  attention: { cls: "bg-orange-50 text-orange-800 border-orange-200", icon: AlertTriangle },
  danger: { cls: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  info: { cls: "bg-cyan-50 text-cyan-800 border-cyan-200", icon: CircleDot },
  neutral: { cls: "bg-slate-50 text-slate-600 border-slate-200", icon: CircleDashed },
};

const MAP = {
  Verified: "success", Approved: "success", "ULPIN Assigned": "success", Assigned: "success", Resolved: "success", Active: "success", Occupied: "success",
  Closed: "neutral", "Not Requested": "neutral", "Not Assigned": "neutral", Open: "info", Available: "info",
  Submitted: "warning", "Application Submitted": "warning", "Pending Verification": "warning",
  "Under Review": "info", "Under Government Review": "info", "Under Verification": "info", "Under GIS Validation": "info", "Surveyor Review Complete": "info", "Field Verification": "info",
  "Correction Required": "attention", "Action Required": "attention",
  Rejected: "danger", "Complaint Rejected": "danger", "Verification Removed": "danger", "Verification Revoked": "danger", High: "danger", Medium: "warning", Low: "neutral",
  "Complaint Valid / Confirmed": "success",
};

export function statusMeta(status) {
  const tone = MAP[status] || "neutral";
  return { tone, ...TONES[tone] };
}