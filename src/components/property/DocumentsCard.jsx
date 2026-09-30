import React from "react";
import { FileText, ExternalLink } from "lucide-react";
import Panel from "@/components/common/Panel";
import DemoTag from "@/components/common/DemoTag";
import { useEntityList } from "@/hooks/useData";
import { openPrivate } from "@/lib/files";

export default function DocumentsCard({ property }) {
  const { data: apps = [] } = useEntityList("ULPINApplication", { property_id: property.id });
  const uploaded = apps.flatMap((a) => (a.documents || []).map((d) => ({ ...d, app: a.application_number })));
  return (
    <Panel title="Documents" icon={FileText}>
      <ul className="grid sm:grid-cols-2 gap-2">
        {property.documents.map((d) => (
          <li key={d.name} className="flex items-center gap-3 rounded-lg border border-line p-3">
            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium flex-1 truncate">{d.name}</span>
            <DemoTag>Demo Document</DemoTag>
          </li>
        ))}
        {uploaded.map((d, i) => (
          <li key={i}>
            <button onClick={() => openPrivate(d.file_uri)} className="w-full flex items-center gap-3 rounded-lg border border-line p-3 text-left hover:bg-muted">
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <span className="min-w-0 flex-1"><span className="block text-sm font-medium truncate">{d.label}</span><span className="block text-[11px] text-muted-foreground truncate">{d.name} · {d.app}</span></span>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}