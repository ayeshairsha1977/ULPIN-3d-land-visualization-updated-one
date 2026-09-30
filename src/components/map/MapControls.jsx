import React from "react";
import { Plus, Minus, Crosshair, Layers } from "lucide-react";
import { allBounds } from "@/lib/geo";
import { PROPERTIES } from "@/data/properties";

const btn = "w-10 h-10 flex items-center justify-center text-ink hover:bg-muted transition";

export default function MapControls({ map, basemap, setBasemap }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="bg-white rounded-lg border border-line shadow-md overflow-hidden divide-y divide-line">
        <button className={btn} onClick={() => map?.zoomIn()} aria-label="Zoom in"><Plus className="w-4 h-4" /></button>
        <button className={btn} onClick={() => map?.zoomOut()} aria-label="Zoom out"><Minus className="w-4 h-4" /></button>
      </div>
      <button className={`${btn} bg-white rounded-lg border border-line shadow-md`} onClick={() => map?.flyToBounds(allBounds(PROPERTIES), { padding: [60, 60] })} aria-label="Reset view" title="Reset view">
        <Crosshair className="w-4 h-4" />
      </button>
      <button className={`${btn} bg-white rounded-lg border border-line shadow-md`} onClick={() => setBasemap(basemap === "satellite" ? "streets" : "satellite")}
        aria-label={`Switch to ${basemap === "satellite" ? "street" : "satellite"} map`} title={basemap === "satellite" ? "Street map" : "Satellite map"}>
        <Layers className="w-4 h-4" />
      </button>
    </div>
  );
}