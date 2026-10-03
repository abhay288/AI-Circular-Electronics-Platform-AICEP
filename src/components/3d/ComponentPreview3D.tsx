"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RotateCcw, ZoomIn, ZoomOut, Play, Pause } from "lucide-react";

interface ComponentPreview3DProps {
  componentName?: string;
  manufacturer?: string;
  packageType?: string;
  isEligible?: boolean;
}

export default function ComponentPreview3D({
  componentName = "STM32F103C8T6",
  manufacturer = "STMicroelectronics",
  packageType = "LQFP-48",
  isEligible = true,
}: ComponentPreview3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const controlsRef = useRef<{
    reset: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous children if any
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 260;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    const defaultCamPos = new THREE.Vector3(2.8, 2.4, 3.4);
    camera.position.copy(defaultCamPos);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.6);
    fillLight.position.set(-5, -2, -3);
    scene.add(fillLight);

    // Chip Group
    const chipGroup = new THREE.Group();
    scene.add(chipGroup);

    // Base PCB Mount carrier
    const pcbMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a5f,
      roughness: 0.4,
      metalness: 0.1,
    });
    const pcbBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 2.4), pcbMat);
    pcbBase.position.y = -0.1;
    chipGroup.add(pcbBase);

    // IC Package Body (Black epoxy molding)
    const chipBodyMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.35,
      metalness: 0.2,
    });
    const chipBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.22, 1.6), chipBodyMat);
    chipBody.position.y = 0.05;
    chipGroup.add(chipBody);

    // Heat spreader / laser marking top plate
    const topPlateMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.2,
      metalness: 0.5,
    });
    const topPlate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 1.2), topPlateMat);
    topPlate.position.y = 0.165;
    chipGroup.add(topPlate);

    // Pin 1 Index Dot
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16), dotMat);
    dot.position.set(-0.6, 0.17, -0.6);
    chipGroup.add(dot);

    // Gold/Silver Pins along 4 edges
    const pinMat = new THREE.MeshStandardMaterial({
      color: isEligible ? 0xd4af37 : 0xa1a1aa, // Gold for verified reusable, silver/gray for aged
      roughness: 0.15,
      metalness: 0.9,
    });

    const pinsPerSide = 8;
    const pinSpacing = 1.4 / pinsPerSide;

    // North & South pins
    for (let i = 0; i < pinsPerSide; i++) {
      const offset = -0.7 + (i + 0.5) * pinSpacing;
      
      // North
      const pinN = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.32), pinMat);
      pinN.position.set(offset, 0.02, -0.92);
      chipGroup.add(pinN);

      // South
      const pinS = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.32), pinMat);
      pinS.position.set(offset, 0.02, 0.92);
      chipGroup.add(pinS);
    }

    // East & West pins
    for (let i = 0; i < pinsPerSide; i++) {
      const offset = -0.7 + (i + 0.5) * pinSpacing;

      // West
      const pinW = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.06), pinMat);
      pinW.position.set(-0.92, 0.02, offset);
      chipGroup.add(pinW);

      // East
      const pinE = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.06), pinMat);
      pinE.position.set(0.92, 0.02, offset);
      chipGroup.add(pinE);
    }

    // Interactive Drag to Rotate
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      chipGroup.rotation.y += deltaX * 0.01;
      chipGroup.rotation.x += deltaY * 0.01;

      // Clamp X rotation
      chipGroup.rotation.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, chipGroup.rotation.x));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Controls exposure
    controlsRef.current = {
      reset: () => {
        camera.position.copy(defaultCamPos);
        camera.lookAt(0, 0, 0);
        chipGroup.rotation.set(0, 0, 0);
      },
      zoomIn: () => {
        camera.position.multiplyScalar(0.85);
      },
      zoomOut: () => {
        camera.position.multiplyScalar(1.15);
      },
    };

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (autoRotate && !isDragging) {
        chipGroup.rotation.y += 0.008;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 360;
      const newH = container.clientHeight || 260;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      domElement.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      cancelAnimationFrame(animId);
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
      renderer.dispose();
    };
  }, [componentName, packageType, isEligible, autoRotate]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC]">
      {/* 3D Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-full h-64 sm:h-72 cursor-grab active:cursor-grabbing"
      />

      {/* Representative 3D Model Label */}
      <div className="absolute top-3 left-3 flex flex-col gap-0.5 pointer-events-none">
        <span className="px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-md border border-[#E2E8F0] text-[10px] font-mono font-bold text-[#2563EB] shadow-xs">
          Representative 3D Model
        </span>
        <span className="text-[10px] font-mono text-[#64748B] bg-white/80 px-1.5 py-0.5 rounded backdrop-blur-xs w-fit">
          CAD Geometry: {packageType}
        </span>
      </div>

      {/* Floating Interactive Controls */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-[#E2E8F0] shadow-sm">
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-1.5 rounded-lg text-xs font-mono transition-colors ${
            autoRotate
              ? "bg-[#EFF6FF] text-[#2563EB] font-bold"
              : "text-[#64748B] hover:bg-[#F1F5F9]"
          }`}
          title={autoRotate ? "Pause Rotation" : "Auto Rotate"}
        >
          {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          onClick={() => controlsRef.current?.zoomIn()}
          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => controlsRef.current?.zoomOut()}
          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => controlsRef.current?.reset()}
          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
          title="Reset Viewport"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Provenance Notice */}
      <div className="px-3 py-1.5 bg-[#F1F5F9]/80 border-t border-[#E2E8F0] flex items-center justify-between text-[10px] font-mono text-[#64748B]">
        <span>Drag to rotate · Scroll to zoom</span>
        <span>Simulated 3D Mesh</span>
      </div>
    </div>
  );
}
