import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SubmitSuccess({ label, number, message, primary, secondary }) {
  return (
    <div className="max-w-lg mx-auto text-center bg-card border border-line rounded-2xl p-10">
      <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center"><CheckCircle2 className="w-7 h-7 text-emerald-600" /></div>
      <p className="mt-5 text-lg font-bold text-ink">{message}</p>
      <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold text-primary">{number}</p>
      <p className="mt-3 text-xs text-muted-foreground">Demo identifier — not an official government reference.</p>
      <div className="mt-8 flex flex-col sm:flex-row gap-2 justify-center">
        <Button asChild><Link to={primary.to}>{primary.label}</Link></Button>
        {secondary && <Button asChild variant="outline"><Link to={secondary.to}>{secondary.label}</Link></Button>}
      </div>
    </div>
  );
}