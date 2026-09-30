import React from "react";
import { ShieldCheck } from "lucide-react";
import Panel from "@/components/common/Panel";
import StatusBadge from "@/components/common/StatusBadge";
import { useEntityList } from "@/hooks/useData";
import { fmtDateTime } from "@/lib/ids";

export default function VerificationCard({ property }) {
  const { data = [] } = useEntityList("Verification", { property_id: property.id });
  return (
    <Panel title="Verification History" icon={ShieldCheck}>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Pending verification — no reviews recorded yet.</p>
      ) : (
        <ul className="space-y-3">
          {data.map((v) => (
            <li key={v.id} className="text-sm border-l-2 border-line pl-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={v.status} />
                <span className="text-xs text-muted-foreground">{fmtDateTime(v.reviewed_at || v.created_date)} · {v.reviewer_name} ({v.reviewer_role})</span>
              </div>
              {v.remarks && <p className="text-muted-foreground mt-1">{v.remarks}</p>}
              {v.removal_reason && <p className="text-xs text-red-600 mt-1">Removal reason: {v.removal_reason}</p>}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-[11px] text-muted-foreground">Demo workflow — not an official government verification.</p>
    </Panel>
  );
}