"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface PreciousMetals3DProps {
  activeMetal?: "Au" | "Ag" | "Cu" | "Pd" | "All";
  onSelectMetal?: (metal: "Au" | "Ag" | "Cu" | "Pd") => void;
}

export default function PreciousMetals3D({
  activeMetal = "All",
  onSelectMetal,
}: PreciousMetals3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeMetalRef = useRef(activeMetal);

  useEffect(() => {
    activeMetalRef.current = activeMetal;
  }, [activeMetal]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 500;
    let height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 2.2, 5.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Studio lighting (bright white reflections for metals)
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.8);
    fillLight.position.set(-5, 4, -3);
    scene.add(fillLight);

    const warmLight = new THREE.PointLight(0xffeedd, 1.5, 10);
    warmLight.position.set(0, 3, 2);
    scene.add(warmLight);

    const metalsGroup = new THREE.Group();

    // 1. Gold Ingot (Au) - Rich warm metallic yellow
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.98,
      roughness: 0.12,
    });
    const goldGeo = new THREE.BoxGeometry(0.9, 0.45, 1.4);
    const goldMesh = new THREE.Mesh(goldGeo, goldMat);
    goldMesh.position.set(-1.8, 0, 0);
    metalsGroup.add(goldMesh);

    // 2. Silver Ingot (Ag) - Pure mirror chrome
    const silverMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.96,
      roughness: 0.08,
    });
    const silverGeo = new THREE.BoxGeometry(0.9, 0.45, 1.4);
    const silverMesh = new THREE.Mesh(silverGeo, silverMat);
    silverMesh.position.set(-0.6, 0, 0);
    metalsGroup.add(silverMesh);

    // 3. Copper Ingot (Cu) - Deep reddish-bronze
    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xc2410c,
      metalness: 0.92,
      roughness: 0.18,
    });
    const copperGeo = new THREE.BoxGeometry(0.9, 0.45, 1.4);
    const copperMesh = new THREE.Mesh(copperGeo, copperMat);
    copperMesh.position.set(0.6, 0, 0);
    metalsGroup.add(copperMesh);

    // 4. Palladium Ingot (Pd) - Platinum silvery-blue sheen
    const palladiumMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.95,
      roughness: 0.1,
    });
    const palladiumGeo = new THREE.BoxGeometry(0.9, 0.45, 1.4);
    const palladiumMesh = new THREE.Mesh(palladiumGeo, palladiumMat);
    palladiumMesh.position.set(1.8, 0, 0);
    metalsGroup.add(palladiumMesh);

    scene.add(metalsGroup);

    // Ground platform shadow
    const floorGeo = new THREE.PlaneGeometry(8, 6);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.08 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    scene.add(floor);

    let animId: number;
    let t = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.015;

      metalsGroup.rotation.y = Math.sin(t * 0.4) * 0.25;

      // Floating gentle oscillation
      goldMesh.position.y = Math.sin(t + 0) * 0.08;
      silverMesh.position.y = Math.sin(t + 1.2) * 0.08;
      copperMesh.position.y = Math.sin(t + 2.4) * 0.08;
      palladiumMesh.position.y = Math.sin(t + 3.6) * 0.08;

      goldMesh.rotation.y = Math.sin(t * 0.5) * 0.15;
      silverMesh.rotation.y = Math.sin(t * 0.5 + 1) * 0.15;
      copperMesh.rotation.y = Math.sin(t * 0.5 + 2) * 0.15;
      palladiumMesh.rotation.y = Math.sin(t * 0.5 + 3) * 0.15;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 500;
      height = container.clientHeight || 320;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
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

  return <div ref={containerRef} className="w-full h-full min-h-[220px]" />;
}
