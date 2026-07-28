"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function LabHeroRoboticScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Studio Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.025);

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 4.8, 9.5);
    camera.lookAt(0, 0.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 2. Photorealistic Studio Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(8, 14, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    const fillBlueLight = new THREE.DirectionalLight(0x2563eb, 0.6);
    fillBlueLight.position.set(-8, 6, -6);
    scene.add(fillBlueLight);

    const spotLight = new THREE.SpotLight(0x60a5fa, 2.5);
    spotLight.position.set(0, 10, 0);
    spotLight.angle = 0.5;
    spotLight.penumbra = 0.8;
    scene.add(spotLight);

    // 3. Brushed Aluminum Pedestal Base with Blue LED Ring
    const pedestalGroup = new THREE.Group();

    // Floor Shadow Receiver Base
    const floorGeo = new THREE.CylinderGeometry(4.8, 4.8, 0.12, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.3,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.56;
    floor.receiveShadow = true;
    pedestalGroup.add(floor);

    // Brushed Aluminum Cylindrical Pedestal
    const aluminumGeo = new THREE.CylinderGeometry(3.6, 3.8, 0.6, 64);
    const aluminumMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.2,
    });
    const aluminumPedestal = new THREE.Mesh(aluminumGeo, aluminumMat);
    aluminumPedestal.position.y = -0.25;
    aluminumPedestal.castShadow = true;
    aluminumPedestal.receiveShadow = true;
    pedestalGroup.add(aluminumPedestal);

    // Blue LED Undercarriage Ring
    const ringGeo = new THREE.TorusGeometry(3.4, 0.08, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x2563eb,
      emissiveIntensity: 1.2,
    });
    const ledRing = new THREE.Mesh(ringGeo, ringMat);
    ledRing.rotation.x = Math.PI / 2;
    ledRing.position.y = -0.54;
    pedestalGroup.add(ledRing);

    // 4. High-Resolution Floating Motherboard PCB
    const pcbGroup = new THREE.Group();
    pcbGroup.position.y = 0.35;

    // Dark Sapphire PCB Board Surface
    const pcbGeo = new THREE.BoxGeometry(5.2, 0.16, 4.0);
    const pcbMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.75,
    });
    const pcbBoard = new THREE.Mesh(pcbGeo, pcbMat);
    pcbBoard.castShadow = true;
    pcbBoard.receiveShadow = true;
    pcbGroup.add(pcbBoard);

    // Central Processor SoC Socket
    const cpuSocket = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.22, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.1 })
    );
    cpuSocket.position.set(0, 0.12, 0);
    cpuSocket.castShadow = true;
    pcbGroup.add(cpuSocket);

    // Silicon Metallic Core
    const siliconCore = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.05, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 1.0, roughness: 0.1 })
    );
    siliconCore.position.set(0, 0.24, 0);
    pcbGroup.add(siliconCore);

    // Memory Module Slots & Heavy Capacitors
    [-1.8, -1.5, 1.5, 1.8].forEach((x) => {
      const ram = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.5, 3.0),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 })
      );
      ram.position.set(x, 0.25, 0);
      ram.castShadow = true;
      pcbGroup.add(ram);
    });

    // Metallic Capacitors Array
    const capMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.1 });
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const radius = 1.4;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.4, 16), capMat);
      cap.position.set(Math.cos(angle) * radius, 0.22, Math.sin(angle) * radius);
      cap.castShadow = true;
      pcbGroup.add(cap);
    }

    // Copper Traces on PCB Surface
    const traceMat = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      emissive: 0x2563eb,
      emissiveIntensity: 0.8,
    });
    for (let i = 0; i < 16; i++) {
      const startX = (Math.random() - 0.5) * 4.5;
      const startZ = (Math.random() - 0.5) * 3.4;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(startX, 0.09, startZ),
        new THREE.Vector3(startX + (Math.random() - 0.5) * 1.5, 0.09, startZ),
        new THREE.Vector3(startX + (Math.random() - 0.5) * 1.5, 0.09, startZ + (Math.random() - 0.5) * 1.5),
      ]);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.015, 6, false), traceMat);
      pcbGroup.add(tube);
    }

    pedestalGroup.add(pcbGroup);
    scene.add(pedestalGroup);

    // 5. 6-Axis Industrial Robotic Inspection Arm
    const robotGroup = new THREE.Group();
    robotGroup.position.set(0, 3.4, 0);

    // Base Joint (Axis 1)
    const axis1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.65, 0.8, 32),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.15 })
    );
    axis1.castShadow = true;
    robotGroup.add(axis1);

    // Shoulder Link (Axis 2)
    const axis2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 1.4, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 })
    );
    axis2.position.set(0, -0.9, 0);
    axis2.rotation.z = Math.PI / 8;
    axis2.castShadow = true;
    robotGroup.add(axis2);

    // Elbow Link & Forearm (Axis 3 & 4)
    const axis3 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 1.1, 24),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.8, roughness: 0.2 })
    );
    axis3.position.set(0.35, -1.7, 0);
    axis3.rotation.z = -Math.PI / 6;
    axis3.castShadow = true;
    robotGroup.add(axis3);

    // Wrist & Scanner Head (Axis 5 & 6)
    const scannerHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.35, 0.65),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 })
    );
    scannerHead.position.set(0.1, -2.4, 0);
    scannerHead.castShadow = true;
    robotGroup.add(scannerHead);

    // Continuous Blue Scanning Laser Cone Beam
    const laserGeo = new THREE.CylinderGeometry(0.02, 0.7, 2.2, 24);
    const laserMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x3b82f6,
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: 0.45,
    });
    const laserBeam = new THREE.Mesh(laserGeo, laserMat);
    laserBeam.position.set(0.1, -3.5, 0);
    robotGroup.add(laserBeam);

    scene.add(robotGroup);

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

      // Pedestal & PCB Slow Rotation
      pedestalGroup.rotation.y += 0.005;

      // 6-Axis Arm Scanning Sweep
      const sweepX = Math.sin(elapsedTime * 1.2) * 0.8;
      const sweepZ = Math.cos(elapsedTime * 0.9) * 0.5;
      robotGroup.position.x = sweepX;
      robotGroup.position.z = sweepZ;

      // Parallax Camera Orbit
      camera.position.x = mouseX * 2.5;
      camera.position.y = 4.8 + mouseY * 1.2;
      camera.lookAt(0, 0.2, 0);

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
