import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Info, RotateCcw, Box, FileBadge } from "lucide-react";
import { getProperty } from "@/data/properties";
import { useStatuses } from "@/hooks/useData";
import TwinPanel from "@/components/twin/TwinPanel";
import StatusBadge from "@/components/common/StatusBadge";
import FloorSelector from "@/components/twin/FloorSelector";
import FloorInfoPanel from "@/components/twin/FloorInfoPanel";
import RoomInfoPanel from "@/components/twin/RoomInfoPanel";
import RealReferencePanel from "@/components/twin/RealReferencePanel";
import MeasurePanel from "@/components/twin/MeasurePanel";
import ViewerControls from "@/components/twin/ViewerControls";
import ViewToggle from "@/components/map/ViewToggle";
import PropertyNotFound from "@/components/common/PropertyNotFound";

const ThreeViewer = lazy(() => import("@/components/twin/ThreeViewer"));

const hdrBtn = "inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-xs font-semibold border border-white/15 text-slate-200 hover:bg-white/10 transition";

export default function DigitalTwin() {
  const { id } = useParams();
  const property = getProperty(id);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [room, setRoom] = useState(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [labels, setLabels] = useState(true);
  const viewer = useRef(null);
  const statuses = useStatuses();

  useEffect(() => { setSelectedFloor(null); setRoom(null); }, [id]);

  if (!property) return <PropertyNotFound />;
  const status = statuses.get(property.id);
  const floor = property.floors.find((f) => f.key === selectedFloor);
  const selectFloor = (k) => { setSelectedFloor(k); setRoom(null); };
  const selectRoom = (r) => { setSelectedFloor(r.floorKey); setRoom(r); };

  return (
    <div className="bg-navy-twin text-slate-200 min-h-[calc(100dvh-94px)]">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-5">
        <div className="flex flex-col xl:flex-row xl:items-center gap-4 justify-between mb-4">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300">
              <Box className="w-3.5 h-3.5" /> 3D Digital Twin
              <span className="text-amber-300/90 normal-case tracking-normal font-medium">· Schematic demo geometry</span>
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">{property.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/map?property=${property.id}`} className={hdrBtn}><ArrowLeft className="w-3.5 h-3.5" />Back to Map</Link>
            <Link to={`/property/${property.id}`} className={hdrBtn}><FileText className="w-3.5 h-3.5" />Property Details</Link>
            <button onClick={() => { viewer.current?.reset(); selectFloor(null); }} className={hdrBtn}><RotateCcw className="w-3.5 h-3.5" />Reset View</button>
            <div className="w-full sm:w-80"><ViewToggle propertyId={property.id} active="3d" dark /></div>
          </div>
        </div>

        <FloorSelector floors={property.floors} selected={selectedFloor} onSelect={selectFloor} />

        <div className="grid lg:grid-cols-[1fr_360px] gap-4 mt-3">
          <div className="relative rounded-xl border border-cyan-400/20 bg-[radial-gradient(ellipse_at_center,#0c2233_0%,#070f17_70%)] h-[56vh] lg:h-[calc(100dvh-250px)] min-h-[420px] overflow-hidden">
            <div className="absolute top-3 left-3 z-10 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-200/90 pointer-events-none">
              3D Digital Twin {floor && <span className="text-white">· {floor.name}</span>}
            </div>
            <Suspense fallback={<div className="absolute inset-0 animate-pulse bg-cyan-400/5 flex items-center justify-center text-sm text-cyan-200/60">Loading 3D viewer…</div>}>
              <ThreeViewer ref={viewer} property={property} selectedFloor={selectedFloor} selectedRoomId={room?.id} onSelectRoom={selectRoom} onSelectFloor={selectFloor} autoRotate={autoRotate} showLabels={labels} />
            </Suspense>
            <p className="absolute top-3 right-3 z-10 hidden md:block text-[11px] text-slate-500 pointer-events-none">Drag to rotate · Scroll to zoom · Click a room</p>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
              <ViewerControls viewer={viewer} autoRotate={autoRotate} setAutoRotate={setAutoRotate} labels={labels} setLabels={setLabels} />
            </div>
          </div>

          <aside className="space-y-4">
            <RealReferencePanel property={property} />
            <FloorInfoPanel property={property} floor={floor} selectedRoomId={room?.id} onSelectRoom={selectRoom} />
            <RoomInfoPanel room={room} />
            <MeasurePanel property={property} floor={floor} />
            {property.layoutNote && <p className="text-xs text-amber-300/80">{property.layoutNote}</p>}
          </aside>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mt-4">
          <TwinPanel title="Building Information" icon={Info}>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Property ID</dt>
                <dd className="font-mono text-slate-100 mt-1">{property.propertyCode}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Parcel Number</dt>
                <dd className="font-mono text-slate-100 mt-1">{property.parcelNumber}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Location</dt>
                <dd className="text-slate-100 mt-1">{property.location}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Type</dt>
                <dd className="text-slate-100 mt-1">{property.type}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Floors</dt>
                <dd className="text-slate-100 mt-1">{property.floorsLabel} · {property.heightLabel}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Verification Status</dt>
                <dd className="mt-1"><StatusBadge status={status.verification_status} /></dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Demo ULPIN</dt>
                <dd className="font-mono text-slate-100 mt-1">{status.ulpin ? `${status.ulpin} (Demo)` : "Not Assigned"}</dd>
              </div>
            </dl>
          </TwinPanel>

          <TwinPanel title="Digital Property Record" icon={FileText}>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Property ID</dt>
                <dd className="font-mono text-slate-100 mt-1">{property.id}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Demo ULPIN</dt>
                <dd className="font-mono text-slate-100 mt-1">{status.ulpin || "Not Assigned"}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Coordinates</dt>
                <dd className="font-mono text-slate-100 mt-1">{property.lat}, {property.lng}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">ULPIN Status</dt>
                <dd className="mt-1"><StatusBadge status={status.ulpin_status} /></dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Verification</dt>
                <dd className="text-slate-100 mt-1">{status.verification_status} — full history, floors, rooms and audit trail are in the property record.</dd>
              </div>
            </dl>
            <Link to={`/property-record/${property.id}`} className="mt-4 inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-cyan-400 text-[#04121b] text-xs font-bold hover:bg-cyan-300">
              <FileBadge className="w-3.5 h-3.5" />Open Digital Property Record
            </Link>
          </TwinPanel>
        </div>
      </div>
    </div>
  );
}