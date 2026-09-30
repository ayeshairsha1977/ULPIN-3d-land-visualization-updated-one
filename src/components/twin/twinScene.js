import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { FLOOR_HEIGHT as H } from "@/data/properties";

const SHORT = {
  "Male Washroom": "WR · M", "Female Washroom": "WR · F", "Left Staircase": "Stair L", "Right Staircase": "Stair R",
  "Common Washrooms": "WR", "Staircase Headroom": "Stair", "Entrance & Lobby": "Lobby",
};

const makeLabel = (text, cls) => {
  const d = document.createElement("div");
  d.className = cls;
  d.textContent = text;
  return new CSS2DObject(d);
};

const roomLabel = (r) => SHORT[r.name] || (r.type === "Hostel Room" || r.type === "Terrace Room" ? r.number : r.name);

export function buildBuilding(property) {
  const group = new THREE.Group();
  const items = [];
  const floors = [];
  const slabs = [];
  const trash = [];
  const { w: W, d: D } = property.dims;

  property.floors.forEach((f) => {
    const g = new THREE.Group();
    g.position.y = f.level * H;
    group.add(g);

    const slabGeo = new THREE.BoxGeometry(W, 0.12, D);
    const slabEdgeGeo = new THREE.EdgesGeometry(slabGeo);
    const slabMat = new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.5 });
    const slabFillMat = new THREE.MeshBasicMaterial({ color: 0x0e7490, transparent: true, opacity: 0.06, depthWrite: false });
    const slabMesh = new THREE.Mesh(slabGeo, slabFillMat);
    slabMesh.userData.floorKey = f.key;
    g.add(new THREE.LineSegments(slabEdgeGeo, slabMat), slabMesh);
    slabs.push(slabMesh);
    trash.push(slabGeo, slabEdgeGeo, slabMat, slabFillMat);

    const fl = makeLabel(f.key === "G" ? "GF" : f.key, "twin-floor-label");
    fl.position.set(W / 2 + 2.2, 1.4, D / 2);
    g.add(fl);

    f.rooms.forEach((room) => {
      const h = room.flat ? 0.08 : H * 0.8;
      const geo = new THREE.BoxGeometry(Math.max(room.w - 0.2, 0.2), h, Math.max(room.d - 0.2, 0.2));
      const fillMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.05, depthWrite: false });
      const mesh = new THREE.Mesh(geo, fillMat);
      mesh.position.set(room.x + room.w / 2, h / 2 + 0.08, room.z + room.d / 2);
      mesh.userData.room = room;
      const edgeGeo = new THREE.EdgesGeometry(geo);
      const edgeMat = new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.55 });
      mesh.add(new THREE.LineSegments(edgeGeo, edgeMat));
      const label = makeLabel(roomLabel(room), "twin-label");
      label.position.set(0, h / 2 + 0.3, 0);
      label.visible = false;
      mesh.add(label);
      g.add(mesh);
      items.push({ mesh, fillMat, edgeMat, label, room, floorKey: f.key, level: f.level });
      trash.push(geo, fillMat, edgeGeo, edgeMat);
    });

    floors.push({ key: f.key, level: f.level, group: g, baseY: f.level * H, targetY: f.level * H, slabMat, slabFillMat, label: fl });
  });

  const levels = property.floors.map((f) => f.level);
  const dispose = () => {
    group.traverse((o) => o.isCSS2DObject && o.element.remove());
    trash.forEach((t) => t.dispose());
  };
  return { group, items, floors, slabs, dispose, minLevel: Math.min(...levels), maxLevel: Math.max(...levels) };
}

export function styleBuilding(b, selectedFloor, selectedRoomId, showLabels = true) {
  const selLevel = b.floors.find((f) => f.key === selectedFloor)?.level;
  const isAbove = (lvl) => selLevel !== undefined && lvl > selLevel;

  b.floors.forEach((f) => {
    const sel = f.key === selectedFloor;
    f.targetY = f.baseY + (isAbove(f.level) ? H * 1.6 : 0);
    f.slabMat.color.set(sel ? 0x67e8f9 : selectedFloor ? 0x334155 : 0x22d3ee);
    f.slabMat.opacity = sel ? 1 : selectedFloor ? (isAbove(f.level) ? 0.12 : 0.3) : 0.5;
    f.slabFillMat.opacity = sel ? 0.18 : 0.05;
    f.label.element.dataset.active = String(sel);
  });

  b.items.forEach((it) => {
    const onSel = it.floorKey === selectedFloor;
    const picked = it.room.id === selectedRoomId;
    if (!selectedFloor) {
      it.edgeMat.color.set(it.room.core ? 0x38bdf8 : 0x22d3ee);
      it.edgeMat.opacity = 0.55;
      it.fillMat.color.set(0x06b6d4);
      it.fillMat.opacity = 0.05;
    } else if (onSel) {
      it.edgeMat.color.set(picked ? 0xffffff : it.room.core ? 0x7dd3fc : 0x22d3ee);
      it.edgeMat.opacity = 1;
      it.fillMat.color.set(picked ? 0x22d3ee : it.room.core ? 0x1d4ed8 : 0x0891b2);
      it.fillMat.opacity = picked ? 0.6 : 0.16;
    } else {
      it.edgeMat.color.set(0x475569);
      it.edgeMat.opacity = isAbove(it.level) ? 0.1 : 0.25;
      it.fillMat.opacity = 0.015;
    }
    it.label.visible = showLabels && onSel && it.room.type !== "Corridor";
    it.label.element.dataset.active = String(picked);
  });
}