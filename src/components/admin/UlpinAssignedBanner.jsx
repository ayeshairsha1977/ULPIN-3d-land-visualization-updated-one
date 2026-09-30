import React from "react";
import { Link } from "react-router-dom";
import { BadgeCheck } from "lucide-react";
import DemoTag from "@/components/common/DemoTag";

export default function UlpinAssignedBanner({ ulpin, propertyId }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <BadgeCheck className="w-8 h-8 text-emerald-600 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-emerald-800 flex flex-wrap items-center gap-2">Demo ULPIN Assigned <DemoTag>Demo ULPIN</DemoTag></p>
        <p className="font-mono text-2xl font-semibold text-emerald-900 mt-1">{ulpin}</p>
        <p className="text-xs text-emerald-800/80 mt-1">Simulated approval — not an official government ULPIN.</p>
      </div>
      {propertyId && (
        <Link to={`/property-record/${propertyId}`} className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800">Open Digital Property Record</Link>
      )}
    </div>
  );
}