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
    scene.background = new THREE.Color(0xf1f5f9);
    scene.fog = new THREE.FogExp2(0xf1f5f9, 0.015);

    const camera = new THREE.PerspectiveCamera(
      35,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 6.0, 11.5);
    camera.lookAt(0, -0.1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 2. High-Contrast Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(6, 12, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00e6ff, 1.4);
    rimLight.position.set(-6, 8, -6);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.1);
    fillLight.position.set(0, 8, 8);
    scene.add(fillLight);

    // 3. Brushed Aluminum Turntable Pedestal Base
    const pedestalGroup = new THREE.Group();

    // Floor shadow receiver
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

    // Aluminum Pedestal Base
    const aluminumGeo = new THREE.CylinderGeometry(3.6, 3.8, 0.5, 64);
    const aluminumMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.92,
      roughness: 0.12,
    });
    const aluminumPedestal = new THREE.Mesh(aluminumGeo, aluminumMat);
    aluminumPedestal.position.y = -0.25;
    aluminumPedestal.castShadow = true;
    aluminumPedestal.receiveShadow = true;
    pedestalGroup.add(aluminumPedestal);

    // Animated LED Undercarriage Ring
    const ringGeo = new THREE.TorusGeometry(3.4, 0.06, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00e6ff });
    const ledRing = new THREE.Mesh(ringGeo, ringMat);
    ledRing.rotation.x = Math.PI / 2;
    ledRing.position.y = -0.52;
    pedestalGroup.add(ledRing);

    // 4. REALISTIC HIGH-CONTRAST MOTHERBOARD ASSEMBLY
    const motherboardGroup = new THREE.Group();
    motherboardGroup.position.y = 0.25;

    // Classic Deep Emerald PCB Substrate
    const pcbWidth = 5.2;
    const pcbDepth = 4.0;
    const pcbGeo = new THREE.BoxGeometry(pcbWidth, 0.14, pcbDepth);
    const pcbMat = new THREE.MeshStandardMaterial({
      color: 0x0a2f1d,
      roughness: 0.25,
      metalness: 0.45,
    });
    const pcbBoard = new THREE.Mesh(pcbGeo, pcbMat);
    pcbBoard.castShadow = true;
    pcbBoard.receiveShadow = true;
    motherboardGroup.add(pcbBoard);

    // Gold Circuit Trace Grid Network
    const traceGoldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 1.0,
      roughness: 0.1,
    });
    for (let i = 0; i < 24; i++) {
      const startX = (Math.random() - 0.5) * 4.4;
      const startZ = (Math.random() - 0.5) * 3.4;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(startX, 0.08, startZ),
        new THREE.Vector3(startX + (Math.random() - 0.5) * 1.6, 0.08, startZ),
        new THREE.Vector3(startX + (Math.random() - 0.5) * 1.6, 0.08, startZ + (Math.random() - 0.5) * 1.6),
      ]);
      const trace = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.014, 6, false), traceGoldMat);
      motherboardGroup.add(trace);
    }

    // CPU Socket (Silver LGA 1700 Metallic Frame)
    const socketMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.15 });
    const socketBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 1.6), socketMat);
    socketBase.position.set(0, 0.11, 0);
    socketBase.castShadow = true;
    motherboardGroup.add(socketBase);

    // Shiny CPU Metal Latch Frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.98, roughness: 0.05 });
    const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 1.7), frameMat);
    frameLeft.position.set(-0.84, 0.15, 0);
    motherboardGroup.add(frameLeft);

    const frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 1.7), frameMat);
    frameRight.position.set(0.84, 0.15, 0);
    motherboardGroup.add(frameRight);

    // Mirror-like Processor Die (Silicon Heat Spreader)
    const cpuDieMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 1.0,
      roughness: 0.05,
    });
    const cpuDie = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 1.2), cpuDieMat);
    cpuDie.position.set(0, 0.18, 0);
    cpuDie.castShadow = true;
    motherboardGroup.add(cpuDie);

    // Holographic Brand Badge on CPU
    const brandMat = new THREE.MeshBasicMaterial({ color: 0x00e6ff });
    const brandBadge = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.6), brandMat);
    brandBadge.position.set(0, 0.22, 0);
    motherboardGroup.add(brandBadge);

    // VRM Metallic Heatsink Fin Blocks
    const heatsinkMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.95, roughness: 0.1 });
    const leftHeatsink = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 2.2), heatsinkMat);
    leftHeatsink.position.set(-1.4, 0.28, -0.2);
    leftHeatsink.castShadow = true;
    motherboardGroup.add(leftHeatsink);

    const topHeatsink = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.42, 0.55), heatsinkMat);
    topHeatsink.position.set(0, 0.28, -1.3);
    topHeatsink.castShadow = true;
    motherboardGroup.add(topHeatsink);

    // DDR5 Dual-Channel RAM DIMM Slots (4 Slots)
    const slotMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
    const ramStickMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.1 });
    const goldPinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1.0, roughness: 0.1 });

    [-2.1, -1.8, 1.8, 2.1].forEach((x, idx) => {
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 3.2), slotMat);
      slot.position.set(x, 0.14, 0.2);
      slot.castShadow = true;
      motherboardGroup.add(slot);

      const goldEdge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 3.1), goldPinMat);
      goldEdge.position.set(x, 0.26, 0.2);
      motherboardGroup.add(goldEdge);

      if (idx % 2 === 1) {
        const ram = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 3.1), ramStickMat);
        ram.position.set(x, 0.42, 0.2);
        ram.castShadow = true;
        motherboardGroup.add(ram);
      }
    });

    // PCIe 5.0 Metal Shielded Slots
    const pcieShieldMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.98, roughness: 0.08 });
    [0.7, 1.6].forEach((z) => {
      const pcie = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.22, 0.16), slotMat);
      pcie.position.set(-0.2, 0.14, z);
      pcie.castShadow = true;
      motherboardGroup.add(pcie);

      const shield = new THREE.Mesh(new THREE.BoxGeometry(3.54, 0.24, 0.04), pcieShieldMat);
      shield.position.set(-0.2, 0.15, z - 0.09);
      motherboardGroup.add(shield);
    });

    // Rear I/O Panel Metallic Stack
    const ioMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.1 });
    const ioTower = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.75, 1.8), ioMat);
    ioTower.position.set(-pcbWidth / 2 + 0.4, 0.45, -pcbDepth / 2 + 1.0);
    ioTower.castShadow = true;
    motherboardGroup.add(ioTower);

    // Realistic Aluminum Electrolytic Capacitors (22 Units)
    const capBodyMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.08 });
    const capTopMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.5 });

    for (let i = 0; i < 22; i++) {
      const cx = (Math.random() - 0.5) * 4.2;
      const cz = (Math.random() - 0.5) * 3.2;
      if (Math.abs(cx) > 0.9 || Math.abs(cz) > 0.9) {
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.35, 16), capBodyMat);
        cap.position.set(cx, 0.23, cz);
        cap.castShadow = true;
        motherboardGroup.add(cap);

        const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 16), capTopMat);
        capTop.position.set(cx, 0.41, cz);
        motherboardGroup.add(capTop);
      }
    }

    pedestalGroup.add(motherboardGroup);
    scene.add(pedestalGroup);

    // 5. HIGH-TECH WHITE INDUSTRIAL ROBOTIC ARM WITH INTENSE CYAN LASER SCANNER
    const robotGroup = new THREE.Group();
    robotGroup.position.set(0, 3.8, 0);

    const whiteArmMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.3, roughness: 0.1 });
    const darkJointMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 });
    const blueAccentMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });

    // Base Joint (Axis 1)
    const baseJoint = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 0.8, 32), whiteArmMat);
    baseJoint.castShadow = true;
    robotGroup.add(baseJoint);

    const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.04, 16, 32), blueAccentMat);
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = -0.35;
    robotGroup.add(baseRing);

    // Shoulder Link (Axis 2)
    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.5, 0.45), darkJointMat);
    shoulder.position.set(0, -0.9, 0);
    shoulder.rotation.z = Math.PI / 7;
    shoulder.castShadow = true;
    robotGroup.add(shoulder);

    // Forearm Extension (Axis 3 & 4)
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.3, 24), whiteArmMat);
    forearm.position.set(0.35, -2.1, 0);
    forearm.rotation.z = -Math.PI / 6;
    forearm.castShadow = true;
    robotGroup.add(forearm);

    // Wrist Optical Scanner Head
    const scannerHead = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.4, 0.75), darkJointMat);
    scannerHead.position.set(0.05, -2.9, 0);
    scannerHead.castShadow = true;
    robotGroup.add(scannerHead);

    // Optical Glass Lens Emitter
    const lensMat = new THREE.MeshBasicMaterial({ color: 0x00e6ff });
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 24), lensMat);
    lens.position.set(0.05, -3.12, 0);
    robotGroup.add(lens);

    // INTENSE CYAN LASER SCANNING BEAM CONE (PROJECTING DIRECTLY ONTO PCB)
    const laserBeamGeo = new THREE.CylinderGeometry(0.04, 1.1, 2.8, 32);
    const laserBeamMat = new THREE.MeshBasicMaterial({
      color: 0x00e6ff,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const laserBeam = new THREE.Mesh(laserBeamGeo, laserBeamMat);
    laserBeam.position.set(0.05, -4.5, 0);
    robotGroup.add(laserBeam);

    // Laser Intersection Ring Spot on PCB Surface
    const laserSpotGeo = new THREE.RingGeometry(0.05, 0.95, 32);
    const laserSpotMat = new THREE.MeshBasicMaterial({
      color: 0x00e6ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const laserSpot = new THREE.Mesh(laserSpotGeo, laserSpotMat);
    laserSpot.rotation.x = Math.PI / 2;
    laserSpot.position.set(0.05, -5.88, 0);
    robotGroup.add(laserSpot);

    scene.add(robotGroup);

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

    // Animation Loop (Kinematic Joint Sweeping)
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Pedestal & PCB Rotation
      pedestalGroup.rotation.y += 0.006;

      // Kinematic Robotic Arm Multi-Axis Sweeping Motion
      const sweepX = Math.sin(elapsedTime * 1.5) * 1.1;
      const sweepZ = Math.cos(elapsedTime * 1.1) * 0.75;
      robotGroup.position.x = sweepX;
      robotGroup.position.z = sweepZ;

      // Subtle wrist tilt & scanner head rotation
      scannerHead.rotation.y = Math.sin(elapsedTime * 2.0) * 0.2;
      laserSpot.scale.setScalar(1.0 + Math.sin(elapsedTime * 4.0) * 0.15);

      // Camera Parallax
      camera.position.x = mouseX * 2.0;
      camera.position.y = 6.0 + mouseY * 1.0;
      camera.lookAt(0, -0.1, 0);

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
