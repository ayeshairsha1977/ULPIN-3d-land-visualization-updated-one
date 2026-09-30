import React from "react";
import { History, AlertTriangle } from "lucide-react";
import Panel from "@/components/common/Panel";
import DemoTag from "@/components/common/DemoTag";
import { useEntityList } from "@/hooks/useData";
import { fmtDate } from "@/lib/ids";

export default function HistoryCard({ property }) {
  const { data = [] } = useEntityList("PropertyHistory", { property_id: property.id });
  const items = [
    ...property.history.map((h) => ({ ...h, when: h.year, demo: true })),
    ...[...data].reverse().map((h) => ({ event: h.event, description: h.description, when: fmtDate(h.event_date || h.created_date) })),
  ];
  return (
    <Panel title="Property Change History" icon={History}>
      <ol className="relative border-l border-line ml-2 space-y-5">
        {items.map((h, i) => (
          <li key={i} className="pl-5 relative">
            <span className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${h.flag ? "bg-amber-500" : "bg-brand"}`} />
            <p className="text-xs font-mono text-muted-foreground">{h.when}</p>
            <p className="text-sm font-semibold text-ink flex flex-wrap items-center gap-2">
              {h.flag && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}{h.event}{h.demo && <DemoTag />}
            </p>
            <p className="text-sm text-muted-foreground">{h.description}</p>
          </li>
        ))}
      </ol>
    </Panel>
  );
}