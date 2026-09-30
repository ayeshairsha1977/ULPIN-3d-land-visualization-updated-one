import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import Timeline from "@/components/common/Timeline";
import HistoryLog from "@/components/common/HistoryLog";
import { COMPLAINT_STAGES, complaintStageIndex } from "@/data/constants";
import { fmtDate } from "@/lib/ids";

export default function ComplaintCard({ complaint: c, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const flag = c.status === "Action Required" ? { label: "More information requested from you", tone: "attention" } : null;
  return (
    <article className="bg-card border border-line rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="w-full p-4 sm:p-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-left hover:bg-muted/40">
        <span className="font-mono text-sm font-semibold text-primary">{c.complaint_number}</span>
        <span className="flex-1 min-w-[180px]">
          <span className="block text-sm font-medium text-ink truncate">{c.property_name}</span>
          <span className="block text-xs text-muted-foreground">{c.category}</span>
        </span>
        <span className="text-xs text-muted-foreground">{fmtDate(c.created_date)}</span>
        <StatusBadge status={c.status} />
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-line p-5 grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Timeline</p>
            <Timeline steps={COMPLAINT_STAGES} current={complaintStageIndex(c)} flag={flag} />
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Details</p>
              <p className="text-sm text-ink whitespace-pre-line">{c.description}</p>
              {c.assigned_officer && <p className="text-xs text-muted-foreground mt-2">Assigned officer: {c.assigned_officer}</p>}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Activity</p>
              <HistoryLog items={c.history} />
            </div>
            {c.property_id && <Link to={`/property/${c.property_id}`} className="inline-block text-sm font-semibold text-primary hover:underline">View property</Link>}
          </div>
        </div>
      )}
    </article>
  );
}