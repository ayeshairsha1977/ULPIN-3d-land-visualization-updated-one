import React from "react";
import { Check } from "lucide-react";

export default function WizardProgress({ steps, current }) {
  return (
    <ol className="flex items-center gap-2 mb-8" aria-label="Progress">
      {steps.map((s, i) => {
        const done = i < current;
        const on = i === current;
        return (
          <li key={s} className="flex-1 flex items-center gap-2 min-w-0">
            <span className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border-2 ${done ? "bg-brand border-brand text-white" : on ? "border-brand text-primary bg-card" : "border-line text-muted-foreground bg-card"}`}
              aria-current={on ? "step" : undefined}>
              {done ? <Check className="w-4 h-4" /> : i + 1}
            </span>
            <span className={`hidden md:block text-xs font-medium truncate ${on ? "text-ink" : "text-muted-foreground"}`}>{s}</span>
            {i < steps.length - 1 && <span className={`flex-1 h-px ${done ? "bg-brand" : "bg-line"}`} />}
          </li>
        );
      })}
    </ol>
  );
}