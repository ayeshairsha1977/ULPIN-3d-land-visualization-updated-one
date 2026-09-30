import React from "react";
import { RotateCw, ZoomIn, ZoomOut, RotateCcw, Tag } from "lucide-react";

export default function ViewerControls({ viewer, autoRotate, setAutoRotate, labels, setLabels }) {
  const btn = (on) => `h-9 px-3 flex items-center gap-1.5 text-xs font-medium rounded-md transition ${on ? "bg-cyan-400/20 text-cyan-100" : "text-slate-300 hover:bg-white/10 hover:text-white"}`;
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-[#07131d]/90 border border-cyan-400/20 backdrop-blur">
      <button className={btn(autoRotate)} onClick={() => setAutoRotate(!autoRotate)} aria-pressed={autoRotate}><RotateCw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Rotate</span></button>
      <button className={btn(false)} onClick={() => viewer.current?.zoom(0.8)} aria-label="Zoom in"><ZoomIn className="w-3.5 h-3.5" /></button>
      <button className={btn(false)} onClick={() => viewer.current?.zoom(1.25)} aria-label="Zoom out"><ZoomOut className="w-3.5 h-3.5" /></button>
      <button className={btn(labels)} onClick={() => setLabels(!labels)} aria-pressed={labels}><Tag className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Labels</span></button>
      <button className={btn(false)} onClick={() => viewer.current?.reset()}><RotateCcw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Reset</span></button>
    </div>
  );
}