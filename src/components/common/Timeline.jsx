import React from "react";
import { Check, AlertTriangle, XCircle } from "lucide-react";

// Stage timeline: filled for reached stages, hollow for upcoming.
export default function Timeline({ steps, current, flag }) {
  return (
    <ol className="relative">
      {steps.map((label, i) => {
        const done = i < current || (i === current && !flag);
        const isFlag = i === current && flag;
        const FlagIcon = flag?.tone === "danger" ? XCircle : AlertTriangle;
        return (
          <li key={label} className="relative flex gap-3 pb-5 last:pb-0">
            {i < steps.length - 1 && (
              <span className={`absolute left-[11px] top-6 bottom-0 w-px ${i < current ? "bg-brand" : "bg-line"}`} />
            )}
            <span className={`relative z-10 mt-0.5 w-6 h-6 shrink-0 rounded-full flex items-center justify-center border-2 ${
              isFlag ? (flag.tone === "danger" ? "bg-red-50 border-red-500" : "bg-orange-50 border-orange-500")
              : done ? "bg-brand border-brand" : "bg-card border-line"}`}>
              {isFlag ? <FlagIcon className={`w-3.5 h-3.5 ${flag.tone === "danger" ? "text-red-600" : "text-orange-600"}`} />
                : done ? <Check className="w-3.5 h-3.5 text-white" /> : null}
            </span>
            <div className="pt-0.5">
              <p className={`text-sm font-medium ${done || isFlag ? "text-ink" : "text-muted-foreground"}`}>{label}</p>
              {isFlag && <p className="text-xs text-orange-700 mt-0.5">{flag.label}</p>}
              {!done && !isFlag && <p className="text-xs text-muted-foreground mt-0.5">Pending</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}