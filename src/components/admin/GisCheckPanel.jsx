import React from "react";
import { CheckCircle2, MapPinned, TriangleAlert } from "lucide-react";
import Panel from "@/components/common/Panel";
import { fmtNum } from "@/lib/geo";

// Deterministic geometry computed by PostGIS when the application was submitted.
// It is evidence for the surveyor, not a decision.
export default function GisCheckPanel({ check }) {
  if (!check) return null;
  const inside = check.point_inside_parcel;
  const Icon = inside ? CheckCircle2 : TriangleAlert;
  return (
    <Panel title="Automated GIS Check" icon={MapPinned} action={<span className="text-[11px] text-muted-foreground">PostGIS · deterministic</span>}>
      <p className={`flex items-center gap-2 text-sm font-medium ${inside ? "text-emerald-800" : "text-orange-800"}`}>
        <Icon className="w-4 h-4" aria-hidden="true" />
        {inside
          ? "The submitted coordinates fall inside the recorded parcel boundary."
          : `The submitted coordinates are ${fmtNum(check.distance_from_parcel_m)} m outside the recorded parcel boundary.`}
      </p>
      <dl className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
        <div><dt className="text-xs text-muted-foreground">Parcel area (geodesic)</dt><dd className="font-medium text-ink">{fmtNum(check.parcel_area_sqm)} m²</dd></div>
        <div><dt className="text-xs text-muted-foreground">Method</dt><dd className="text-ink">{check.method}</dd></div>
      </dl>
    </Panel>
  );
}
