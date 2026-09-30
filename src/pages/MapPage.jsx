import React, { useState } from "react";
import MapView from "@/components/map/MapView";
import MapSearch from "@/components/map/MapSearch";
import MapControls from "@/components/map/MapControls";
import MapLegend from "@/components/map/MapLegend";
import PropertyPanel from "@/components/map/PropertyPanel";
import { PROPERTIES } from "@/data/properties";
import { useStatuses } from "@/hooks/useData";

export default function MapPage() {
  const [selectedId, setSelectedId] = useState(() => new URLSearchParams(window.location.search).get("property"));
  const [map, setMap] = useState(null);
  const [basemap, setBasemap] = useState("satellite");
  const [filters, setFilters] = useState({ type: "all", verification: "all", ulpin: "all" });
  const statuses = useStatuses();

  const visible = PROPERTIES.filter((p) => {
    const s = statuses.get(p.id);
    return (filters.type === "all" || p.category === filters.type)
      && (filters.verification === "all" || s.verification_status === filters.verification)
      && (filters.ulpin === "all" || s.ulpin_status === filters.ulpin);
  });
  const selected = visible.find((p) => p.id === selectedId);

  return (
    <div className="relative h-[calc(100dvh-94px)] min-h-[520px] overflow-hidden">
      <MapView properties={visible} selectedId={selectedId} onSelect={setSelectedId} basemap={basemap} onReady={setMap} />

      <div className="absolute top-4 left-4 right-4 sm:right-auto z-[1000]">
        <MapSearch statuses={statuses} onSelect={setSelectedId} filters={filters} setFilters={setFilters} />
        {visible.length === 0 && (
          <p className="mt-2 inline-block rounded-md bg-white px-3 py-2 text-sm shadow border border-line">No properties match these filters.</p>
        )}
      </div>

      <div className={`absolute bottom-8 right-4 z-[1000] ${selected ? "hidden sm:block" : ""}`}>
        <MapControls map={map} basemap={basemap} setBasemap={setBasemap} />
      </div>

      <div className={`absolute bottom-6 left-4 z-[1000] ${selected ? "hidden sm:block" : ""}`}>
        <MapLegend onSelect={setSelectedId} />
      </div>

      {selected && (
        <div className="absolute z-[1000] inset-x-0 bottom-0 sm:inset-x-auto sm:bottom-auto sm:top-4 sm:right-4 sm:w-[370px]">
          <PropertyPanel property={selected} status={statuses.get(selected.id)} onClose={() => setSelectedId(null)} />
        </div>
      )}
    </div>
  );
}