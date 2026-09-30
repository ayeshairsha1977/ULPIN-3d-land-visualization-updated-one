import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRole, ROLE_LABELS } from "@/hooks/useRole";

const HOME = { citizen: "/dashboard", surveyor: "/admin/applications", government: "/admin" };

export default function DemoRoleSwitch({ dark }) {
  const { role, setRole } = useRole();
  const [busy, setBusy] = useState("");
  const pick = async (r) => { setBusy(r); await setRole(r, HOME[r]); };

  return (
    <div>
      <p className={`text-[11px] font-semibold uppercase tracking-widest mb-2 ${dark ? "text-amber-300" : "text-amber-700"}`}>Demo Mode · Switch role</p>
      <div className="grid gap-1.5">
        {Object.entries(ROLE_LABELS).map(([r, label]) => (
          <button key={r} onClick={() => pick(r)} disabled={!!busy || r === role}
            className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm text-left transition ${
              r === role ? (dark ? "border-cyan-400/60 bg-white/10 text-white" : "border-brand bg-accent text-ink font-medium")
              : dark ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-line hover:bg-muted"}`}>
            {label}
            {busy === r ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : r === role && <span className="text-[10px] uppercase tracking-wider">Active</span>}
          </button>
        ))}
      </div>
    </div>
  );
}