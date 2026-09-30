import React from "react";
import { ChevronRight, ShieldCheck } from "lucide-react";

// Real Esri World Imagery tile over Maisammaguda (z17).
const TILE = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/17/59039/94094";

const Card = ({ step, label, children, dark }) => (
  <div className={`rounded-xl overflow-hidden border ${dark ? "border-cyan-400/25 bg-navy-twin" : "border-white/10 bg-white"} shadow-xl`}>
    <div className={`px-3 py-2 text-[10px] font-bold tracking-[0.14em] uppercase ${dark ? "text-cyan-300" : "text-slate-500 border-b border-slate-100"}`}>
      {step} · {label}
    </div>
    <div className="aspect-square relative">{children}</div>
  </div>
);

const floors = [0, 1, 2, 3];

export default function HeroVisual() {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1.5 sm:gap-3">
      <Card step="01" label="2D Map">
        <img src={TILE} alt="Satellite view of the Maisammaguda area" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <div className="absolute left-[34%] top-[36%] w-[34%] h-[22%] border-2 border-indigo-300 bg-indigo-500/35 rounded-[2px]" />
      </Card>
      <ChevronRight className="w-4 h-4 text-cyan-300" />
      <Card step="02" label="3D Twin" dark>
        <svg viewBox="0 0 140 150" className="absolute inset-0 w-full h-full p-3" aria-label="3D building wireframe">
          {floors.map((i) => {
            const y = 112 - i * 24;
            return (
              <polygon key={i} points={`20,${y} 70,${y - 20} 120,${y} 70,${y + 20}`}
                fill={i === 1 ? "rgba(34,211,238,0.35)" : "rgba(34,211,238,0.04)"} stroke={i === 1 ? "#a5f3fc" : "#22d3ee"} strokeOpacity={i === 1 ? 1 : 0.6} strokeWidth="1.2" />
            );
          })}
          {[20, 120].map((x) => <line key={x} x1={x} y1={112} x2={x} y2={40} stroke="#22d3ee" strokeOpacity="0.5" />)}
          <line x1="70" y1="132" x2="70" y2="60" stroke="#22d3ee" strokeOpacity="0.5" />
        </svg>
      </Card>
      <ChevronRight className="w-4 h-4 text-cyan-300" />
      <Card step="03" label="Record">
        <div className="absolute inset-0 p-3 flex flex-col text-ink">
          <p className="text-[9px] font-bold tracking-widest text-slate-500">DIGITAL PROPERTY RECORD</p>
          <p className="mt-1.5 text-xs font-bold leading-tight">MRECW Block 3</p>
          <dl className="mt-2 space-y-1 text-[9px] sm:text-[10px]">
            {[["Parcel", "DEMO-PCL-0103"], ["Floors", "G + 3"], ["ULPIN", "Demo"]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-1"><dt className="text-slate-500">{k}</dt><dd className="font-mono truncate">{v}</dd></div>
            ))}
          </dl>
          <span className="mt-auto inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-emerald-700"><ShieldCheck className="w-3 h-3" />Verification</span>
        </div>
      </Card>
    </div>
  );
}