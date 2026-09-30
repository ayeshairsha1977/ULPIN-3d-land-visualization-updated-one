import React from "react";
import { MapPinOff } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";

export default function PropertyNotFound() {
  return (
    <div className="max-w-xl mx-auto py-20">
      <EmptyState icon={MapPinOff} title="Unable to load property data." text="This property could not be found. Choose a property on the map." actionLabel="Open Map" actionTo="/map" />
    </div>
  );
}