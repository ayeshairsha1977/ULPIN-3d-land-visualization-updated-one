import React from "react";
import { Link } from "react-router-dom";

export default function StatCard({ label, value, icon: Icon, to, loading }) {
  const body = (
    <div className="bg-card rounded-xl border border-line p-5 h-full transition hover:border-brand/40 hover:shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></span>}
      </div>
      <p className="mt-3 text-3xl font-heading font-bold text-ink">{loading ? <span className="inline-block w-10 h-8 rounded bg-muted animate-pulse" /> : value}</p>
    </div>
  );
  return to ? <Link to={to} className="block">{body}</Link> : body;
}