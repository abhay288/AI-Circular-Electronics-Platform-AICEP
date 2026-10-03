"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function InspectionScanner3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 220;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 5.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lighting (clean light lab studio)
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x2563eb, 2.2);
    dirLight.position.set(4, 6, 4);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);
    fillLight.position.set(-4, -2, -2);
    scene.add(fillLight);

    const scannerGroup = new THREE.Group();

    // Robotic Camera Head Body
    const bodyGeo = new THREE.CylinderGeometry(0.85, 0.95, 1.2, 32);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.25,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    scannerGroup.add(body);

    // Aluminum Lens Housing Ring
    const ringGeo = new THREE.TorusGeometry(0.88, 0.08, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      metalness: 0.95,
      roughness: 0.1,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.4,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.55;
    scannerGroup.add(ring);

    // Optical Lens Element (Glass Reflection)
    const lensGeo = new THREE.SphereGeometry(0.65, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.4);
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.9,
      ior: 1.5,
      transparent: true,
      opacity: 0.85,
    });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.y = -0.4;
    lens.rotation.x = Math.PI;
    scannerGroup.add(lens);

    // Laser Emission Aperture (Glowing Blue Core)
    const coreGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.2, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = -0.6;
    scannerGroup.add(core);

    // Dual Mounting Arm Brackets
    [-1.05, 1.05].forEach((x) => {
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.9, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 })
      );
      arm.position.set(x, 0.1, 0);
      scannerGroup.add(arm);
    });

    // Sweeping Laser Cone (Subtle)
    const coneGeo = new THREE.ConeGeometry(1.6, 2.2, 32, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const laserCone = new THREE.Mesh(coneGeo, coneMat);
    laserCone.position.y = -1.7;
    laserCone.rotation.x = Math.PI;
    scannerGroup.add(laserCone);

    scene.add(scannerGroup);

    // Floating Target Grid Ring Below
    const targetRingGeo = new THREE.RingGeometry(1.1, 1.15, 32);
    const targetMat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const targetRing = new THREE.Mesh(targetRingGeo, targetMat);
    targetRing.rotation.x = Math.PI / 2;
    targetRing.position.y = -2.4;
    scene.add(targetRing);

    let animId: number;
    let t = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.02;

      scannerGroup.position.y = Math.sin(t * 0.8) * 0.08;
      scannerGroup.rotation.y = Math.sin(t * 0.5) * 0.25;
      scannerGroup.rotation.x = Math.cos(t * 0.4) * 0.08;

      laserCone.material.opacity = 0.12 + Math.sin(t * 3) * 0.06;
      targetRing.rotation.z += 0.005;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 300;
      const h = container.clientHeight || 220;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full min-h-[180px] pointer-events-none" />;
}
