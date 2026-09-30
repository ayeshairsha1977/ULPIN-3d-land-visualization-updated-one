import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Generic labelled field. Pass `options` for a select, `textarea` for multi-line.
export default function Field({ id, label, value, onChange, error, options, textarea, hint, ...rest }) {
  const invalid = error ? { "aria-invalid": true, "aria-describedby": `${id}-err` } : {};
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {options ? (
        <Select value={value || undefined} onValueChange={onChange}>
          <SelectTrigger id={id} className="h-11" {...invalid}><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger>
          <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
      ) : textarea ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={3} {...invalid} {...rest}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
      ) : (
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} className="h-11" {...invalid} {...rest} />
      )}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-err`} className="text-xs text-red-600">{error}</p>}
    </div>
  );
}