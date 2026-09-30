import React from "react";
import { Globe, Box, Sparkles, Database, Monitor, FileCheck } from "lucide-react";
import HowItWorks from "@/components/home/HowItWorks";

const TECH = [
  [Globe, "GIS", "Satellite basemap, georeferenced demo parcel boundaries, search and measurement."],
  [Box, "3D Visualization", "WebGL digital twin with floor and room selection."],
  [Sparkles, "AI-Assisted Analysis", "Illustrative analysis outputs, clearly labelled as demo."],
  [Database, "Geospatial Database", "Structured records for properties, applications, complaints and history."],
  [Monitor, "Web Application", "Responsive citizen, surveyor and government interfaces."],
  [FileCheck, "Digital Property Records", "Printable, connected record of each property."],
];

const FUTURE = ["Real Government GIS Integration", "Official ULPIN Integration", "Automated 3D Reconstruction", "Satellite Change Detection", "Drone/LiDAR Integration", "Automated Encroachment Analysis", "Real-Time Field Verification", "Mobile Survey Application", "Digital Property Certificates"];

const INSIDE = ["Multiple floors", "Rooms", "Hostels", "Classrooms", "Laboratories", "Commercial spaces", "Basements", "Terrace structures"];

export default function About() {
  return (
    <div>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-8">
        <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">About</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-ink leading-tight">Transforming 2D Property Records into 3D Digital Property Intelligence</h1>
      </section>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-10 py-8">
        <div>
          <h2 className="text-xl font-bold text-ink">Problem</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">Traditional cadastral and property maps primarily represent land horizontally. Modern buildings are vertically structured, and a single parcel may contain:</p>
          <ul className="mt-4 flex flex-wrap gap-2">{INSIDE.map((i) => <li key={i} className="text-xs px-2.5 py-1 rounded-full bg-accent text-ink">{i}</li>)}</ul>
        </div>
        <div>
          <h2 className="text-xl font-bold text-ink">Solution</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">The platform demonstrates how GIS and 3D visualization can create a richer digital property record — connecting location, parcel, building, floors, rooms, verification history, the ULPIN request workflow, complaints and a 3D digital twin.</p>
        </div>
      </section>
      <HowItWorks />
      <section className="bg-card border-y border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold text-ink">Technology</h2>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TECH.map(([I, t, d]) => (
              <div key={t} className="flex gap-4">
                <span className="w-10 h-10 shrink-0 rounded-lg bg-accent flex items-center justify-center"><I className="w-5 h-5 text-primary" /></span>
                <div><h3 className="font-bold text-ink">{t}</h3><p className="text-sm text-muted-foreground mt-1">{d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-ink">Future Scope</h2>
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border border-dashed border-slate-400 text-slate-600">Not yet implemented</span>
        </div>
        <ul className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FUTURE.map((f) => <li key={f} className="rounded-lg border border-dashed border-line bg-card px-4 py-3 text-sm text-ink">{f}</li>)}
        </ul>
      </section>
    </div>
  );
}