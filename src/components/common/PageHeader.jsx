import React from "react";

export default function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
      <div>
        {eyebrow && <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">{eyebrow}</p>}
        <h1 className="text-2xl md:text-3xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1.5 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}