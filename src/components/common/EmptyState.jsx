import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function EmptyState({ icon: Icon, title, text, actionLabel, actionTo }) {
  return (
    <div className="text-center py-12 px-6">
      {Icon && <div className="mx-auto w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-4"><Icon className="w-5 h-5 text-primary" /></div>}
      <p className="font-semibold text-ink">{title}</p>
      {text && <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{text}</p>}
      {actionLabel && (
        <Button asChild className="mt-5"><Link to={actionTo}>{actionLabel}</Link></Button>
      )}
    </div>
  );
}