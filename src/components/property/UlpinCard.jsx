import React from "react";
import { Link } from "react-router-dom";
import { Fingerprint, Check } from "lucide-react";
import Panel from "@/components/common/Panel";
import DemoTag from "@/components/common/DemoTag";
import { ULPIN_STATUSES } from "@/data/constants";

export default function UlpinCard({ property, status }) {
  const idx = ULPIN_STATUSES.indexOf(status.ulpin_status);
  return (
    <Panel title="ULPIN Information" icon={Fingerprint}>
      <p className="text-xs text-muted-foreground">ULPIN</p>
      {status.ulpin ? (
        <p className="mt-1 flex flex-wrap items-center gap-2"><span className="font-mono text-lg font-semibold text-ink">{status.ulpin}</span><DemoTag>Demo ULPIN</DemoTag></p>
      ) : (
        <p className="mt-1 text-lg font-semibold text-muted-foreground">Not Assigned</p>
      )}
      <ol className="mt-5 space-y-2">
        {ULPIN_STATUSES.map((s, i) => (
          <li key={s} className={`flex items-center gap-2.5 text-sm ${i <= idx ? "text-ink" : "text-muted-foreground"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${i <= idx ? "bg-brand border-brand" : "border-line"}`}>
              {i <= idx && <Check className="w-3 h-3 text-white" />}
            </span>
            {s}
            {i === idx && <span className="ml-auto text-[10px] uppercase tracking-wider text-primary font-semibold">Current</span>}
          </li>
        ))}
      </ol>
      {status.ulpin_status === "Not Requested" && (
        <Link to={`/ulpin/request?property=${property.id}`} className="mt-5 inline-flex w-full items-center justify-center h-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90">Request ULPIN</Link>
      )}
    </Panel>
  );
}