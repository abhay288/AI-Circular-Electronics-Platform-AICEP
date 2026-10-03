"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { RotateCcw, ZoomIn, ZoomOut, Move, Eye } from "lucide-react";

export interface ProcessingPcb3DProps {
  isScanning?: boolean;
  highlightComponentId?: string | null;
  exploded?: boolean;
  showComponents?: boolean;
  showTraces?: boolean;
  showBoxes?: boolean;
  showLayers?: boolean;
  showHealthOverlay?: boolean;
  showRulOverlay?: boolean;
  onSelectComponent?: (compName: string) => void;
}

export default function ProcessingPcb3D({
  isScanning = false,
  highlightComponentId = null,
  exploded = false,
  showComponents = true,
  showTraces = true,
  showBoxes = true,
  showLayers = false,
  showHealthOverlay = false,
  showRulOverlay = false,
  onSelectComponent,
}: ProcessingPcb3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const resetCameraRef = useRef<(() => void) | null>(null);
  const zoomInRef = useRef<(() => void) | null>(null);
  const zoomOutRef = useRef<(() => void) | null>(null);

  // Dynamic prop refs for 60fps render loop
  const propsRef = useRef({
    exploded,
    showComponents,
    showBoxes,
    showTraces,
    showLayers,
    showHealthOverlay,
    showRulOverlay,
    highlightComponentId,
  });

  useEffect(() => {
    propsRef.current = {
      exploded: exploded || showLayers,
      showComponents,
      showBoxes,
      showTraces,
      showLayers,
      showHealthOverlay,
      showRulOverlay,
      highlightComponentId,
    };
  }, [
    exploded,
    showComponents,
    showBoxes,
    showTraces,
    showLayers,
    showHealthOverlay,
    showRulOverlay,
    highlightComponentId,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 600;
    let height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    const defaultPos = new THREE.Vector3(0, 5.2, 7.5);
    camera.position.copy(defaultPos);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Light Setup (Clean light theme industrial studio)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(6, 10, 6);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const blueFill = new THREE.DirectionalLight(0x2563eb, 1.2);
    blueFill.position.set(-6, 3, -4);
    scene.add(blueFill);

    const rimLight = new THREE.PointLight(0x60a5fa, 1.5, 15);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    const pcbGroup = new THREE.Group();

    // 1. PCB Base Board
    const boardGeo = new THREE.BoxGeometry(6.8, 0.12, 5.0);
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0x0f291e, // Deep emerald solder mask
      roughness: 0.28,
      metalness: 0.15,
    });
    const boardMesh = new THREE.Mesh(boardGeo, boardMat);
    boardMesh.receiveShadow = true;
    pcbGroup.add(boardMesh);

    // 1b. Multi-Layer Substrate Slices (when showLayers is active)
    const layersGroup = new THREE.Group();
    const layerColors = [0x164e63, 0xd97706, 0x1e293b, 0xd97706];
    layerColors.forEach((col, idx) => {
      const slice = new THREE.Mesh(
        new THREE.BoxGeometry(6.75, 0.04, 4.95),
        new THREE.MeshStandardMaterial({
          color: col,
          metalness: 0.7,
          roughness: 0.3,
          transparent: true,
          opacity: 0.85,
        })
      );
      slice.position.y = -0.2 * (idx + 1);
      layersGroup.add(slice);
    });
    pcbGroup.add(layersGroup);

    // 2. Gold Edge Connector Fingers
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.98,
      roughness: 0.12,
    });
    for (let f = -2.8; f <= 2.8; f += 0.18) {
      const finger = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.4), goldMat);
      finger.position.set(f, 0.07, 2.3);
      pcbGroup.add(finger);
    }

    // 3. Components Assembly Group (Explodable)
    const componentsGroup = new THREE.Group();

    // Component tracking list for interactive highlighting
    const componentMeshMap = new Map<string, THREE.MeshStandardMaterial>();

    // A. CPU / SoC Core BGA Socket
    const cpuSubstrate = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.12, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.8 })
    );
    cpuSubstrate.position.set(-0.6, 0.12, -0.4);

    const cpuDieMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.05,
      metalness: 0.95,
      emissive: 0x2563eb,
      emissiveIntensity: 0.25,
    });
    const cpuDie = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 1.0), cpuDieMat);
    cpuDie.position.set(-0.6, 0.21, -0.4);
    componentsGroup.add(cpuSubstrate);
    componentsGroup.add(cpuDie);
    componentMeshMap.set("comp_npu_01", cpuDieMat);
    componentMeshMap.set("comp_cpu_01", cpuDieMat);

    // B. RAM Chips Array
    [-1.8, 1.8].forEach((rx, idx) => {
      const ramMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.6 });
      const ramStick = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 2.4), ramMat);
      ramStick.position.set(rx, 0.22, 0);
      componentsGroup.add(ramStick);
      componentMeshMap.set(`comp_ram_${idx + 1}`, ramMat);
    });

    // C. Power Inductors & Ferrite Chokes
    [
      { x: -0.8, z: 1.1, id: "comp_ind_01" },
      { x: -0.1, z: 1.1, id: "comp_ind_02" },
      { x: 0.6, z: 1.1, id: "comp_ind_03" },
    ].forEach((pos) => {
      const chokeMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 });
      const choke = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.32, 0.48), chokeMat);
      choke.position.set(pos.x, 0.22, pos.z);
      componentsGroup.add(choke);
      componentMeshMap.set(pos.id, chokeMat);
    });

    // D. LAN Magnetics / Transformers
    const magMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
    const magMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.8), magMat);
    magMesh.position.set(2.0, 0.25, -1.4);
    componentsGroup.add(magMesh);
    componentMeshMap.set("comp_mag_01", magMat);

    // E. Solid Polymer SMD Capacitors
    const capMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
    for (let c = 0; c < 8; c++) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 16), capMat);
      cap.position.set(-1.4 + (c % 4) * 0.32, 0.2, -1.6 + Math.floor(c / 4) * 0.4);
      componentsGroup.add(cap);
    }

    // F. Microcontroller / Flash Chips
    const mcuMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.2, metalness: 0.7 });
    const mcu = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), mcuMat);
    mcu.position.set(0.9, 0.11, -1.2);
    componentsGroup.add(mcu);
    componentMeshMap.set("comp_mcu_01", mcuMat);

    // G. Heatsink Aluminum Fin Assembly
    const heatsinkGroup = new THREE.Group();
    for (let h = 0; h < 6; h++) {
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.45, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 })
      );
      fin.position.set(0.6 + h * 0.12, 0.3, 0.2);
      heatsinkGroup.add(fin);
    }
    componentsGroup.add(heatsinkGroup);
    pcbGroup.add(componentsGroup);

    // 4. Circuit Traces Layer
    const tracesGroup = new THREE.Group();
    const traceMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
    });
    for (let t = 0; t < 24; t++) {
      const startX = (Math.random() - 0.5) * 5.6;
      const startZ = (Math.random() - 0.5) * 4.0;
      const lengthX = (Math.random() - 0.5) * 1.8;
      const lengthZ = (Math.random() - 0.5) * 1.2;

      const path = new THREE.LineCurve3(
        new THREE.Vector3(startX, 0.07, startZ),
        new THREE.Vector3(startX + lengthX, 0.07, startZ + lengthZ)
      );
      const tube = new THREE.Mesh(new THREE.TubeGeometry(path, 8, 0.012, 6, false), traceMat);
      tracesGroup.add(tube);
    }
    pcbGroup.add(tracesGroup);

    // 5. 3D Bounding Box Wireframes for AI Detection
    const boxGroup = new THREE.Group();
    const boxMat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });
    const detectedBoxes = [
      { x: -0.6, y: 0.2, z: -0.4, w: 1.8, h: 0.5, d: 1.8, name: "comp_npu_01" },
      { x: -1.8, y: 0.25, z: 0, w: 0.5, h: 0.5, d: 2.6, name: "comp_ram_1" },
      { x: 1.8, y: 0.25, z: 0, w: 0.5, h: 0.5, d: 2.6, name: "comp_ram_2" },
      { x: 0.9, y: 0.16, z: -1.2, w: 1.0, h: 0.3, d: 1.0, name: "comp_mcu_01" },
      { x: 2.0, y: 0.25, z: -1.4, w: 1.4, h: 0.5, d: 1.0, name: "comp_mag_01" },
      { x: -0.1, y: 0.22, z: 1.1, w: 1.6, h: 0.45, d: 0.7, name: "comp_ind_01" },
    ];

    detectedBoxes.forEach((b) => {
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), boxMat);
      bMesh.position.set(b.x, b.y, b.z);
      boxGroup.add(bMesh);
    });
    pcbGroup.add(boxGroup);

    // 6. Laser Scanning Line Beam (Passed horizontally)
    const scanBeamGeo = new THREE.BoxGeometry(0.04, 0.8, 5.2);
    const scanBeamMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const scanBeam = new THREE.Mesh(scanBeamGeo, scanBeamMat);
    scanBeam.position.set(-3.2, 0.4, 0);
    pcbGroup.add(scanBeam);

    scene.add(pcbGroup);

    // Interaction handlers (Mouse drag rotate & wheel zoom)
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotationX = 0.35;
    let targetRotationY = -0.45;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      targetRotationY += deltaX * 0.008;
      targetRotationX += deltaY * 0.008;
      targetRotationX = Math.max(-0.2, Math.min(1.2, targetRotationX));
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      camera.position.z += e.deltaY * 0.005;
      camera.position.z = Math.max(4.0, Math.min(12.0, camera.position.z));
    };

    // Camera control references
    resetCameraRef.current = () => {
      targetRotationX = 0.35;
      targetRotationY = -0.45;
      camera.position.copy(defaultPos);
      camera.lookAt(0, 0, 0);
    };

    zoomInRef.current = () => {
      camera.position.z = Math.max(4.0, camera.position.z - 1.0);
    };

    zoomOutRef.current = () => {
      camera.position.z = Math.min(12.0, camera.position.z + 1.0);
    };

    const domEl = renderer.domElement;
    domEl.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    domEl.addEventListener("wheel", onWheel, { passive: true });

    // Animation Loop
    let animId: number;
    let scanDirection = 1;
    let scanPos = -3.2;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth rotate towards target
      if (!isDragging && isScanning) {
        targetRotationY += 0.003;
      }
      pcbGroup.rotation.x += (targetRotationX - pcbGroup.rotation.x) * 0.08;
      pcbGroup.rotation.y += (targetRotationY - pcbGroup.rotation.y) * 0.08;

      // Laser scan motion
      if (isScanning) {
        scanPos += 0.045 * scanDirection;
        if (scanPos > 3.2) {
          scanDirection = -1;
        } else if (scanPos < -3.2) {
          scanDirection = 1;
        }
        scanBeam.position.x = scanPos;
        scanBeam.visible = true;
      } else {
        scanBeam.visible = false;
      }

      // Explode / Layers transition
      const targetExplodeY = propsRef.current.exploded ? 0.85 : 0;
      componentsGroup.position.y += (targetExplodeY - componentsGroup.position.y) * 0.1;

      const targetLayerSpread = propsRef.current.showLayers ? 0.5 : 0.05;
      layersGroup.children.forEach((child, i) => {
        const destY = -targetLayerSpread * (i + 1);
        child.position.y += (destY - child.position.y) * 0.1;
      });

      // Visibility toggles
      componentsGroup.visible = propsRef.current.showComponents;
      boxGroup.visible = propsRef.current.showBoxes;
      tracesGroup.visible = propsRef.current.showTraces;
      layersGroup.visible = propsRef.current.showLayers;

      // Component highlight & overlay styling
      const activeHighlightId = propsRef.current.highlightComponentId;
      const isHealth = propsRef.current.showHealthOverlay;
      const isRul = propsRef.current.showRulOverlay;

      componentMeshMap.forEach((mat, id) => {
        if (activeHighlightId && (id === activeHighlightId || activeHighlightId.includes(id) || id.includes(activeHighlightId))) {
          mat.emissive.setHex(0x38bdf8);
          mat.emissiveIntensity = 0.9;
        } else if (isHealth) {
          mat.emissive.setHex(0x16a34a); // Green health overlay
          mat.emissiveIntensity = 0.55;
        } else if (isRul) {
          mat.emissive.setHex(0x2563eb); // Cyan/blue RUL overlay
          mat.emissiveIntensity = 0.55;
        } else {
          mat.emissive.setHex(0x2563eb);
          mat.emissiveIntensity = 0.2;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 600;
      height = container.clientHeight || 450;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      domEl.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      domEl.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isScanning]);

  return (
    <div className="relative w-full h-full min-h-[380px] overflow-hidden select-none cursor-grab active:cursor-grabbing">
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating 3D Control Pad */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 p-1 rounded-xl bg-white/90 backdrop-blur-md border border-[#E2E8F0] shadow-sm z-20">
        <button
          onClick={() => zoomInRef.current?.()}
          className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => zoomOutRef.current?.()}
          className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-[#E2E8F0]" />
        <button
          onClick={() => resetCameraRef.current?.()}
          className="p-1.5 rounded-lg hover:bg-[#EFF6FF] text-[#2563EB] transition-colors flex items-center gap-1 text-[11px] font-mono font-bold cursor-pointer"
          title="Reset 3D Perspective"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </div>
  );
}
