import React from "react";

export default function DemoTag({ children = "Demo Data", className = "" }) {
  return (
    <span className={`inline-flex items-center rounded border border-dashed border-amber-400/80 bg-amber-50 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-amber-800 whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
}