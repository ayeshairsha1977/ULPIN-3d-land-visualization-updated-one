import React from "react";
import { fmtDateTime } from "@/lib/ids";
import StatusBadge from "@/components/common/StatusBadge";

export default function HistoryLog({ items = [] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  return (
    <ul className="space-y-3">
      {[...items].reverse().map((h, i) => (
        <li key={i} className="text-sm border-l-2 border-line pl-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={h.status} />
            <span className="text-xs text-muted-foreground">{fmtDateTime(h.at)} · {h.by}</span>
          </div>
          {h.note && <p className="text-muted-foreground mt-1">{h.note}</p>}
        </li>
      ))}
    </ul>
  );
}