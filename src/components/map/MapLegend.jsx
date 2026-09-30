import React from "react";
import { PROPERTIES } from "@/data/properties";

export default function MapLegend({ onSelect }) {
  return (
    <div className="bg-white/95 backdrop-blur rounded-lg border border-line shadow-md p-3 w-56">
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Legend</p>
      <ul className="space-y-1">
        {PROPERTIES.map((p) => (
          <li key={p.id}>
            <button onClick={() => onSelect(p.id)} className="w-full flex items-center gap-2 rounded px-1.5 py-1 text-left text-sm hover:bg-muted">
              <span className="w-4 h-4 rounded-sm border-2 shrink-0" style={{ borderColor: p.color, background: `${p.color}55` }} />
              <span className="font-mono text-xs text-muted-foreground">{p.code}</span>
              <span className="truncate text-ink">{p.shortName}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 pt-2 border-t border-line text-[11px] text-muted-foreground flex items-center gap-1.5">
        <span className="w-5 border-t-2 border-dashed border-slate-500" /> Demo Property Boundary
      </p>
    </div>
  );
}