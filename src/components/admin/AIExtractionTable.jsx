import React from "react";
import { AlertTriangle, CheckCircle2, CircleDashed, MinusCircle } from "lucide-react";

const COMPARISON = {
  match: { icon: CheckCircle2, cls: "text-emerald-700", text: "Matches application" },
  differs: { icon: AlertTriangle, cls: "text-orange-700", text: "Differs from application" },
  "not-found": { icon: MinusCircle, cls: "text-muted-foreground", text: "Not found in document" },
  "not-declared": { icon: CircleDashed, cls: "text-muted-foreground", text: "Not in application" },
};

function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  const tone = value >= 0.85 ? "bg-emerald-600" : value >= 0.6 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2 min-w-[92px]" title={`Model confidence ${pct}%`}>
      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] tabular-nums text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function AIExtractionTable({ rows }) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="px-1 py-2 font-semibold">Field</th>
            <th className="px-1 py-2 font-semibold">AI candidate</th>
            <th className="px-1 py-2 font-semibold">Confidence</th>
            <th className="px-1 py-2 font-semibold">Applicant declared</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => {
            const cmp = COMPARISON[row.comparison];
            const Icon = cmp.icon;
            return (
              <tr key={row.field} className={row.comparison === "differs" || row.lowConfidence ? "bg-orange-50/60" : ""}>
                <td className="px-1 py-2 font-medium text-ink whitespace-nowrap">{row.label}</td>
                <td className="px-1 py-2">
                  {row.value ? <span className="text-ink">{row.value}</span> : <span className="text-muted-foreground">—</span>}
                  {row.source_quote && <span className="block text-[11px] text-muted-foreground italic truncate max-w-[260px]" title={row.source_quote}>“{row.source_quote}”</span>}
                </td>
                <td className="px-1 py-2">{row.value ? <ConfidenceBar value={row.confidence} /> : null}</td>
                <td className="px-1 py-2">
                  <span className="block text-muted-foreground">{row.declared || "—"}</span>
                  <span className={`inline-flex items-center gap-1 text-[11px] ${cmp.cls}`}><Icon className="w-3 h-3" aria-hidden="true" />{cmp.text}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
