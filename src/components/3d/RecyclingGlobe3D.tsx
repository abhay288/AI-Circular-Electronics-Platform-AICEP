"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function RecyclingGlobe3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Studio Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);

    const camera = new THREE.PerspectiveCamera(
      36,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 6.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 2. High-Contrast Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x16a34a, 2.5); // Emerald recycling key
    keyLight.position.set(4, 6, 4);
    scene.add(keyLight);

    const blueLight = new THREE.DirectionalLight(0x2563eb, 2.0); // Royal blue accent
    blueLight.position.set(-4, -4, 4);
    scene.add(blueLight);

    const mainGroup = new THREE.Group();

    // 3. Inner Translucent Earth Core Sphere
    const coreGeo = new THREE.SphereGeometry(1.2, 48, 48);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0xdcfce7,
      transmission: 0.85,
      opacity: 0.9,
      transparent: true,
      roughness: 0.15,
      ior: 1.4,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    mainGroup.add(coreMesh);

    // Wireframe Outer Mesh
    const wireframeGeo = new THREE.SphereGeometry(1.23, 24, 24);
    const wireframeMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      wireframe: true,
      metalness: 0.8,
      roughness: 0.2,
    });
    const wireframeMesh = new THREE.Mesh(wireframeGeo, wireframeMat);
    mainGroup.add(wireframeMesh);

    // 4. 3D Möbius Recycling Ring Ribbon
    const ringGroup = new THREE.Group();
    const ringGeo = new THREE.TorusGeometry(1.6, 0.075, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x052e16,
      emissiveIntensity: 0.3,
    });
    const ringMesh1 = new THREE.Mesh(ringGeo, ringMat);
    ringMesh1.rotation.x = Math.PI / 3;
    ringGroup.add(ringMesh1);

    const ringMesh2 = new THREE.Mesh(
      ringGeo,
      new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x1e3a8a,
        emissiveIntensity: 0.3,
      })
    );
    ringMesh2.rotation.x = -Math.PI / 3;
    ringMesh2.rotation.y = Math.PI / 4;
    ringGroup.add(ringMesh2);

    mainGroup.add(ringGroup);

    // 5. Orbiting Recycled Microchip Nodes (18 Nodes)
    const nodeGeo = new THREE.BoxGeometry(0.11, 0.11, 0.04);
    const nodeMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1.0, roughness: 0.1 });

    for (let i = 0; i < 18; i++) {
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      const angle = (i / 18) * Math.PI * 2;
      node.position.set(Math.cos(angle) * 1.6, Math.sin(angle) * 1.6, (Math.random() - 0.5) * 0.4);
      ringMesh1.add(node);
    }

    // 6. Floating Sparkle Particles
    const particlesGeo = new THREE.BufferGeometry();
    const count = 60;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 4.0;
      positions[i + 1] = (Math.random() - 0.5) * 4.0;
      positions[i + 2] = (Math.random() - 0.5) * 3.0;
    }
    particlesGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({ size: 0.035, color: 0x16a34a, transparent: true, opacity: 0.75 });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    mainGroup.add(particles);

    scene.add(mainGroup);

    // Mouse Parallax Interaction
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
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Continuous Earth & Recycling Ring Rotation
      mainGroup.rotation.y += 0.008;
      mainGroup.rotation.x = Math.sin(elapsedTime * 0.6) * 0.12 + mouseY * 0.2;
      mainGroup.rotation.z = mouseX * 0.2;

      ringGroup.rotation.z = elapsedTime * 0.2;

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
