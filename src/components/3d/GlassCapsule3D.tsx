"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function GlassCapsule3D({ isHovered = false }: { isHovered?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const capsuleGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 3.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x00e6ff, 2, 20);
    cyanLight.position.set(5, 5, 5);
    scene.add(cyanLight);

    const greenLight = new THREE.PointLight(0x00ff99, 2, 20);
    greenLight.position.set(-5, -5, -5);
    scene.add(greenLight);

    const group = new THREE.Group();
    capsuleGroupRef.current = group;

    // Glass Cylinder Outer Shell
    const capsuleMat = new THREE.MeshPhysicalMaterial({
      color: 0x00e6ff,
      transmission: 0.9,
      opacity: 1,
      transparent: true,
      roughness: 0.05,
      ior: 1.4,
      thickness: 0.4,
    });
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 2.1, 32), capsuleMat);
    group.add(shell);

    // Inner Recovered Component (Floating Die)
    const chipMat = new THREE.MeshStandardMaterial({
      color: isHovered ? 0x00ff99 : 0x00e6ff,
      emissive: isHovered ? 0x00ff99 : 0x00e6ff,
      emissiveIntensity: 0.6,
      metalness: 0.9,
    });
    const chip = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.2), chipMat);
    group.add(chip);

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
      group.rotation.y += isHovered ? 0.03 : 0.008;
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
  }, [isHovered]);

  return <div ref={containerRef} className="w-full h-full" />;
}
