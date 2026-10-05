"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  Eye,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";

import { getComponent3dProfile } from "@/lib/taxonomy/componentTaxonomy";

export interface ComponentInfoData {
  id: string;
  name: string;
  type: string;
  confidence: number;
  health: number;
  rulYears: number;
  condition: "Reusable" | "Refurbishable" | "Replace";
  passportStatus: "Ready" | "Verified" | "Pending";
}

export interface ProcessingPcb3DProps {
  imageUrl?: string;
  isScanning?: boolean;
  highlightComponentId?: string | null;
  exploded?: boolean;
  showComponents?: boolean;
  showTraces?: boolean;
  showBoxes?: boolean;
  showLayers?: boolean;
  showHealthOverlay?: boolean;
  showRulOverlay?: boolean;
  detectedComponents?: any[];
  onSelectComponent?: (compName: string, compData?: ComponentInfoData) => void;
}

export default function ProcessingPcb3D({
  imageUrl = "/images/samples/router_board.jpg",
  isScanning = false,
  highlightComponentId = null,
  exploded = false,
  showComponents = true,
  showTraces = true,
  showBoxes = true,
  showLayers = false,
  showHealthOverlay = false,
  showRulOverlay = false,
  detectedComponents = [],
  onSelectComponent,
}: ProcessingPcb3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const resetCameraRef = useRef<(() => void) | null>(null);
  const zoomInRef = useRef<(() => void) | null>(null);
  const zoomOutRef = useRef<(() => void) | null>(null);
  const panLeftRef = useRef<(() => void) | null>(null);
  const panRightRef = useRef<(() => void) | null>(null);

  const [inspectedComponent, setInspectedComponent] = useState<ComponentInfoData | null>(null);
  const [hoveredComponent, setHoveredComponent] = useState<ComponentInfoData | null>(null);

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

    // 1. PCB Base Board with FR4 Solder Mask
    const boardGeo = new THREE.BoxGeometry(6.8, 0.12, 5.0);
    const textureLoader = new THREE.TextureLoader();
    let pcbTexture: THREE.Texture | null = null;
    try {
      if (imageUrl) {
        pcbTexture = textureLoader.load(imageUrl);
        pcbTexture.wrapS = THREE.ClampToEdgeWrapping;
        pcbTexture.wrapT = THREE.ClampToEdgeWrapping;
      }
    } catch (e) {
      console.warn("Failed to load PCB texture:", e);
    }

    const boardMat = new THREE.MeshStandardMaterial({
      color: pcbTexture ? 0xffffff : 0x0f291e,
      map: pcbTexture || null,
      roughness: 0.32,
      metalness: 0.12,
    });
    const boardMesh = new THREE.Mesh(boardGeo, boardMat);
    boardMesh.receiveShadow = true;
    pcbGroup.add(boardMesh);

    // 1b. Mounting Screw Holes at 4 corners with Gold Annular Rings
    const cornerOffsets = [
      { x: -3.1, z: -2.2 },
      { x: 3.1, z: -2.2 },
      { x: -3.1, z: 2.2 },
      { x: 3.1, z: 2.2 },
    ];
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.95,
      roughness: 0.15,
    });
    cornerOffsets.forEach((pos) => {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.14, 16), ringMat);
      ring.position.set(pos.x, 0.01, pos.z);
      pcbGroup.add(ring);

      const hole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.16, 16),
        new THREE.MeshBasicMaterial({ color: 0x05070a })
      );
      hole.position.set(pos.x, 0.01, pos.z);
      pcbGroup.add(hole);
    });

    // 1c. Multi-Layer Substrate Slices (when showLayers is active)
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

    // 3. Components Assembly Group (Explodable & Raycast-Interactive)
    const componentsGroup = new THREE.Group();
    const componentMeshMap = new Map<string, THREE.MeshStandardMaterial>();
    const interactiveMeshes: THREE.Mesh[] = [];

    // Helper to register interactive components
    const registerComponent = (mesh: THREE.Mesh, mat: THREE.MeshStandardMaterial, data: ComponentInfoData) => {
      mesh.userData = data;
      componentMeshMap.set(data.id, mat);
      interactiveMeshes.push(mesh);
    };

    if (detectedComponents && detectedComponents.length > 0) {
      // Data-driven spatial reconstruction mapped from 2D bounding boxes
      const boardW = 6.8;
      const boardD = 5.0;

      detectedComponents.forEach((c: any, idx: number) => {
        const box = c.boundingBox || c.bbox || c.coordinates || { x: 20 + (idx % 5) * 15, y: 20 + Math.floor(idx / 5) * 15, width: 8, height: 8 };
        const normX = (box.x > 1 ? box.x / 100 : box.x) || 0.1;
        const normY = (box.y > 1 ? box.y / 100 : box.y) || 0.1;
        const normW = (box.width > 1 ? box.width / 100 : box.width) || 0.08;
        const normH = (box.height > 1 ? box.height / 100 : box.height) || 0.08;

        const threeX = ((normX + normW / 2) - 0.5) * boardW;
        const threeZ = ((normY + normH / 2) - 0.5) * boardD;
        const sizeX = Math.max(0.18, normW * boardW);
        const sizeZ = Math.max(0.18, normH * boardD);

        const profile = getComponent3dProfile(c.type || "IC");
        const compMat = new THREE.MeshStandardMaterial({
          color: profile.color,
          roughness: profile.roughness,
          metalness: profile.metalness,
          emissive: 0x2563eb,
          emissiveIntensity: 0.15,
        });

        let mesh: THREE.Mesh;
        if (c.type?.toLowerCase().includes("cap")) {
          const radius = Math.min(sizeX, sizeZ) * 0.45;
          mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, profile.height, 16), compMat);
        } else {
          mesh = new THREE.Mesh(new THREE.BoxGeometry(sizeX, profile.height, sizeZ), compMat);
        }

        mesh.position.set(threeX, 0.06 + profile.height / 2, threeZ);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        componentsGroup.add(mesh);

        const compId = c.componentId || c.id || `CMP-${idx + 1}`;
        registerComponent(mesh, compMat, {
          id: compId,
          name: c.name || `${c.type || "Component"} #${idx + 1}`,
          type: c.type || "Component",
          confidence: +(c.confidence > 1 ? c.confidence : (c.confidence || 0.95) * 100).toFixed(1),
          health: c.healthScore || c.health || 0,
          rulYears: c.estimatedRUL?.years || 0,
          condition: c.condition === "UNKNOWN" ? "Refurbishable" : (c.condition || "Refurbishable"),
          passportStatus: "Ready",
        });
      });
      pcbGroup.add(componentsGroup);
    } else {
      // Fallback default mock board layout
      // A. STM32 / CPU Core BGA Socket
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
      const cpuDie = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 1.1), cpuDieMat);
      cpuDie.position.set(-0.6, 0.22, -0.4);
      componentsGroup.add(cpuSubstrate);
      componentsGroup.add(cpuDie);

      registerComponent(cpuDie, cpuDieMat, {
        id: "comp_cpu_01",
        name: "STM32F103 / Core SoC",
        type: "ARM Cortex Microcontroller",
        confidence: 98.4,
        health: 94,
        rulYears: 6.4,
        condition: "Reusable",
        passportStatus: "Ready",
      });

      // B. RAM Chips Array (DDR3 / Flash TSOP)
      [-1.8, 1.8].forEach((rx, idx) => {
        const ramMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.6 });
        const ramStick = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.28, 2.2), ramMat);
        ramStick.position.set(rx, 0.2, 0);
        componentsGroup.add(ramStick);

        registerComponent(ramStick, ramMat, {
          id: `comp_ram_${idx + 1}`,
          name: `Winbond W631GU6MB RAM #${idx + 1}`,
          type: "DDR3 Synchronous DRAM",
          confidence: 96.8,
          health: 92,
          rulYears: 5.8,
          condition: "Reusable",
          passportStatus: "Ready",
        });
      });

      // C. Power Inductors & Ferrite Chokes
      [
        { x: -0.8, z: 1.1, id: "comp_ind_01", name: "Coilcraft 1.2uH Power Inductor" },
        { x: -0.1, z: 1.1, id: "comp_ind_02", name: "Murata SMD Ferrite Choke" },
        { x: 0.6, z: 1.1, id: "comp_ind_03", name: "Shielded SMPS Power Inductor" },
      ].forEach((pos) => {
        const chokeMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 });
        const choke = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.32, 0.48), chokeMat);
        choke.position.set(pos.x, 0.22, pos.z);
        componentsGroup.add(choke);

        registerComponent(choke, chokeMat, {
          id: pos.id,
          name: pos.name,
          type: "Power Inductor",
          confidence: 95.2,
          health: 96,
          rulYears: 8.1,
          condition: "Reusable",
          passportStatus: "Ready",
        });
      });

      // D. LAN Magnetics / Transformers
      const magMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
      const magMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.8), magMat);
      magMesh.position.set(2.0, 0.25, -1.4);
      componentsGroup.add(magMesh);

      registerComponent(magMesh, magMat, {
        id: "comp_mag_01",
        name: "Pulse Electronics RJ45 LAN Transformer",
        type: "Ethernet Magnetics Module",
        confidence: 97.1,
        health: 89,
        rulYears: 4.9,
        condition: "Refurbishable",
        passportStatus: "Ready",
      });

      // E. Solid Polymer SMD Capacitors
      const capMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
      for (let c = 0; c < 8; c++) {
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.32, 16), capMat);
        cap.position.set(-1.4 + (c % 4) * 0.34, 0.2, -1.6 + Math.floor(c / 4) * 0.42);
        componentsGroup.add(cap);

        if (c === 0) {
          registerComponent(cap, capMat, {
            id: "comp_cap_bank",
            name: "Nichicon 220uF Solid Polymer Capacitor",
            type: "Electrolytic Decoupling Capacitor",
            confidence: 93.6,
            health: 91,
            rulYears: 5.2,
            condition: "Reusable",
            passportStatus: "Ready",
          });
        }
      }

      // F. Flash Memory / Microcontroller
      const mcuMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.2, metalness: 0.7 });
      const mcu = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.12, 0.85), mcuMat);
      mcu.position.set(0.9, 0.12, -1.2);
      componentsGroup.add(mcu);

      registerComponent(mcu, mcuMat, {
        id: "comp_mcu_01",
        name: "Macronix MX25L 128MB SPI NOR Flash",
        type: "Flash Memory IC",
        confidence: 97.8,
        health: 95,
        rulYears: 7.4,
        condition: "Reusable",
        passportStatus: "Ready",
      });

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
    }

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

    // 6. Laser Scanning Line Beam (Passed horizontally during inspection)
    const scanBeamGeo = new THREE.BoxGeometry(0.04, 0.8, 5.2);
    const scanBeamMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.75,
    });
    const scanBeam = new THREE.Mesh(scanBeamGeo, scanBeamMat);
    scanBeam.position.set(-3.2, 0.4, 0);
    pcbGroup.add(scanBeam);

    scene.add(pcbGroup);

    // Interaction handlers (Mouse drag rotate, right-click pan, wheel zoom, click raycast)
    let isDragging = false;
    let isRightDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotationX = 0.35;
    let targetRotationY = -0.45;
    let targetPanX = 0;
    let targetPanY = 0;

    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 2 || e.button === 1) {
        // Right click or middle click for Pan
        isRightDragging = true;
      } else {
        isDragging = true;
      }
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isRightDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      if (isRightDragging) {
        targetPanX += deltaX * 0.008;
        targetPanY -= deltaY * 0.008;
      } else if (isDragging) {
        targetRotationY += deltaX * 0.008;
        targetRotationX += deltaY * 0.008;
        targetRotationX = Math.max(-0.2, Math.min(1.2, targetRotationX));
      } else {
        // Hover raycast detection
        const rect = renderer.domElement.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          mouseCoord.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouseCoord.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(mouseCoord, camera);
          const intersects = raycaster.intersectObjects(interactiveMeshes, true);
          if (intersects.length > 0) {
            const hitMesh = intersects[0].object as THREE.Mesh;
            const compData = hitMesh.userData as ComponentInfoData;
            if (compData && compData.name) {
              setHoveredComponent(compData);
            }
          } else {
            setHoveredComponent(null);
          }
        }
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      isRightDragging = false;
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onWheel = (e: WheelEvent) => {
      camera.position.z += e.deltaY * 0.005;
      camera.position.z = Math.max(3.8, Math.min(12.0, camera.position.z));
    };

    // Component Click Selection Raycaster
    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseCoord.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoord.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseCoord, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes, true);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const compData = hitMesh.userData as ComponentInfoData;
        if (compData && compData.name) {
          setInspectedComponent(compData);
          if (onSelectComponent) {
            onSelectComponent(compData.name, compData);
          }
        }
      }
    };

    // Camera control references
    resetCameraRef.current = () => {
      targetRotationX = 0.35;
      targetRotationY = -0.45;
      targetPanX = 0;
      targetPanY = 0;
      camera.position.copy(defaultPos);
      camera.lookAt(0, 0, 0);
    };

    zoomInRef.current = () => {
      camera.position.z = Math.max(3.8, camera.position.z - 1.0);
    };

    zoomOutRef.current = () => {
      camera.position.z = Math.min(12.0, camera.position.z + 1.0);
    };

    panLeftRef.current = () => {
      targetPanX -= 0.5;
    };

    panRightRef.current = () => {
      targetPanX += 0.5;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener("mousedown", onMouseDown);
    domEl.addEventListener("contextmenu", onContextMenu);
    domEl.addEventListener("click", onClick);
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

      pcbGroup.position.x += (targetPanX - pcbGroup.position.x) * 0.08;
      pcbGroup.position.y += (targetPanY - pcbGroup.position.y) * 0.08;

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
        if (
          activeHighlightId &&
          (id === activeHighlightId ||
            activeHighlightId.includes(id) ||
            id.includes(activeHighlightId))
        ) {
          mat.emissive.setHex(0x38bdf8);
          mat.emissiveIntensity = 0.95;
        } else if (isHealth) {
          mat.emissive.setHex(0x16a34a);
          mat.emissiveIntensity = 0.55;
        } else if (isRul) {
          mat.emissive.setHex(0x2563eb);
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
      domEl.removeEventListener("contextmenu", onContextMenu);
      domEl.removeEventListener("click", onClick);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      domEl.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [imageUrl, isScanning, detectedComponents]);

  return (
    <div className="relative w-full h-full min-h-[380px] select-none">
      {/* 3D Reconstruction Estimation Disclaimer */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-[10px] font-mono text-slate-300 shadow-md flex items-center gap-1.5 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
        <span>3D spatial reconstruction — estimated from 2D detection</span>
      </div>

      {/* Compact Hover Tooltip */}
      {hoveredComponent && !inspectedComponent && (
        <div className="absolute top-3 left-3 z-30 pointer-events-none px-3 py-1.5 rounded-xl bg-slate-950/90 text-white backdrop-blur-md border border-sky-500/40 text-[11px] font-mono shadow-xl flex items-center gap-2 animate-in fade-in duration-150">
          <span className="font-bold text-sky-400">{hoveredComponent.type}</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-300 font-mono text-[10px]">{hoveredComponent.id}</span>
          <span className="text-slate-500">·</span>
          <span className="text-emerald-400 font-bold">Conf {hoveredComponent.confidence}%</span>
        </div>
      )}

      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Navigation Controls (Rotate, Zoom, Pan, Reset) */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-[#E2E8F0] shadow-md text-xs font-mono">
        <button
          onClick={() => resetCameraRef.current?.()}
          className="p-1.5 rounded-xl hover:bg-[#EFF6FF] text-[#475569] hover:text-[#2563EB] transition-colors"
          title="Reset Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-[#E2E8F0]" />
        <button
          onClick={() => zoomInRef.current?.()}
          className="p-1.5 rounded-xl hover:bg-[#EFF6FF] text-[#475569] hover:text-[#2563EB] transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => zoomOutRef.current?.()}
          className="p-1.5 rounded-xl hover:bg-[#EFF6FF] text-[#475569] hover:text-[#2563EB] transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-[#E2E8F0]" />
        <div className="px-2 text-[10px] text-[#64748B] hidden sm:block">
          Left: Rotate · Right: Pan · Click: Inspect
        </div>
      </div>

      {/* Component Information Panel (Triggered on 3D Click) */}
      {inspectedComponent && (
        <div className="absolute top-3 right-3 z-30 w-72 bg-white/95 backdrop-blur-md rounded-2xl border border-[#E2E8F0] shadow-xl p-4 text-xs space-y-2.5 animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <span className="font-mono text-[10px] uppercase font-bold text-[#2563EB]">
              3D COMPONENT INSPECTOR
            </span>
            <button
              onClick={() => setInspectedComponent(null)}
              className="p-1 text-[#94A3B8] hover:text-[#0F172A] rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <h4 className="font-heading text-sm font-bold text-[#0F172A] truncate">
              {inspectedComponent.name}
            </h4>
            <p className="text-[11px] text-[#64748B]">{inspectedComponent.type}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
            <div className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[9px]">AI Confidence</span>
              <strong className="text-[#0F172A] text-xs">
                {inspectedComponent.confidence}%
              </strong>
            </div>

            <div className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[9px]">Hardware Health</span>
              <strong className="text-[#16A34A] text-xs">
                {inspectedComponent.health}%
              </strong>
            </div>

            <div className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[9px]">Estimated RUL</span>
              <strong className="text-[#2563EB] text-xs">
                {inspectedComponent.rulYears} Years
              </strong>
            </div>

            <div className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[9px]">Condition</span>
              <strong
                className={`text-xs ${
                  inspectedComponent.condition === "Reusable"
                    ? "text-[#16A34A]"
                    : "text-[#D97706]"
                }`}
              >
                {inspectedComponent.condition}
              </strong>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
            <span className="text-[10px] font-mono text-[#64748B] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
              Passport: <strong className="text-[#0F172A]">{inspectedComponent.passportStatus}</strong>
            </span>
            <button
              onClick={() => {
                if (onSelectComponent) {
                  onSelectComponent(inspectedComponent.name, inspectedComponent);
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#2563EB] font-bold text-[10px] hover:bg-[#2563EB] hover:text-white transition-colors"
            >
              Focus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
