import React from "react";
import { Link } from "react-router-dom";
import { MessageSquareWarning } from "lucide-react";
import Panel from "@/components/common/Panel";
import StatusBadge from "@/components/common/StatusBadge";
import { useEntityList } from "@/hooks/useData";
import { fmtDate } from "@/lib/ids";

export default function ComplaintHistoryCard({ property }) {
  const { data = [], isLoading } = useEntityList("Complaint", { property_id: property.id });
  return (
    <Panel title="Complaint History" icon={MessageSquareWarning}
      action={<Link to={`/complaints/new?property=${property.id}`} className="no-print text-xs font-semibold text-primary">Raise Complaint</Link>}>
      {isLoading ? <div className="h-12 rounded bg-muted animate-pulse" /> : data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No complaints yet for this property.</p>
      ) : (
        <ul className="divide-y divide-line">
          {data.map((c) => (
            <li key={c.id} className="py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-mono text-xs">{c.complaint_number}</span>
              <span className="flex-1 min-w-[140px]">{c.category}</span>
              <span className="text-xs text-muted-foreground">{fmtDate(c.created_date)}</span>
              <StatusBadge status={c.status} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}