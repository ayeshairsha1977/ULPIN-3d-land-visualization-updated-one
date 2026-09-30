import React from "react";
import DemoTag from "@/components/common/DemoTag";

export default function InfoGrid({ items, cols = "sm:grid-cols-2" }) {
  return (
    <dl className={`grid grid-cols-1 ${cols} gap-x-6 gap-y-4`}>
      {items.map(({ label, value, demo, mono }) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-muted-foreground flex items-center gap-1.5">{label}{demo && <DemoTag />}</dt>
          <dd className={`mt-0.5 text-sm font-medium text-ink break-words ${mono ? "font-mono" : ""}`}>{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}