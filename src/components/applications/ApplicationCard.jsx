import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import DemoTag from "@/components/common/DemoTag";
import Timeline from "@/components/common/Timeline";
import HistoryLog from "@/components/common/HistoryLog";
import { APP_STAGES, APP_STAGE_INDEX } from "@/data/constants";
import { fmtDate } from "@/lib/ids";

export default function ApplicationCard({ app, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const flag = app.status === "Correction Required" ? { label: "Correction required — additional documents needed", tone: "attention" }
    : app.status === "Rejected" ? { label: "Application rejected (demo)", tone: "danger" } : null;
  return (
    <article className="bg-card border border-line rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="w-full p-4 sm:p-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-left hover:bg-muted/40">
        <span className="font-mono text-sm font-semibold text-primary">{app.application_number}</span>
        <span className="flex-1 min-w-[180px] text-sm font-medium text-ink truncate">{app.property_name}</span>
        <span className="text-xs text-muted-foreground">{fmtDate(app.submitted_at || app.created_date)}</span>
        <StatusBadge status={app.status} />
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-line p-5 grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Progress</p>
            <Timeline steps={APP_STAGES} current={APP_STAGE_INDEX[app.status] ?? 0} flag={flag} />
            {app.demo_ulpin && (
              <div className="mt-5 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                <p className="text-xs text-emerald-800 font-semibold flex items-center gap-2">Demo ULPIN Assigned <DemoTag>Demo ULPIN</DemoTag></p>
                <p className="font-mono text-lg font-semibold text-emerald-900 mt-1">{app.demo_ulpin}</p>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Activity</p>
            <HistoryLog items={app.history} />
            {app.property_id && (
              <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
                <Link to={`/property/${app.property_id}`} className="text-primary hover:underline">View property</Link>
                <Link to={`/property-record/${app.property_id}`} className="text-primary hover:underline">Digital Property Record</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}