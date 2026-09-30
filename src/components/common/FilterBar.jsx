import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// filters: [{ label, value, onChange, options: [string] | [{value,label}] }]
export default function FilterBar({ search, onSearch, placeholder = "Search…", filters = [] }) {
  return (
    <div className="flex flex-col md:flex-row gap-3 mb-5">
      {onSearch && (
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input aria-label="Search" value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} className="pl-9 h-10 bg-card" />
        </div>
      )}
      {filters.map((f) => (
        <Select key={f.label} value={f.value} onValueChange={f.onChange}>
          <SelectTrigger aria-label={f.label} className="h-10 md:w-48 bg-card"><SelectValue placeholder={f.label} /></SelectTrigger>
          <SelectContent>
            {f.options.map((o) => {
              const opt = typeof o === "string" ? { value: o, label: o } : o;
              return <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}