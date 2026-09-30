import React from "react";

export default function FloorSelector({ floors, selected, onSelect, dark = true }) {
  const opts = [{ key: null, short: "All Floors" }, ...floors];
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Floor selector">
      {opts.map((f) => {
        const on = selected === f.key;
        return (
          <button key={f.key || "all"} role="tab" aria-selected={on} onClick={() => onSelect(f.key)}
            className={`shrink-0 px-3.5 h-9 rounded-md text-xs font-semibold tracking-wide border transition ${
              dark
                ? on ? "bg-cyan-400 text-[#04121b] border-cyan-300 shadow-[0_0_0_3px_rgba(34,211,238,0.15)]" : "border-white/10 text-slate-300 hover:border-cyan-400/40 hover:text-white"
                : on ? "bg-primary text-white border-primary" : "border-line bg-card text-ink hover:bg-muted"}`}>
            {f.short}
          </button>
        );
      })}
    </div>
  );
}