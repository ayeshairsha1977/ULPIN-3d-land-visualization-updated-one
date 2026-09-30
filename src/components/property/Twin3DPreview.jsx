import React, { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Box } from "lucide-react";

const ThreeViewer = lazy(() => import("@/components/twin/ThreeViewer"));

export default function Twin3DPreview({ property, className = "h-72" }) {
  return (
    <div className={`relative rounded-xl overflow-hidden border border-cyan-400/20 bg-navy-twin ${className}`}>
      <p className="absolute top-3 left-3 z-10 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200 pointer-events-none">3D Digital Twin · Schematic</p>
      <Suspense fallback={<div className="absolute inset-0 animate-pulse bg-cyan-400/5" />}>
        <ThreeViewer property={property} autoRotate showLabels={false} />
      </Suspense>
      <Link to={`/property/${property.id}/3d`} className="no-print absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-cyan-400 text-[#04121b] text-xs font-bold hover:bg-cyan-300">
        <Box className="w-3.5 h-3.5" /> Open 3D Viewer
      </Link>
    </div>
  );
}