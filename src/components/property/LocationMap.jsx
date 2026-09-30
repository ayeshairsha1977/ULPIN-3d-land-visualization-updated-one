import React from "react";
import { Link } from "react-router-dom";
import { Map as MapIcon } from "lucide-react";
import MapView from "@/components/map/MapView";
import { PROPERTIES } from "@/data/properties";

export default function LocationMap({ propertyId, point, className = "h-72" }) {
  const props = propertyId ? PROPERTIES.filter((p) => p.id === propertyId) : [];
  return (
    <div className={`relative rounded-xl overflow-hidden border border-line ${className}`}>
      <MapView properties={props} selectedId={propertyId} picked={point} />
      <span className="absolute top-3 left-3 z-[1000] rounded bg-white/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink shadow">2D Map · Demo Property Boundary</span>
      {propertyId && (
        <Link to={`/map?property=${propertyId}`} className="no-print absolute bottom-3 right-3 z-[1000] inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-white text-ink text-xs font-bold shadow hover:bg-muted">
          <MapIcon className="w-3.5 h-3.5" /> Open in Map
        </Link>
      )}
    </div>
  );
}