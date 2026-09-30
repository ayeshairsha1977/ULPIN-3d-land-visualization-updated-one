import React from "react";
import { FlaskConical } from "lucide-react";
import { useRole } from "@/hooks/useRole";

export default function DemoBanner() {
  const { label } = useRole();
  return (
    <div className="no-print bg-amber-50 border-b border-amber-200 text-amber-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center gap-2 text-xs">
        <FlaskConical className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span className="font-bold tracking-wider">DEMO MODE</span>
        <span className="hidden sm:inline text-amber-800">Prototype — not connected to any official government ULPIN database.</span>
        <span className="ml-auto font-medium whitespace-nowrap">Role: {label}</span>
      </div>
    </div>
  );
}