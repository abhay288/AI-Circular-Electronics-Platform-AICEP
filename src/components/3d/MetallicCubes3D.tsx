"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function MetallicCubes3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 5.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.8);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const group = new THREE.Group();

    // 4 Periodic Metallic Cubes
    const metals = [
      { name: "Au", color: 0xffd700, roughness: 0.1, x: -2.1 },
      { name: "Ag", color: 0xe0e0e0, roughness: 0.15, x: -0.7 },
      { name: "Cu", color: 0xb87333, roughness: 0.2, x: 0.7 },
      { name: "Pd", color: 0x808080, roughness: 0.1, x: 2.1 },
    ];

    const cubeGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);

    metals.forEach((m) => {
      const mat = new THREE.MeshStandardMaterial({
        color: m.color,
        metalness: 1.0,
        roughness: m.roughness,
      });
      const cube = new THREE.Mesh(cubeGeo, mat);
      cube.position.set(m.x, 0, 0);
      cube.castShadow = true;
      group.add(cube);
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
      group.children.forEach((child, idx) => {
        child.rotation.y += 0.01 + idx * 0.002;
        child.rotation.x += 0.005;
      });
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
