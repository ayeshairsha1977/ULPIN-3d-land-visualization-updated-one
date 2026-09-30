import React from "react";
import { Image } from "@/components/ui/image";
import { Building2, Camera } from "lucide-react";
import { useEntityList } from "@/hooks/useData";

const ALT = { "mrecw-block-3": "Malla Reddy Engineering College for Women Block 3" };

export default function PropertyPhoto({ property, className = "", showLabel = true }) {
  const { data: photos = [] } = useEntityList("PropertyPhoto", { property_id: property.id });
  const record = photos[0];
  const src = property.photo || record?.file_uri;
  const label = record ? "Official Building Photo" : "Real Building Reference";

  if (src) {
    return (
      <div className={`relative overflow-hidden bg-muted ${className}`}>
        <Image src={src} alt={ALT[property.id] || property.name} className="w-full h-full" fittingType="fill" />
        {showLabel && (property.isMrecw || record) && (
          <span className="absolute bottom-2 left-2 rounded bg-navy/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">{label}</span>
        )}
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden flex flex-col items-center justify-center text-center bg-[#E8F1F3] ${className}`} role="img" aria-label={`${property.name} — photo not available`}>
      <div className="absolute inset-0 opacity-40 bg-[linear-gradient(#cfdfe3_1px,transparent_1px),linear-gradient(90deg,#cfdfe3_1px,transparent_1px)] bg-[size:22px_22px]" />
      <div className="relative w-10 h-10 rounded-lg flex items-center justify-center mb-2" style={{ background: property.color }}>
        {property.isMrecw ? <Camera className="w-5 h-5 text-white" /> : <Building2 className="w-5 h-5 text-white" />}
      </div>
      <p className="relative text-xs font-semibold text-ink px-3">{property.isMrecw ? "Real building photo — awaiting upload" : "No verified photo"}</p>
      <p className="relative text-[11px] text-muted-foreground">{property.isMrecw ? "Real Building Reference" : "Schematic placeholder"}</p>
    </div>
  );
}