"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function TechSphere3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x00e6ff, 2, 20);
    cyanLight.position.set(5, 5, 5);
    scene.add(cyanLight);

    const purpleLight = new THREE.PointLight(0x6c63ff, 2, 20);
    purpleLight.position.set(-5, -5, -5);
    scene.add(purpleLight);

    const ringGroup = new THREE.Group();

    // Orbital Nodes (Spheres)
    const nodeCount = 10;
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 2.6;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const nodeMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0x00e6ff : 0x6c63ff,
        emissive: i % 2 === 0 ? 0x00e6ff : 0x6c63ff,
        emissiveIntensity: 0.8,
        metalness: 0.9,
      });
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), nodeMat);
      node.position.set(x, 0, z);
      ringGroup.add(node);
    }

    // Central Tech Core
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x00e6ff,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const core = new THREE.Mesh(new THREE.SphereGeometry(1.0, 24, 24), coreMat);
    ringGroup.add(core);

    scene.add(ringGroup);

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
      ringGroup.rotation.y += 0.008;
      ringGroup.rotation.x = Math.sin(Date.now() * 0.001) * 0.15;
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
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
