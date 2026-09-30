import React from "react";

// Dark panel used in the 3D digital twin sidebar.
export default function TwinPanel({ title, icon: Icon, right, children }) {
  return (
    <section className="rounded-xl border border-cyan-400/15 bg-[#0B1A26]/90">
      <header className="flex items-center justify-between px-4 py-3 border-b border-cyan-400/10">
        <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-200">
          {Icon && <Icon className="w-3.5 h-3.5" aria-hidden="true" />}
          {title}
        </h2>
        {right}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}