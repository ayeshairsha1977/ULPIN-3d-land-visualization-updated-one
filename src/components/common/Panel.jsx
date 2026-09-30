import React from "react";

export default function Panel({ title, icon: Icon, action, children, className = "", bodyClass = "p-5" }) {
  return (
    <section className={`bg-card rounded-xl border border-line shadow-[0_1px_2px_rgba(15,45,61,0.04)] print-card ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-line">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
            {Icon && <Icon className="w-4 h-4 text-primary" aria-hidden="true" />}
            {title}
          </h2>
          {action}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}