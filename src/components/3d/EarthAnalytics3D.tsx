"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function EarthAnalytics3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup with Light Studio background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 4.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 2. Photorealistic Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.8);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const greenSpot = new THREE.PointLight(0x16a34a, 2.5, 20);
    greenSpot.position.set(4, 4, 4);
    scene.add(greenSpot);

    const blueSpot = new THREE.PointLight(0x2563eb, 1.5, 20);
    blueSpot.position.set(-4, -4, -4);
    scene.add(blueSpot);

    const earthGroup = new THREE.Group();

    // Emerald Green Wireframe Globe
    const globeGeo = new THREE.SphereGeometry(1.8, 36, 36);
    const globeMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      emissive: 0x16a34a,
      emissiveIntensity: 0.6,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const wireframeGlobe = new THREE.Mesh(globeGeo, globeMat);
    earthGroup.add(wireframeGlobe);

    // Inner Translucent Core Sphere (Royal Blue / Soft Emerald Tint)
    const coreGeo = new THREE.SphereGeometry(1.65, 32, 32);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0xdcfce7,
      transmission: 0.8,
      opacity: 0.9,
      transparent: true,
      roughness: 0.1,
      ior: 1.3,
    });
    const coreSphere = new THREE.Mesh(coreGeo, coreMat);
    earthGroup.add(coreSphere);

    // Data Nodes on Globe Surface (Glowing Dots)
    const nodeCount = 45;
    const nodeGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      emissive: 0x16a34a,
      emissiveIntensity: 1.0,
    });

    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi;
      const x = 1.82 * Math.cos(theta) * Math.sin(phi);
      const y = 1.82 * Math.sin(theta) * Math.sin(phi);
      const z = 1.82 * Math.cos(phi);

      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.set(x, y, z);
      earthGroup.add(nodeMesh);
    }

    scene.add(earthGroup);

    // Orbiting Emerald Particle Ring
    const particleCount = 180;
    const ringPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 2.4 + (Math.random() - 0.5) * 0.25;
      ringPositions[i * 3] = Math.cos(angle) * radius;
      ringPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      ringPositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const ringGeo = new THREE.BufferGeometry();
    ringGeo.setAttribute("position", new THREE.BufferAttribute(ringPositions, 3));
    const ringMat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x16a34a,
      transparent: true,
      opacity: 0.8,
    });
    const particleRing = new THREE.Points(ringGeo, ringMat);
    scene.add(particleRing);

    // Mouse Interaction Parallax
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

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      earthGroup.rotation.y += 0.006;
      earthGroup.rotation.x = mouseY * 0.2;
      earthGroup.rotation.z = mouseX * 0.2;

      particleRing.rotation.z += 0.003;

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
