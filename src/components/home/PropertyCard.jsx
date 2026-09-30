import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Box } from "lucide-react";
import PropertyPhoto from "@/components/common/PropertyPhoto";

export default function PropertyCard({ property: p }) {
  return (
    <article className="group bg-card rounded-xl border border-line overflow-hidden flex flex-col hover:shadow-md transition">
      <PropertyPhoto property={p} className="aspect-[16/10]" />
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-1.5 py-0.5 rounded font-bold text-white" style={{ background: p.color }}>{p.code}</span>
          <span className="text-muted-foreground">{p.type}</span>
        </div>
        <h3 className="mt-2 font-bold text-ink leading-snug">{p.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">Floors: <span className="font-medium text-ink">{p.floorsLabel}</span></p>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">{p.description}</p>
        <div className="mt-5 flex gap-2">
          <Link to={`/map?property=${p.id}`} className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90">
            <MapPin className="w-4 h-4" /> View on Map
          </Link>
          <Link to={`/property/${p.id}/3d`} className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg border border-line text-sm font-semibold hover:bg-muted" aria-label={`View ${p.shortName} in 3D`}>
            <Box className="w-4 h-4" /> 3D
          </Link>
        </div>
      </div>
    </article>
  );
}