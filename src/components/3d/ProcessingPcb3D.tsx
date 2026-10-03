"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface ProcessingPcb3DProps {
  isScanning?: boolean;
  highlightComponentId?: string | null;
  exploded?: boolean;
  showTraces?: boolean;
  showBoxes?: boolean;
  onSelectComponent?: (compName: string) => void;
}

export default function ProcessingPcb3D({
  isScanning = true,
  highlightComponentId = null,
  exploded = false,
  showTraces = true,
  showBoxes = true,
  onSelectComponent,
}: ProcessingPcb3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const explodedRef = useRef(exploded);
  const showBoxesRef = useRef(showBoxes);
  const showTracesRef = useRef(showTraces);

  useEffect(() => {
    explodedRef.current = exploded;
    showBoxesRef.current = showBoxes;
    showTracesRef.current = showTraces;
  }, [exploded, showBoxes, showTraces]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 600;
    let height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 5.2, 7.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Light Setup (Clean light theme industrial studio)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(6, 10, 6);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const blueFill = new THREE.DirectionalLight(0x2563eb, 1.4);
    blueFill.position.set(-6, 3, -4);
    scene.add(blueFill);

    const rimLight = new THREE.PointLight(0x60a5fa, 1.8, 15);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    const pcbGroup = new THREE.Group();

    // 1. PCB Base Board (High-spec dark emerald / matte blue substrate)
    const boardGeo = new THREE.BoxGeometry(6.8, 0.12, 5.0);
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0x0f291e, // Deep emerald solder mask
      roughness: 0.28,
      metalness: 0.15,
    });
    const boardMesh = new THREE.Mesh(boardGeo, boardMat);
    boardMesh.receiveShadow = true;
    pcbGroup.add(boardMesh);

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

    // A. CPU / SoC Core BGA Socket
    const cpuSubstrate = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.12, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.8 })
    );
    cpuSubstrate.position.set(-0.6, 0.12, -0.4);

    const cpuDie = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.06, 1.0),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.05,
        metalness: 0.95,
        emissive: 0x2563eb,
        emissiveIntensity: 0.2,
      })
    );
    cpuDie.position.set(-0.6, 0.21, -0.4);
    componentsGroup.add(cpuSubstrate);
    componentsGroup.add(cpuDie);

    // B. RAM Chips Array
    const ramChips: THREE.Mesh[] = [];
    [-1.8, 1.8].forEach((rx) => {
      const ramStick = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.35, 2.4),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.6 })
      );
      ramStick.position.set(rx, 0.22, 0);
      componentsGroup.add(ramStick);
      ramChips.push(ramStick);
    });

    // C. Power Inductors & Ferrite Chokes
    const chokeMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 });
    [
      { x: -0.8, z: 1.1 },
      { x: -0.1, z: 1.1 },
      { x: 0.6, z: 1.1 },
    ].forEach((pos) => {
      const choke = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.32, 0.48), chokeMat);
      choke.position.set(pos.x, 0.22, pos.z);
      componentsGroup.add(choke);
    });

    // D. Solid Polymer SMD Capacitors (Silver Cans)
    const capMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
    const capList: THREE.Mesh[] = [];
    for (let c = 0; c < 8; c++) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 16), capMat);
      cap.position.set(-1.4 + (c % 4) * 0.32, 0.2, -1.6 + Math.floor(c / 4) * 0.4);
      componentsGroup.add(cap);
      capList.push(cap);
    }

    // E. Microcontroller & Flash Chips
    const mcu = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.1, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.2, metalness: 0.7 })
    );
    mcu.position.set(0.9, 0.11, -1.2);
    componentsGroup.add(mcu);

    // F. Heatsink Aluminum Fin Assembly
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
      opacity: 0.6,
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
      { x: -0.6, y: 0.2, z: -0.4, w: 1.8, h: 0.5, d: 1.8, name: "CPU / SoC" },
      { x: -1.8, y: 0.25, z: 0, w: 0.5, h: 0.5, d: 2.6, name: "RAM 1" },
      { x: 1.8, y: 0.25, z: 0, w: 0.5, h: 0.5, d: 2.6, name: "RAM 2" },
      { x: 0.9, y: 0.16, z: -1.2, w: 1.0, h: 0.3, d: 1.0, name: "Flash / MCU" },
      { x: -0.1, y: 0.22, z: 1.1, w: 1.6, h: 0.45, d: 0.7, name: "VRM Inductors" },
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

      // Explode layer transition
      const targetExplodeY = explodedRef.current ? 0.8 : 0;
      componentsGroup.position.y += (targetExplodeY - componentsGroup.position.y) * 0.1;

      // Visibility toggles
      boxGroup.visible = showBoxesRef.current;
      tracesGroup.visible = showTracesRef.current;

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
    </div>
  );
}
