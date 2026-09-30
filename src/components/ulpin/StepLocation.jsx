import React, { useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Field from "@/components/ulpin/Field";
import LocationPickerDialog from "@/components/ulpin/LocationPickerDialog";
import { PROPERTIES, getProperty } from "@/data/properties";
import { fromProperty } from "@/components/ulpin/formModel";

export default function StepLocation({ form, set, patch, errors }) {
  const [picker, setPicker] = useState(false);
  const choose = (v) => (v === "other" ? patch({ property_id: "", property_name: "" }) : patch(fromProperty(getProperty(v))));
  return (
    <div className="grid sm:grid-cols-2 gap-5">
      <div className="sm:col-span-2 space-y-1.5">
        <Label htmlFor="property_pick">Property</Label>
        <Select value={form.property_id || (form.property_name ? "other" : undefined)} onValueChange={choose}>
          <SelectTrigger id="property_pick" className="h-11"><SelectValue placeholder="Select a demo property or enter a new one" /></SelectTrigger>
          <SelectContent>
            {PROPERTIES.map((p) => <SelectItem key={p.id} value={p.id}>{p.code} · {p.name}</SelectItem>)}
            <SelectItem value="other">Other / new property</SelectItem>
          </SelectContent>
        </Select>
        {form.property_id && <p className="text-xs text-primary">Known property information has been prefilled.</p>}
      </div>
      <div className="sm:col-span-2"><Field id="property_name" label="Property Name" value={form.property_name} onChange={set("property_name")} error={errors.property_name} /></div>
      <Field id="state" label="State" value={form.state} onChange={set("state")} error={errors.state} />
      <Field id="district" label="District" value={form.district} onChange={set("district")} error={errors.district} />
      <Field id="mandal" label="Mandal" value={form.mandal} onChange={set("mandal")} error={errors.mandal} />
      <Field id="locality" label="Village / Locality" value={form.locality} onChange={set("locality")} error={errors.locality} />
      <Field id="latitude" label="Latitude" value={form.latitude} onChange={set("latitude")} error={errors.latitude} inputMode="decimal" />
      <Field id="longitude" label="Longitude" value={form.longitude} onChange={set("longitude")} error={errors.longitude} inputMode="decimal" />
      <div className="sm:col-span-2">
        <Button type="button" variant="outline" onClick={() => setPicker(true)}><MapPin className="w-4 h-4 mr-2" />Select Location on Map</Button>
      </div>
      <LocationPickerDialog open={picker} onOpenChange={setPicker} form={form} patch={patch} />
    </div>
  );
}