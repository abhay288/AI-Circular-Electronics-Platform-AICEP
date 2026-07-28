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
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.02);

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5.2, 9.8);
    camera.lookAt(0, 0.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 2. Photorealistic Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    mainKeyLight.position.set(8, 14, 8);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 2048;
    mainKeyLight.shadow.mapSize.height = 2048;
    mainKeyLight.shadow.bias = -0.0001;
    scene.add(mainKeyLight);

    const fillBlue = new THREE.DirectionalLight(0x2563eb, 0.7);
    fillBlue.position.set(-8, 6, -6);
    scene.add(fillBlue);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.8);
    rimLight.position.set(0, 8, -8);
    scene.add(rimLight);

    // 3. Brushed Aluminum Pedestal Base
    const pedestalGroup = new THREE.Group();

    // Floor Base Disc
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

    // Aluminum Pedestal
    const aluminumGeo = new THREE.CylinderGeometry(3.6, 3.8, 0.5, 64);
    const aluminumMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.15,
    });
    const aluminumPedestal = new THREE.Mesh(aluminumGeo, aluminumMat);
    aluminumPedestal.position.y = -0.25;
    aluminumPedestal.castShadow = true;
    aluminumPedestal.receiveShadow = true;
    pedestalGroup.add(aluminumPedestal);

    // LED Undercarriage Ring
    const ringGeo = new THREE.TorusGeometry(3.4, 0.07, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x2563eb,
      emissiveIntensity: 1.4,
    });
    const ledRing = new THREE.Mesh(ringGeo, ringMat);
    ledRing.rotation.x = Math.PI / 2;
    ledRing.position.y = -0.52;
    pedestalGroup.add(ledRing);

    // 4. HIGH-DETAIL REALISTIC MOTHERBOARD ASSEMBLY
    const motherboardGroup = new THREE.Group();
    motherboardGroup.position.y = 0.25;

    // Dark Matte Fiber PCB Substrate Board
    const pcbWidth = 5.4;
    const pcbDepth = 4.2;
    const pcbHeight = 0.14;
    const pcbGeo = new THREE.BoxGeometry(pcbWidth, pcbHeight, pcbDepth);
    const pcbMat = new THREE.MeshStandardMaterial({
      color: 0x0a192f, // Deep Sapphire PCB
      roughness: 0.35,
      metalness: 0.65,
    });
    const pcbBoard = new THREE.Mesh(pcbGeo, pcbMat);
    pcbBoard.castShadow = true;
    pcbBoard.receiveShadow = true;
    motherboardGroup.add(pcbBoard);

    // CPU Socket (LGA 1700 Style)
    const socketWidth = 1.6;
    const socketDepth = 1.6;
    const socketMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.2 });
    const socketBase = new THREE.Mesh(new THREE.BoxGeometry(socketWidth, 0.12, socketDepth), socketMat);
    socketBase.position.set(0, 0.11, 0);
    socketBase.castShadow = true;
    motherboardGroup.add(socketBase);

    // CPU Metallic Retention Frame & Latch Arm
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.1 });
    const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, socketDepth + 0.1), frameMat);
    frameLeft.position.set(-socketWidth / 2 - 0.04, 0.14, 0);
    motherboardGroup.add(frameLeft);

    const frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, socketDepth + 0.1), frameMat);
    frameRight.position.set(socketWidth / 2 + 0.04, 0.14, 0);
    motherboardGroup.add(frameRight);

    // Processor Heat Spreader Die (Core)
    const cpuDieMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 1.0,
      roughness: 0.08,
    });
    const cpuDie = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 1.2), cpuDieMat);
    cpuDie.position.set(0, 0.18, 0);
    cpuDie.castShadow = true;
    motherboardGroup.add(cpuDie);

    // Brand Engraving on CPU
    const brandMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, emissive: 0x2563eb, emissiveIntensity: 0.4 });
    const brandBadge = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.5), brandMat);
    brandBadge.position.set(0, 0.22, 0);
    motherboardGroup.add(brandBadge);

    // VRM Aluminum Heatsink Blocks (Left & Top of CPU)
    const heatsinkMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.15 });
    // Left Heatsink
    const leftHeatsink = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 2.2), heatsinkMat);
    leftHeatsink.position.set(-1.4, 0.28, -0.2);
    leftHeatsink.castShadow = true;
    motherboardGroup.add(leftHeatsink);

    // Top Heatsink
    const topHeatsink = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 0.6), heatsinkMat);
    topHeatsink.position.set(0, 0.28, -1.3);
    topHeatsink.castShadow = true;
    motherboardGroup.add(topHeatsink);

    // Dual-Channel DDR5 RAM DIMM Slots (4 Slots)
    const slotMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7 });
    const goldContactMat = new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 1.0, roughness: 0.1 });
    const ramStickMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.2 });

    [-2.2, -1.9, 1.9, 2.2].forEach((x, idx) => {
      // Slot Base
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 3.2), slotMat);
      slot.position.set(x, 0.14, 0.2);
      slot.castShadow = true;
      motherboardGroup.add(slot);

      // Gold Pins Edge
      const goldEdge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 3.1), goldContactMat);
      goldEdge.position.set(x, 0.27, 0.2);
      motherboardGroup.add(goldEdge);

      // Installed RAM Stick in slots 2 and 4
      if (idx % 2 === 1) {
        const ram = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 3.1), ramStickMat);
        ram.position.set(x, 0.42, 0.2);
        ram.castShadow = true;
        motherboardGroup.add(ram);
      }
    });

    // PCIe 5.0 x16 Expansion Slots (2 Slots)
    const pcieMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
    const pcieShieldMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.1 });

    [0.7, 1.6].forEach((z) => {
      // Slot Base
      const pcie = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.22, 0.16), pcieMat);
      pcie.position.set(-0.2, 0.14, z);
      pcie.castShadow = true;
      motherboardGroup.add(pcie);

      // Metal Shield Reinforcement Around Slot
      const shield = new THREE.Mesh(new THREE.BoxGeometry(3.64, 0.24, 0.04), pcieShieldMat);
      shield.position.set(-0.2, 0.15, z - 0.09);
      motherboardGroup.add(shield);
    });

    // Rear I/O Panel Tower Assembly
    const ioMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
    const ioTower = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 1.8), ioMat);
    ioTower.position.set(-pcbWidth / 2 + 0.4, 0.42, -pcbDepth / 2 + 1.0);
    ioTower.castShadow = true;
    motherboardGroup.add(ioTower);

    // Solid Polymer Capacitors (24 Units across board)
    const capSilverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
    const capTopMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });

    for (let i = 0; i < 20; i++) {
      const cx = (Math.random() - 0.5) * 4.2;
      const cz = (Math.random() - 0.5) * 3.2;
      // Avoid CPU center
      if (Math.abs(cx) > 0.9 || Math.abs(cz) > 0.9) {
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.32, 16), capSilverMat);
        cap.position.set(cx, 0.22, cz);
        cap.castShadow = true;
        motherboardGroup.add(cap);

        const capMarking = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 16), capTopMat);
        capMarking.position.set(cx, 0.38, cz);
        motherboardGroup.add(capMarking);
      }
    }

    // High-Density Microcontroller Chips (BGA / QFN Packages)
    const chipMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 });
    const leadMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 1.0 });

    [
      { x: 1.2, z: -0.8, w: 0.7, d: 0.7, label: "Southbridge" },
      { x: -1.2, z: 1.2, w: 0.5, d: 0.5, label: "Audio IC" },
      { x: 0.8, z: 1.2, w: 0.6, d: 0.6, label: "LAN Controller" },
    ].forEach((c) => {
      const chip = new THREE.Mesh(new THREE.BoxGeometry(c.w, 0.12, c.d), chipMat);
      chip.position.set(c.x, 0.12, c.z);
      chip.castShadow = true;
      motherboardGroup.add(chip);
    });

    // Gold Circuit Traces Network
    const traceGoldMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x2563eb,
      emissiveIntensity: 0.9,
    });
    for (let i = 0; i < 22; i++) {
      const startX = (Math.random() - 0.5) * 4.6;
      const startZ = (Math.random() - 0.5) * 3.6;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(startX, 0.08, startZ),
        new THREE.Vector3(startX + (Math.random() - 0.5) * 1.8, 0.08, startZ),
        new THREE.Vector3(startX + (Math.random() - 0.5) * 1.8, 0.08, startZ + (Math.random() - 0.5) * 1.8),
      ]);
      const trace = new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.012, 6, false), traceGoldMat);
      motherboardGroup.add(trace);
    }

    pedestalGroup.add(motherboardGroup);
    scene.add(pedestalGroup);

    // 5. 6-AXIS INDUSTRIAL ROBOTIC ARM ASSEMBLY
    const robotGroup = new THREE.Group();
    robotGroup.position.set(0, 3.5, 0);

    const robotMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.15 });
    const jointMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.8, roughness: 0.2 });

    // Base Rotating Joint
    const baseJoint = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.7, 32), robotMat);
    baseJoint.castShadow = true;
    robotGroup.add(baseJoint);

    // Shoulder Link
    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.5, 0.42), robotMat);
    shoulder.position.set(0, -0.9, 0);
    shoulder.rotation.z = Math.PI / 7;
    shoulder.castShadow = true;
    robotGroup.add(shoulder);

    // Elbow Hinge Joint
    const elbowHinge = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.5, 24), jointMat);
    elbowHinge.position.set(0.32, -1.6, 0);
    elbowHinge.rotation.x = Math.PI / 2;
    robotGroup.add(elbowHinge);

    // Forearm Extension Link
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.2, 24), robotMat);
    forearm.position.set(0.32, -2.1, 0);
    forearm.rotation.z = -Math.PI / 6;
    forearm.castShadow = true;
    robotGroup.add(forearm);

    // Wrist Scanner Head
    const scannerHead = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.7), jointMat);
    scannerHead.position.set(0.05, -2.8, 0);
    scannerHead.castShadow = true;
    robotGroup.add(scannerHead);

    // Laser Beam Scanning Cone
    const laserGeo = new THREE.CylinderGeometry(0.02, 0.8, 2.4, 24);
    const laserMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x3b82f6,
      emissiveIntensity: 2.2,
      transparent: true,
      opacity: 0.45,
    });
    const laserBeam = new THREE.Mesh(laserGeo, laserMat);
    laserBeam.position.set(0.05, -3.9, 0);
    robotGroup.add(laserBeam);

    scene.add(robotGroup);

    // Mouse Controls
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

      // Pedestal & Detailed Motherboard Slow Rotation
      pedestalGroup.rotation.y += 0.005;

      // 6-Axis Arm Scanning Sweep
      const sweepX = Math.sin(elapsedTime * 1.2) * 0.9;
      const sweepZ = Math.cos(elapsedTime * 0.8) * 0.6;
      robotGroup.position.x = sweepX;
      robotGroup.position.z = sweepZ;

      // Camera Parallax
      camera.position.x = mouseX * 2.2;
      camera.position.y = 5.2 + mouseY * 1.1;
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
