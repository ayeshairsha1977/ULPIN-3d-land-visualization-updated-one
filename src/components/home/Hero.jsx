import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import HeroVisual from "@/components/home/HeroVisual";

export default function Hero() {
  return (
    <section className="relative bg-navy text-white overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24 grid lg:grid-cols-[1fr_1.05fr] gap-12 items-center">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] uppercase text-cyan-300 mb-5">3D ULPIN Property Mapping & Digital Twin Platform</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.08]">From 2D Parcels to 3D Digital Property Records</h1>
          <p className="mt-5 text-lg text-slate-300 max-w-xl leading-relaxed">
            Explore, verify and manage property information through geospatial mapping, vertical building visualization and ULPIN-enabled digital property workflows.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/map" className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-brand-light text-navy font-semibold hover:bg-teal-300 transition">
              Explore Map <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/ulpin/request" className="inline-flex items-center h-12 px-6 rounded-lg border border-white/20 font-semibold hover:bg-white/10 transition">
              Request ULPIN
            </Link>
          </div>
          <p className="mt-8 text-sm font-medium text-slate-400 tracking-wide">Explore. Verify. Visualize. Manage.</p>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}