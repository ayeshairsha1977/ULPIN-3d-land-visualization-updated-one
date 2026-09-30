import React from "react";
import { statusMeta } from "@/lib/status";

export default function StatusBadge({ status, className = "" }) {
  const { cls, icon: Icon } = statusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${cls} ${className}`}>
      <Icon className="w-3 h-3" aria-hidden="true" />
      {status}
    </span>
  );
}