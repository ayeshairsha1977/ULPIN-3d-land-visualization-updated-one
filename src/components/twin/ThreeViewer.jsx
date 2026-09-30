import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { buildBuilding, styleBuilding } from "@/components/twin/twinScene";
import { FLOOR_HEIGHT as H } from "@/data/properties";

const ThreeViewer = forwardRef(function ThreeViewer(
  { property, selectedFloor = null, selectedRoomId = null, onSelectRoom, onSelectFloor, autoRotate = false, showLabels = true, className = "" },
  ref
) {
  const mountRef = useRef(null);
  const s = useRef({});
  const cb = useRef(onSelectRoom);
  const cbFloor = useRef(onSelectFloor);
  cb.current = onSelectRoom;
  cbFloor.current = onSelectFloor;

  useEffect(() => {
    const el = mountRef.current;
    const w = el.clientWidth || 600;
    const h = el.clientHeight || 400;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x070f17, 70, 180);
    const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 500);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    el.appendChild(renderer.domElement);
    const labels = new CSS2DRenderer();
    labels.setSize(w, h);
    Object.assign(labels.domElement.style, { position: "absolute", top: "0", left: "0", pointerEvents: "none" });
    el.appendChild(labels.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 10;
    controls.maxDistance = 150;
    controls.maxPolarAngle = Math.PI * 0.92;

    const grid = new THREE.GridHelper(120, 60, 0x155e75, 0x0c2433);
    grid.material.transparent = true;
    grid.material.opacity = 0.55;
    scene.add(grid);

    const building = buildBuilding(property);
    scene.add(building.group);

    const top = (building.maxLevel + 1) * H;
    const bottom = building.minLevel * H;
    const size = Math.max(property.dims.w, property.dims.d, top - bottom);
    const target = new THREE.Vector3(0, (top + bottom) / 2 - 1, 0);
    const home = new THREE.Vector3(size * 1.15, target.y + size * 0.75, size * 1.35);
    camera.position.copy(home);
    controls.target.copy(target);
    controls.update();

    const ray = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    let down = null;
    const onDown = (e) => { down = [e.clientX, e.clientY]; };
    const onUp = (e) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
      const r = renderer.domElement.getBoundingClientRect();
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ptr, camera);
      const targets = [...building.items.map((i) => i.mesh), ...building.slabs];
      const hit = ray.intersectObjects(targets, false)[0];
      if (!hit) return;
      const { room, floorKey } = hit.object.userData;
      if (room) cb.current?.(room);
      else if (floorKey != null) cbFloor.current?.(floorKey);
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);

    const ro = new ResizeObserver(() => {
      const W = el.clientWidth, Hh = el.clientHeight;
      if (!W || !Hh) return;
      camera.aspect = W / Hh;
      camera.updateProjectionMatrix();
      renderer.setSize(W, Hh);
      labels.setSize(W, Hh);
    });
    ro.observe(el);

    let raf;
    const tick = () => {
      building.floors.forEach((f) => { f.group.position.y += (f.targetY - f.group.position.y) * 0.12; });
      controls.update();
      renderer.render(scene, camera);
      labels.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    s.current = { ...s.current, camera, controls, home, target, building };
    styleBuilding(building, s.current.selectedFloor, s.current.selectedRoomId, s.current.showLabels ?? true);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      controls.dispose();
      building.dispose();
      grid.geometry.dispose();
      grid.material.dispose();
      renderer.dispose();
      el.innerHTML = "";
    };
  }, [property.id]);

  useEffect(() => {
    Object.assign(s.current, { selectedFloor, selectedRoomId, showLabels });
    if (s.current.building) styleBuilding(s.current.building, selectedFloor, selectedRoomId, showLabels);
  }, [selectedFloor, selectedRoomId, showLabels, property.id]);

  useEffect(() => {
    if (!s.current.controls) return;
    s.current.controls.autoRotate = autoRotate;
    s.current.controls.autoRotateSpeed = 1.2;
  }, [autoRotate, property.id]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      const { camera, controls, home, target } = s.current;
      camera.position.copy(home);
      controls.target.copy(target);
    },
    zoom: (factor) => {
      const { camera, controls } = s.current;
      const off = camera.position.clone().sub(controls.target).multiplyScalar(factor);
      camera.position.copy(controls.target).add(off);
    },
  }));

  return <div ref={mountRef} className={`relative w-full h-full overflow-hidden ${className}`} />;
});

export default ThreeViewer;