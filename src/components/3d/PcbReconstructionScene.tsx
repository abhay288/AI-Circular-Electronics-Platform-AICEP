"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function PcbReconstructionScene({ isReconstructed }: { isReconstructed: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const chipsMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 3, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(isReconstructed ? 0x00ff99 : 0xff3366, 2, 20);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const group = new THREE.Group();

    // PCB Plate
    const pcbMat = new THREE.MeshStandardMaterial({
      color: isReconstructed ? 0x00ff99 : 0xff3366,
      emissive: isReconstructed ? 0x00ff99 : 0xff3366,
      emissiveIntensity: 0.6,
      wireframe: !isReconstructed,
      transparent: true,
      opacity: 0.8,
    });
    materialRef.current = pcbMat;

    const pcb = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.1, 3.5), pcbMat);
    group.add(pcb);

    // Chips
    const chipsMat = new THREE.MeshStandardMaterial({
      color: isReconstructed ? 0x00e6ff : 0x8a97b5,
      emissive: isReconstructed ? 0x00e6ff : 0x000000,
      emissiveIntensity: isReconstructed ? 0.8 : 0,
      metalness: 0.9,
    });
    chipsMatRef.current = chipsMat;

    [-1.8, 0, 1.8].forEach((x) => {
      [-0.8, 0.8].forEach((z) => {
        const chip = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.8), chipsMat);
        chip.position.set(x, 0.2, z);
        group.add(chip);
      });
    });

    scene.add(group);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      group.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isReconstructed]);

  return <div ref={containerRef} className="w-full h-full" />;
}
