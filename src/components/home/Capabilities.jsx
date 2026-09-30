import React from "react";
import { Box, Layers, Fingerprint, ShieldCheck, MessageSquareWarning, History } from "lucide-react";

const ITEMS = [
  [Box, "3D Digital Twin", "Interactive, schematic building model with floor and room selection."],
  [Layers, "Vertical Property Mapping", "Basements, floors, rooms and terrace structures on one parcel."],
  [Fingerprint, "ULPIN Request", "Prefilled application workflow with GIS and document validation."],
  [ShieldCheck, "Property Verification", "Checklist-based review of map, model, data and documents."],
  [MessageSquareWarning, "Complaint Management", "Raise and track issues like boundary mismatch or encroachment."],
  [History, "Property Change History", "A timeline of every change to the property record."],
];

export default function Capabilities() {
  return (
    <section className="bg-card border-y border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">Key capabilities</p>
        <h2 className="text-2xl md:text-3xl font-bold text-ink">One connected property platform</h2>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ITEMS.map(([Icon, t, d]) => (
            <div key={t} className="rounded-xl border border-line p-6 hover:border-brand/40 transition">
              <span className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center"><Icon className="w-5 h-5 text-primary" /></span>
              <h3 className="mt-4 font-bold text-ink">{t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}