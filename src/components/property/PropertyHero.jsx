import React from "react";
import { Link } from "react-router-dom";
import { Box, Fingerprint, MessageSquareWarning, FileBadge, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import PropertyPhoto from "@/components/common/PropertyPhoto";
import StatusBadge from "@/components/common/StatusBadge";
import ViewToggle from "@/components/map/ViewToggle";

export default function PropertyHero({ property: p, status }) {
  return (
    <section className="bg-card border border-line rounded-2xl overflow-hidden grid md:grid-cols-[minmax(0,420px)_1fr]">
      <PropertyPhoto property={p} className="aspect-[4/3] md:aspect-auto md:min-h-[300px]" />
      <div className="p-6 lg:p-8 flex flex-col">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-1.5 py-0.5 rounded font-bold text-white" style={{ background: p.color }}>{p.code}</span>
          <span className="text-muted-foreground">{p.type}</span>
        </div>
        <h1 className="mt-2 text-2xl lg:text-3xl font-bold text-ink leading-tight">{p.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground flex items-start gap-1.5"><MapPin className="w-4 h-4 mt-0.5 shrink-0" />{p.location}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge status={status.verification_status} />
          <StatusBadge status={status.ulpin_status === "Assigned" ? "ULPIN Assigned" : `ULPIN: ${status.ulpin_status}`} />
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild><Link to={`/property/${p.id}/3d`}><Box className="w-4 h-4 mr-2" />View 3D</Link></Button>
          <Button asChild variant="outline"><Link to={`/ulpin/request?property=${p.id}`}><Fingerprint className="w-4 h-4 mr-2" />Request ULPIN</Link></Button>
          <Button asChild variant="outline"><Link to={`/complaints/new?property=${p.id}`}><MessageSquareWarning className="w-4 h-4 mr-2" />Raise Complaint</Link></Button>
          <Button asChild variant="ghost"><Link to={`/property-record/${p.id}`}><FileBadge className="w-4 h-4 mr-2" />Digital Property Record</Link></Button>
        </div>
        <div className="mt-auto pt-6 max-w-md"><ViewToggle propertyId={p.id} /></div>
      </div>
    </section>
  );
}