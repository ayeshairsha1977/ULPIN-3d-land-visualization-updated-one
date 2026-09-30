import React from "react";
import { Layers } from "lucide-react";
import TwinPanel from "@/components/twin/TwinPanel";

export default function FloorInfoPanel({ property, floor, selectedRoomId, onSelectRoom }) {
  if (!floor) {
    return (
      <TwinPanel title="Floor Structure" icon={Layers}>
        <ul className="space-y-1.5 text-sm">
          {[...property.floors].reverse().map((f) => (
            <li key={f.key} className="flex justify-between gap-3 text-slate-300">
              <span className="font-medium text-slate-100">{f.name}</span>
              <span className="text-xs text-slate-400 text-right">{f.summary}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-500 mt-3">Select a floor to highlight it and explore its rooms.</p>
      </TwinPanel>
    );
  }
  const spaces = floor.rooms;
  return (
    <TwinPanel title={floor.name} icon={Layers} right={<span className="text-[11px] text-slate-400">{floor.rooms.filter((r) => !r.core).length} rooms</span>}>
      <p className="text-xs text-slate-400 mb-3">{floor.summary}</p>
      <div className="grid grid-cols-2 gap-1.5">
        {spaces.map((r) => {
          const on = r.id === selectedRoomId;
          return (
            <button key={r.id} onClick={() => onSelectRoom(r)}
              className={`text-left rounded-md border px-2.5 py-2 transition ${on ? "border-cyan-300 bg-cyan-400/20 text-white" : r.core ? "border-blue-400/15 text-slate-400 hover:border-cyan-400/40" : "border-cyan-400/20 text-slate-200 hover:border-cyan-400/50"}`}>
              <span className="block text-xs font-semibold truncate">{r.name}</span>
              <span className="block text-[10px] text-slate-500">{r.type}</span>
            </button>
          );
        })}
      </div>
    </TwinPanel>
  );
}