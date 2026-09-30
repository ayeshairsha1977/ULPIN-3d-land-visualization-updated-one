import React from "react";

const STEPS = [
  ["Identify Property", "Locate the property by name, parcel number or on the satellite map."],
  ["Map Parcel", "Represent the parcel footprint as a georeferenced 2D boundary."],
  ["Build 3D Digital Twin", "Extrude the footprint into a floor-by-floor 3D model."],
  ["Map Vertical Structure", "Record floors, rooms, labs, lifts and staircases."],
  ["Verify Property", "Surveyors and officials review map, model and documents."],
  ["Create Digital Property Record", "Publish one connected record with history and ULPIN status."],
];

export default function HowItWorks() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
      <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">How it works</p>
      <h2 className="text-2xl md:text-3xl font-bold text-ink max-w-xl">Six steps from a parcel on a map to a verified digital record</h2>
      <ol className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line rounded-xl overflow-hidden border border-line">
        {STEPS.map(([t, d], i) => (
          <li key={t} className="bg-card p-6">
            <span className="font-mono text-sm text-brand-accent font-medium">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-2 font-bold text-ink">{t}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}