import React from "react";
import { Camera } from "lucide-react";
import TwinPanel from "@/components/twin/TwinPanel";
import PropertyPhoto from "@/components/common/PropertyPhoto";

export default function RealReferencePanel({ property }) {
  return (
    <TwinPanel title="Real Building Reference" icon={Camera}>
      <PropertyPhoto property={property} showLabel={false} className="aspect-[4/3] rounded-lg" />
      <p className="text-xs text-slate-400 mt-3">
        {property.photo
          ? "Actual photograph of the building, used as the reference for the schematic 3D digital twin."
          : property.isMrecw
          ? "The real building photograph will appear here once uploaded."
          : "No verified photograph is available for this demo property."}
      </p>
    </TwinPanel>
  );
}