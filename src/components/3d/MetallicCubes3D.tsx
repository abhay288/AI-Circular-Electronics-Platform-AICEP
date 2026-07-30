"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function MetallicCubes3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Studio Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.8, 5.6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    container.appendChild(renderer.domElement);

    // 2. Multi-Directional High-Contrast Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 3.0);
    mainKeyLight.position.set(5, 8, 5);
    mainKeyLight.castShadow = true;
    scene.add(mainKeyLight);

    const fillLightLeft = new THREE.DirectionalLight(0xffedd5, 2.0); // Warm gold fill
    fillLightLeft.position.set(-6, 4, 3);
    scene.add(fillLightLeft);

    const fillLightRight = new THREE.DirectionalLight(0xdbeafe, 2.0); // Cool blue fill
    fillLightRight.position.set(6, -2, 4);
    scene.add(fillLightRight);

    const bottomLight = new THREE.DirectionalLight(0xffffff, 1.5);
    bottomLight.position.set(0, -6, 2);
    scene.add(bottomLight);

    // 3. Metallic Cubes Group (Au, Ag, Cu, Pd)
    const mainGroup = new THREE.Group();

    const cubeGeo = new THREE.BoxGeometry(0.85, 0.85, 0.85);

    const metals = [
      {
        name: "Au",
        color: 0xf59e0b,
        metalness: 0.85,
        roughness: 0.18,
        emissive: 0x451a03,
        pos: [-1.45, 0.45, 0],
      },
      {
        name: "Ag",
        color: 0x94a3b8,
        metalness: 0.85,
        roughness: 0.15,
        emissive: 0x1e293b,
        pos: [-0.45, -0.4, 0.45],
      },
      {
        name: "Cu",
        color: 0xea580c,
        metalness: 0.85,
        roughness: 0.2,
        emissive: 0x431407,
        pos: [0.55, 0.45, -0.2],
      },
      {
        name: "Pd",
        color: 0x3b82f6,
        metalness: 0.85,
        roughness: 0.18,
        emissive: 0x1e3a8a,
        pos: [1.5, -0.3, 0.25],
      },
    ];

    metals.forEach((m) => {
      const metalMat = new THREE.MeshStandardMaterial({
        color: m.color,
        metalness: m.metalness,
        roughness: m.roughness,
        emissive: m.emissive,
        emissiveIntensity: 0.15,
      });

      const cubeMesh = new THREE.Mesh(cubeGeo, metalMat);
      cubeMesh.position.set(m.pos[0], m.pos[1], m.pos[2]);
      cubeMesh.rotation.set(Math.PI / 6, Math.PI / 4, 0);
      cubeMesh.castShadow = true;
      cubeMesh.receiveShadow = true;

      // Inner glowing core accent
      const innerCoreMat = new THREE.MeshBasicMaterial({ color: m.color });
      const innerCore = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.88, 0.88), innerCoreMat);
      innerCore.visible = false;
      cubeMesh.add(innerCore);

      mainGroup.add(cubeMesh);
    });

    // Orbiting Sparkle Particles
    const particlesGeo = new THREE.BufferGeometry();
    const particleCount = 45;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 4.5;
      posArray[i + 1] = (Math.random() - 0.5) * 3.0;
      posArray[i + 2] = (Math.random() - 0.5) * 3.0;
    }
    particlesGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.04,
      color: 0x2563eb,
      transparent: true,
      opacity: 0.7,
    });
    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    mainGroup.add(particlesMesh);

    scene.add(mainGroup);

    // Mouse Interaction
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

      // Continuous orbital rotation
      mainGroup.rotation.y += 0.007;
      mainGroup.rotation.x = Math.sin(elapsedTime * 0.8) * 0.15 + mouseY * 0.2;
      mainGroup.rotation.z = mouseX * 0.2;

      particlesMesh.rotation.y -= 0.003;

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
