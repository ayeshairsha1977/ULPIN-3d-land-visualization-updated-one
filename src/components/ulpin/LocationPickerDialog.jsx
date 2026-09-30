import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import MapView from "@/components/map/MapView";
import { getProperty } from "@/data/properties";
import { fromProperty } from "@/components/ulpin/formModel";

export default function LocationPickerDialog({ open, onOpenChange, form, patch }) {
  const [point, setPoint] = useState(null);
  const [propId, setPropId] = useState(form.property_id || null);

  const confirm = () => {
    if (propId) patch(fromProperty(getProperty(propId)));
    else if (point) patch({ latitude: point.lat.toFixed(6), longitude: point.lng.toFixed(6) });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl z-[1300]">
        <DialogHeader>
          <DialogTitle>Select Location on Map</DialogTitle>
          <DialogDescription>Click a demo property to use its details, or click anywhere to drop a location pin.</DialogDescription>
        </DialogHeader>
        <div className="h-[55vh] rounded-lg overflow-hidden border border-line">
          {open && (
            <MapView selectedId={propId} picked={point} onSelect={(id) => { setPropId(id); setPoint(null); }}
              onMapClick={(ll) => { setPoint(ll); setPropId(null); }} />
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground truncate">
            {propId ? getProperty(propId).shortName : point ? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}` : "Nothing selected"}
          </p>
          <Button onClick={confirm} disabled={!propId && !point}>Use this location</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}