import React from "react";
import { Box } from "lucide-react";

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-muted/40">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <span className="w-9 h-9 rounded-md bg-brand flex items-center justify-center"><Box className="w-4 h-4 text-white" aria-hidden="true" /></span>
          <span className="font-heading font-extrabold text-ink tracking-tight text-lg">ULPIN 3D</span>
        </div>
        <section className="bg-card border border-line rounded-2xl shadow-[0_1px_2px_rgba(15,45,61,0.04)] p-6 sm:p-8">
          <h1 className="text-xl font-bold text-ink">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </section>
        {footer && <div className="mt-4 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}

export function FormField({ id, label, error, ...inputProps }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">{label}</label>
      <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}
        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-red-400"
        {...inputProps} />
      {error && <p id={`${id}-error`} className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// Only same-site paths are allowed as post-login destinations (no open redirects).
export function safeNext(value, fallback) {
  return typeof value === "string" && /^\/(?![/\\])/.test(value) ? value : fallback;
}

export const HOME_BY_ROLE = { citizen: "/dashboard", surveyor: "/admin/applications", government: "/admin" };
