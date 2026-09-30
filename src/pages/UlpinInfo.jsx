import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Info } from "lucide-react";

const FLOW = ["Property Details", "Location & Parcel Information", "Document Submission", "GIS Validation", "Government Verification", "Approval", "ULPIN Assigned", "Digital Property Record"];

export default function UlpinInfo() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 grid lg:grid-cols-[1.1fr_1fr] gap-12">
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">ULPIN</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-ink">What is ULPIN?</h1>
        <p className="mt-5 text-muted-foreground leading-relaxed">
          ULPIN — Unique Land Parcel Identification Number — is a unique identification concept for land parcels based on georeferenced parcel information. Each parcel is identified from its location and boundary so that records can be linked reliably.
        </p>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          This platform extends the idea with a 3D digital twin, so the record can also describe what exists inside and above the parcel.
        </p>
        <div className="mt-6 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <p>This prototype does not assign official ULPINs and is not connected to any government database. Approved demo applications receive a clearly labelled <strong>Demo ULPIN</strong>.</p>
        </div>
        <Link to="/ulpin/request" className="mt-8 inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90">
          Request ULPIN <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <ol className="bg-card border border-line rounded-xl p-6">
        {FLOW.map((s, i) => (
          <li key={s} className="relative flex gap-4 pb-5 last:pb-0">
            {i < FLOW.length - 1 && <span className="absolute left-[13px] top-7 bottom-0 w-px bg-line" />}
            <span className="relative z-10 w-7 h-7 shrink-0 rounded-full bg-accent text-primary font-mono text-xs font-semibold flex items-center justify-center">{i + 1}</span>
            <p className="pt-1 text-sm font-medium text-ink">{s}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}