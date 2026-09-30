import React from "react";
import { DoorOpen } from "lucide-react";
import TwinPanel from "@/components/twin/TwinPanel";

export default function RoomInfoPanel({ room }) {
  return (
    <TwinPanel title="Room Information" icon={DoorOpen} right={<span className="text-[10px] uppercase tracking-wider text-amber-300/90">Demo Data</span>}>
      {!room ? (
        <p className="text-sm text-slate-400">Click a room in the model or in the floor list to see its details.</p>
      ) : (
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="col-span-2">
            <dt className="text-[11px] text-slate-500">Room Name</dt>
            <dd className="text-lg font-heading font-bold text-white">{room.name}</dd>
          </div>
          <div><dt className="text-[11px] text-slate-500">Room Number</dt><dd className="font-mono text-cyan-200">{room.number}</dd></div>
          <div><dt className="text-[11px] text-slate-500">Floor</dt><dd className="text-slate-100">{room.floorName}</dd></div>
          <div><dt className="text-[11px] text-slate-500">Type</dt><dd className="text-slate-100">{room.type}</dd></div>
          <div>
            <dt className="text-[11px] text-slate-500">Status</dt>
            <dd className="inline-flex items-center gap-1.5 text-emerald-300"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{room.status}</dd>
          </div>
          {room.side && <div><dt className="text-[11px] text-slate-500">Side</dt><dd className="text-slate-100">{room.side}</dd></div>}
          <div><dt className="text-[11px] text-slate-500">Footprint</dt><dd className="text-slate-100">{room.w} × {room.d} u</dd></div>
        </dl>
      )}
    </TwinPanel>
  );
}