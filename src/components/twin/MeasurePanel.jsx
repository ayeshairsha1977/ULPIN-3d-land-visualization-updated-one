import React from "react";
import { Ruler } from "lucide-react";
import TwinPanel from "@/components/twin/TwinPanel";
import { FLOOR_HEIGHT } from "@/data/properties";

export default function MeasurePanel({ property, floor }) {
  const levels = property.floors.filter((f) => f.level >= 0).length;
  const rows = [
    ["Footprint (schematic)", `${property.dims.w} × ${property.dims.d} units`],
    ["Footprint area (schematic)", `${property.dims.w * property.dims.d} sq units`],
    ["Building height (schematic)", `${(levels * FLOOR_HEIGHT).toFixed(1)} units · ${property.heightLabel}`],
  ];
  if (floor) rows.push([`${floor.name} elevation`, `${(floor.level * FLOOR_HEIGHT).toFixed(1)} units`]);
  return (
    <TwinPanel title="Measure" icon={Ruler} right={<span className="text-[10px] uppercase tracking-wider text-amber-300/90">Demo Measurement</span>}>
      <dl className="space-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-slate-400">{k}</dt>
            <dd className="text-slate-100 text-right font-mono text-xs">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[11px] text-slate-500 mt-3">Values come from schematic demo geometry, not a survey.</p>
    </TwinPanel>
  );
}