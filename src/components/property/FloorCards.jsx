import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Box } from "lucide-react";
import Panel from "@/components/common/Panel";
import StatusBadge from "@/components/common/StatusBadge";

export default function FloorCards({ property }) {
  const [sel, setSel] = useState(null);
  const floor = property.floors.find((f) => f.key === sel);
  return (
    <Panel title="Building Structure" icon={Building2} action={<Link to={`/property/${property.id}/3d`} className="text-xs font-semibold text-primary inline-flex items-center gap-1"><Box className="w-3.5 h-3.5" />Explore in 3D</Link>}>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {property.floors.map((f) => (
          <button key={f.key} onClick={() => setSel(sel === f.key ? null : f.key)} aria-pressed={sel === f.key}
            className={`rounded-lg border p-3 text-left transition ${sel === f.key ? "border-primary bg-accent" : "border-line hover:border-primary/40"}`}>
            <p className="text-sm font-semibold text-ink">{f.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{f.rooms.filter((r) => !r.core).length} rooms / spaces</p>
          </button>
        ))}
      </div>
      {floor && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-sm font-semibold text-ink">{floor.name} <span className="font-normal text-muted-foreground">— {floor.summary}</span></p>
          <ul className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {floor.rooms.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 rounded-md border border-line px-3 py-2 text-sm">
                <span className="min-w-0"><span className="block font-medium truncate">{r.name}</span><span className="block text-[11px] text-muted-foreground">{r.type}</span></span>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">Room layout is demo data unless independently verified.</p>
        </div>
      )}
    </Panel>
  );
}