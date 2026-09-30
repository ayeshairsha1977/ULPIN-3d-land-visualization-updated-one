import React from "react";
import { Link } from "react-router-dom";
import { Map as MapIcon, Box } from "lucide-react";

export default function ViewToggle({ propertyId, active, dark }) {
  const base = "flex-1 flex items-center gap-2 px-3 py-2 rounded-md text-left transition";
  const on = dark ? "bg-cyan-400/15 text-cyan-100 ring-1 ring-cyan-400/50" : "bg-white text-ink shadow-sm";
  const off = dark ? "text-slate-400 hover:text-slate-200" : "text-muted-foreground hover:text-ink";
  const items = [
    { key: "2d", to: `/map?property=${propertyId}`, icon: MapIcon, label: "2D MAP", q: "Where is the property?" },
    { key: "3d", to: `/property/${propertyId}/3d`, icon: Box, label: "3D VIEW", q: "What exists inside and above?" },
  ];
  return (
    <div className={`flex gap-1 p-1 rounded-lg ${dark ? "bg-white/5 border border-white/10" : "bg-muted border border-line"}`} role="group" aria-label="2D / 3D view">
      {items.map(({ key, to, icon: I, label, q }) => (
        <Link key={key} to={to} aria-current={active === key ? "page" : undefined} className={`${base} ${active === key ? on : off}`}>
          <I className="w-4 h-4 shrink-0" />
          <span className="min-w-0">
            <span className="block text-xs font-bold tracking-wider">{label}</span>
            <span className="block text-[11px] opacity-80 truncate">{q}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}