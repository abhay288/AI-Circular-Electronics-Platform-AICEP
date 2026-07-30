"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function MetallicCubes3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.8, 5.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // 2. Studio Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const goldSpot = new THREE.PointLight(0xf59e0b, 2.0, 10);
    goldSpot.position.set(-2, 2, 2);
    scene.add(goldSpot);

    const blueSpot = new THREE.PointLight(0x2563eb, 1.5, 10);
    blueSpot.position.set(2, -2, 2);
    scene.add(blueSpot);

    // 3. Metallic Cubes Group (Au, Ag, Cu, Pd)
    const cubesGroup = new THREE.Group();

    const cubeGeo = new THREE.BoxGeometry(0.85, 0.85, 0.85);

    const metals = [
      { name: "Au", color: 0xffd700, roughness: 0.1, metalness: 1.0, pos: [-1.4, 0.4, 0] },
      { name: "Ag", color: 0xe2e8f0, roughness: 0.08, metalness: 1.0, pos: [-0.45, -0.4, 0.4] },
      { name: "Cu", color: 0xea580c, roughness: 0.15, metalness: 0.95, pos: [0.5, 0.4, -0.2] },
      { name: "Pd", color: 0x60a5fa, roughness: 0.12, metalness: 0.98, pos: [1.45, -0.3, 0.2] },
    ];

    metals.forEach((m) => {
      const mat = new THREE.MeshStandardMaterial({
        color: m.color,
        metalness: m.metalness,
        roughness: m.roughness,
      });
      const cube = new THREE.Mesh(cubeGeo, mat);
      cube.position.set(m.pos[0], m.pos[1], m.pos[2]);
      cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      cube.castShadow = true;
      cube.receiveShadow = true;
      cubesGroup.add(cube);
    });

    scene.add(cubesGroup);

    // 4. Mouse Orbit Interaction & Animation
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.4;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.4;
    };
    window.addEventListener("mousemove", handleMouseMove);

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

      cubesGroup.rotation.y += 0.008;
      cubesGroup.rotation.x = mouseY * 0.3;
      cubesGroup.rotation.z = mouseX * 0.3;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
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
