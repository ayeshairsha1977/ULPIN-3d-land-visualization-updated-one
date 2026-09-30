import React from "react";

const LEVELS = ["Terrace Rooms + Open Terrace", "Floor 3 · Classrooms", "Floor 2 · Classrooms", "Floor 1 · Hostel rooms", "Ground · Labs / Mess / Shop", "Basement / Service Area"];

export default function WhyThreeD() {
  return (
    <section className="bg-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-cyan-300 mb-2">Why 3D?</p>
          <h2 className="text-2xl md:text-3xl font-bold">A parcel is not only a flat shape</h2>
          <div className="mt-6 space-y-4 text-slate-300 leading-relaxed">
            <p>Traditional 2D maps represent parcels horizontally — one polygon per piece of land.</p>
            <p>But buildings contain multiple vertical levels: basements, shops, hostel rooms, classrooms, laboratories and terrace structures.</p>
            <p>This platform adds a 3D representation so that vertical property information becomes easier to understand, verify and manage.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 p-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">2D Parcel</p>
            <div className="mt-6 mx-auto w-28 h-20 border-2 border-dashed border-teal-300 bg-teal-400/15 rounded-sm" />
            <p className="mt-6 text-sm text-slate-400">Where is the property?</p>
          </div>
          <div className="rounded-xl border border-cyan-400/25 bg-navy-twin p-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-300">3D Property</p>
            <ul className="mt-4 space-y-1">
              {LEVELS.map((l) => <li key={l} className="text-[11px] px-2 py-1 rounded border border-cyan-400/25 text-cyan-100 truncate">{l}</li>)}
            </ul>
            <p className="mt-4 text-sm text-slate-400">What exists inside and above?</p>
          </div>
        </div>
      </div>
    </section>
  );
}