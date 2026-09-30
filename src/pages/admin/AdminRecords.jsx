import React from "react";
import { Link } from "react-router-dom";
import { FileBadge } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import PropertyPhoto from "@/components/common/PropertyPhoto";
import StatusBadge from "@/components/common/StatusBadge";
import { PROPERTIES } from "@/data/properties";
import { useStatuses } from "@/hooks/useData";

export default function AdminRecords() {
  const statuses = useStatuses();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <PageHeader eyebrow="Government Demo" title="Digital Property Records" subtitle="Connected records combining parcel, 3D model, floors, verification and history." />
      <div className="grid md:grid-cols-3 gap-5">
        {PROPERTIES.map((p) => {
          const s = statuses.get(p.id);
          return (
            <article key={p.id} className="bg-card border border-line rounded-xl overflow-hidden flex flex-col">
              <PropertyPhoto property={p} className="aspect-[16/9]" />
              <div className="p-4 flex-1 flex flex-col gap-2">
                <p className="font-bold text-ink">{p.shortName}</p>
                <p className="text-xs text-muted-foreground">{p.propertyCode} · {p.parcelNumber}</p>
                <p className="text-xs"><span className="text-muted-foreground">ULPIN: </span><span className="font-mono">{s.ulpin ? `${s.ulpin} (Demo)` : "Not Assigned"}</span></p>
                <div className="flex flex-wrap gap-2"><StatusBadge status={s.verification_status} /><StatusBadge status={s.ulpin_status} /></div>
                <div className="mt-auto pt-3 flex gap-2">
                  <Link to={`/property-record/${p.id}`} className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-md bg-primary text-white text-sm font-semibold"><FileBadge className="w-4 h-4" />Open Record</Link>
                  <Link to={`/property/${p.id}/3d`} className="inline-flex items-center h-9 px-3 rounded-md border border-line text-sm font-semibold">3D</Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}