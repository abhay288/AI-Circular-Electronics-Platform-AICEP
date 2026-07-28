"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function PassportCard3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 4);

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

    const group = new THREE.Group();

    // 3D Glass Passport Slab
    const slabMat = new THREE.MeshPhysicalMaterial({
      color: 0x00e6ff,
      transmission: 0.9,
      opacity: 1,
      transparent: true,
      roughness: 0.1,
      ior: 1.5,
      thickness: 0.5,
    });
    const slab = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.0, 0.12), slabMat);
    group.add(slab);

    // Inner Holographic Wireframe Grid
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x6c63ff,
      emissive: 0x6c63ff,
      emissiveIntensity: 0.6,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const core = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.6), coreMat);
    core.position.z = 0.07;
    group.add(core);

    scene.add(group);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    let animId: number;
    let clock = new THREE.Clock();
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      group.rotation.y += 0.01;
      group.rotation.x = Math.sin(elapsedTime * 0.8) * 0.1;
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
