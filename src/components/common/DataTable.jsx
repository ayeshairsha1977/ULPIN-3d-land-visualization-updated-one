import React from "react";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// columns: [{ key, label, render?(row) }]. Table on desktop, cards on mobile.
export default function DataTable({ columns, rows, onRowClick, loading, empty }) {
  if (loading) return <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>;
  if (!rows.length) return empty;
  const cell = (c, r) => (c.render ? c.render(r) : r[c.key] ?? "—");
  return (
    <>
      <div className="hidden md:block overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>{columns.map((c) => <th key={c.key} className="px-4 py-3 font-semibold">{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} onClick={() => onRowClick?.(r)} className="border-t border-line hover:bg-accent/50 cursor-pointer">
                {columns.map((c) => <td key={c.key} className="px-4 py-3 align-middle">{cell(c, r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden space-y-3">
        {rows.map((r) => (
          <button key={r.id} onClick={() => onRowClick?.(r)} className="w-full text-left bg-card border border-line rounded-xl p-4 flex gap-3">
            <dl className="flex-1 grid grid-cols-2 gap-2">
              {columns.filter((c) => c.key !== "action").map((c) => (
                <div key={c.key} className="min-w-0">
                  <dt className="text-[11px] text-muted-foreground">{c.label}</dt>
                  <dd className="text-sm truncate">{cell(c, r)}</dd>
                </div>
              ))}
            </dl>
            <ChevronRight className="w-4 h-4 text-muted-foreground self-center" />
          </button>
        ))}
      </div>
    </>
  );
}