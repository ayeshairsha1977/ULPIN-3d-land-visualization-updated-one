import React from "react";
import { Link } from "react-router-dom";
import { X, Box, FileText, MessageSquareWarning, MapPin, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import PropertyPhoto from "@/components/common/PropertyPhoto";
import StatusBadge from "@/components/common/StatusBadge";
import DemoTag from "@/components/common/DemoTag";
import ViewToggle from "@/components/map/ViewToggle";
import { polygonAreaSqm, polygonPerimeterM, fmtNum } from "@/lib/geo";

export default function PropertyPanel({ property: p, status, onClose }) {
  return (
    <div className="bg-white rounded-t-2xl sm:rounded-xl border border-line shadow-2xl overflow-hidden max-h-[62vh] sm:max-h-[calc(100vh-150px)] flex flex-col">
      <div className="relative">
        <PropertyPhoto property={p} className="h-36 sm:h-44" />
        <button onClick={onClose} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 shadow flex items-center justify-center" aria-label="Close property panel"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-4 overflow-y-auto space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-1.5 py-0.5 rounded text-[11px] font-bold text-white" style={{ background: p.color }}>{p.code}</span>
            <span className="text-xs text-muted-foreground">{p.type}</span>
          </div>
          <h2 className="text-lg font-bold text-ink leading-snug">{p.name}</h2>
          <p className="text-sm text-muted-foreground flex items-start gap-1.5 mt-1"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />{p.location}</p>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-xs text-muted-foreground">Floors</dt><dd className="font-medium">{p.floorsLabel}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Parcel</dt><dd className="font-mono text-xs mt-1">{p.parcelNumber}</dd></div>
          <div><dt className="text-xs text-muted-foreground mb-1">ULPIN Status</dt><dd><StatusBadge status={status.ulpin_status} /></dd></div>
          <div><dt className="text-xs text-muted-foreground mb-1">Verification</dt><dd><StatusBadge status={status.verification_status} /></dd></div>
        </dl>
        <div className="rounded-lg bg-muted/60 border border-line p-3 text-xs">
          <p className="flex items-center gap-1.5 font-semibold text-ink mb-1"><Ruler className="w-3.5 h-3.5" /> Measure Area <DemoTag>Demo Measurement</DemoTag></p>
          <p className="text-muted-foreground">Demo boundary ≈ {fmtNum(polygonAreaSqm(p.polygon))} m² · perimeter ≈ {fmtNum(polygonPerimeterM(p.polygon))} m</p>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Button asChild className="h-11"><Link to={`/property/${p.id}/3d`}><Box className="w-4 h-4 mr-2" />View 3D</Link></Button>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline" className="h-11"><Link to={`/property/${p.id}`}><FileText className="w-4 h-4 mr-1.5" />Details</Link></Button>
            <Button asChild variant="outline" className="h-11"><Link to={`/complaints/new?property=${p.id}`}><MessageSquareWarning className="w-4 h-4 mr-1.5" />Complaint</Link></Button>
          </div>
        </div>
        <ViewToggle propertyId={p.id} active="2d" />
      </div>
    </div>
  );
}