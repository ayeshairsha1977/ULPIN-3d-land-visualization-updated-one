import React, { useState } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import FilterBar from "@/components/common/FilterBar";
import { PROPERTIES } from "@/data/properties";
import { PROPERTY_CATEGORIES, VERIFICATION_STATUSES, ULPIN_STATUSES } from "@/data/constants";

const withAll = (label, list) => [{ value: "all", label }, ...list];

export default function MapSearch({ statuses, onSelect, filters, setFilters }) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const results = term
    ? PROPERTIES.filter((p) => {
        const s = statuses.get(p.id);
        return [p.name, p.shortName, p.type, p.parcelNumber, p.propertyCode, p.location, s.ulpin].join(" ").toLowerCase().includes(term);
      })
    : [];
  const set = (k) => (v) => setFilters({ ...filters, [k]: v });
  const active = Object.values(filters).filter((v) => v !== "all").length;

  return (
    <div className="w-full sm:w-96">
      <div className="flex gap-2">
        <div className="relative flex-1 bg-white rounded-lg border border-line shadow-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search properties"
            placeholder="Search by ULPIN, parcel number, property name…" className="w-full h-11 pl-9 pr-9 bg-transparent rounded-lg text-sm outline-none" />
          {q && <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground" aria-label="Clear search"><X className="w-4 h-4" /></button>}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative h-11 w-11 bg-white rounded-lg border border-line shadow-md flex items-center justify-center" aria-label="Filter properties">
              <SlidersHorizontal className="w-4 h-4 text-ink" />
              {active > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[10px] text-white">{active}</span>}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 z-[1200] [&>div]:flex-col [&>div]:mb-0">
            <p className="text-sm font-semibold mb-3">Filter properties</p>
            <FilterBar filters={[
              { label: "Property Type", value: filters.type, onChange: set("type"), options: withAll("All types", PROPERTY_CATEGORIES) },
              { label: "Verification", value: filters.verification, onChange: set("verification"), options: withAll("Any verification", VERIFICATION_STATUSES) },
              { label: "ULPIN Status", value: filters.ulpin, onChange: set("ulpin"), options: withAll("Any ULPIN status", ULPIN_STATUSES) },
            ]} />
          </PopoverContent>
        </Popover>
      </div>
      {term && (
        <ul className="mt-2 bg-white rounded-lg border border-line shadow-lg overflow-hidden divide-y divide-line">
          {results.length === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">No matching property. Try a name, parcel number or ULPIN.</li>}
          {results.map((p) => (
            <li key={p.id}>
              <button onClick={() => { onSelect(p.id); setQ(""); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted">
                <span className="w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0" style={{ background: p.color }}>{p.code}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink truncate">{p.shortName}</span>
                  <span className="block text-xs text-muted-foreground truncate">{p.type} · {p.parcelNumber}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}