import React, { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Polygon, Marker, Tooltip, useMap, useMapEvents } from "react-leaflet";
import { allBounds } from "@/lib/geo";
import { PROPERTIES } from "@/data/properties";

const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services";
const ESRI_ATTR = "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community";

const markerIcon = (p, selected) =>
  L.divIcon({
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="width:30px;height:30px;border-radius:9999px;background:${p.color};color:#fff;font:700 11px Manrope,sans-serif;display:flex;align-items:center;justify-content:center;border:${selected ? 3 : 2}px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)">${p.code}</div>`,
  });

function Controller({ selected }) {
  const map = useMap();
  useEffect(() => {
    if (selected) map.flyToBounds(selected.polygon, { maxZoom: 19, padding: [90, 90], duration: 0.8 });
  }, [selected?.id]);
  return null;
}

function ClickCatcher({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick?.(e.latlng) });
  return null;
}

export default function MapView({ properties = PROPERTIES, selectedId, onSelect, basemap = "satellite", onReady, onMapClick, picked, className = "h-full w-full" }) {
  const selected = properties.find((p) => p.id === selectedId);
  return (
    <MapContainer ref={onReady} bounds={allBounds(PROPERTIES)} boundsOptions={{ padding: [60, 60] }} zoomControl={false} maxZoom={19} className={className}>
      {basemap === "satellite" ? (
        <>
          <TileLayer url={`${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`} attribution={ESRI_ATTR} maxZoom={19} />
          <TileLayer url={`${ESRI}/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}`} maxZoom={19} opacity={0.9} />
          <TileLayer url={`${ESRI}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`} maxZoom={19} />
        </>
      ) : (
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" maxZoom={19} />
      )}
      {properties.map((p) => {
        const isSel = p.id === selectedId;
        return (
          <React.Fragment key={p.id}>
            <Polygon
              positions={p.polygon}
              pathOptions={{ color: p.color, weight: isSel ? 4 : 2, fillColor: p.color, fillOpacity: isSel ? 0.45 : 0.25, dashArray: isSel ? null : "6 4" }}
              eventHandlers={{ click: () => onSelect?.(p.id) }}
            >
              <Tooltip sticky direction="top">
                <span className="font-semibold">{p.code} · {p.shortName}</span><br />
                <span className="text-[10px] text-slate-500">Demo Property Boundary</span>
              </Tooltip>
            </Polygon>
            <Marker position={[p.lat, p.lng]} icon={markerIcon(p, isSel)} eventHandlers={{ click: () => onSelect?.(p.id) }} title={p.shortName} />
          </React.Fragment>
        );
      })}
      {picked && <Marker position={picked} icon={L.divIcon({ className: "", iconSize: [18, 18], iconAnchor: [9, 9], html: '<div style="width:18px;height:18px;border-radius:9999px;background:#06B6D4;border:3px solid #fff;box-shadow:0 0 0 2px #0F2D3D"></div>' })} />}
      <Controller selected={selected} />
      {onMapClick && <ClickCatcher onMapClick={onMapClick} />}
    </MapContainer>
  );
}