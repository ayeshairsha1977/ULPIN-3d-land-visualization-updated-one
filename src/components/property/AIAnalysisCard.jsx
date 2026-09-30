import React from "react";
import { Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import Panel from "@/components/common/Panel";
import DemoTag from "@/components/common/DemoTag";

export default function AIAnalysisCard({ property }) {
  return (
    <Panel title="AI-Assisted Property Analysis" icon={Sparkles} action={<DemoTag>Demo AI Analysis</DemoTag>}>
      <ul className="space-y-3">
        {property.analysis.map((a) => (
          <li key={a.title} className="flex gap-3">
            {a.flag ? <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />}
            <div>
              <p className="text-sm font-semibold text-ink">{a.title}{a.flag && <span className="ml-2 text-[11px] font-medium text-amber-700">Needs review</span>}</p>
              <p className="text-sm text-muted-foreground">{a.detail}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[11px] text-muted-foreground">Illustrative outputs — no AI model or confidence score is involved. Not an official government decision.</p>
    </Panel>
  );
}