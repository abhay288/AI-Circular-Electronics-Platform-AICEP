"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function MotherboardHeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 4, 9);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const cyanLight = new THREE.DirectionalLight(0x00e6ff, 1.8);
    cyanLight.position.set(10, 10, 5);
    scene.add(cyanLight);

    const purpleLight = new THREE.PointLight(0x6c63ff, 2, 20);
    purpleLight.position.set(-10, -5, -5);
    scene.add(purpleLight);

    const greenSpot = new THREE.SpotLight(0x00ff99, 2.5);
    greenSpot.position.set(0, 10, 0);
    scene.add(greenSpot);

    // 3. Motherboard Group Assembly
    const boardGroup = new THREE.Group();

    // PCB Base Plate
    const boardGeo = new THREE.BoxGeometry(8, 0.15, 6);
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0x0a1325,
      roughness: 0.3,
      metalness: 0.8,
    });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.y = -0.2;
    boardGroup.add(board);

    // CPU Socket (Center)
    const cpuGeo = new THREE.BoxGeometry(2.2, 0.2, 2.2);
    const cpuMat = new THREE.MeshStandardMaterial({
      color: 0x102040,
      metalness: 0.9,
      roughness: 0.1,
    });
    const cpu = new THREE.Mesh(cpuGeo, cpuMat);
    cpu.position.y = 0.1;
    boardGroup.add(cpu);

    // CPU Silicon Core (Glowing)
    const coreGeo = new THREE.BoxGeometry(1.4, 0.05, 1.4);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x00e6ff,
      emissive: 0x00e6ff,
      emissiveIntensity: 0.8,
      metalness: 1.0,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 0.22;
    boardGroup.add(core);

    // RAM Modules
    [-2.6, -2.2, 2.2, 2.6].forEach((x) => {
      const ramStick = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.6, 4.2),
        new THREE.MeshStandardMaterial({ color: 0x0a1e3f, metalness: 0.7 })
      );
      ramStick.position.set(x, 0.3, 0);
      boardGroup.add(ramStick);
    });

    // Solid Capacitors Array
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 1.8;
      const cx = Math.cos(angle) * radius;
      const cz = Math.sin(angle) * radius;
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.45, 16),
        new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.9 })
      );
      cap.position.set(cx, 0.3, cz);
      boardGroup.add(cap);
    }

    // Circuit Copper Tube Traces
    for (let i = 0; i < 14; i++) {
      const startX = (Math.random() - 0.5) * 7;
      const startZ = (Math.random() - 0.5) * 5;
      const midX = startX + (Math.random() - 0.5) * 2;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(startX, 0.05, startZ),
        new THREE.Vector3(midX, 0.05, startZ),
        new THREE.Vector3(midX, 0.05, startZ + (Math.random() - 0.5) * 2),
      ]);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 15, 0.02, 8, false),
        new THREE.MeshStandardMaterial({
          color: 0x00e6ff,
          emissive: 0x00e6ff,
          emissiveIntensity: 0.9,
        })
      );
      boardGroup.add(tube);
    }

    scene.add(boardGroup);

    // 4. Circuit Particle Field
    const particleCount = 250;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      particlePositions[i] = (Math.random() - 0.5) * 14;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );
    const particleMat = new THREE.PointsMaterial({
      size: 0.06,
      color: 0x00e6ff,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const particleField = new THREE.Points(particleGeo, particleMat);
    scene.add(particleField);

    // Mouse Parallax Interaction
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.5;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.5;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Resize Handler
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

      boardGroup.rotation.y += 0.005;
      boardGroup.rotation.x = mouseY * 0.3;
      boardGroup.rotation.z = mouseX * 0.2;

      particleField.rotation.y += 0.002;

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
