import React from "react";
import { Checkbox } from "@/components/ui/checkbox";

export default function Checklist({ items, value = {}, onChange, disabled }) {
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it}>
          <label className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm cursor-pointer ${value[it] ? "border-emerald-300 bg-emerald-50/60" : "border-line"}`}>
            <Checkbox checked={!!value[it]} disabled={disabled} onCheckedChange={(v) => onChange({ ...value, [it]: !!v })} />
            <span className="flex-1">{it}</span>
            <span className={`text-xs ${value[it] ? "text-emerald-700" : "text-muted-foreground"}`}>{value[it] ? "Checked" : "Pending"}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}