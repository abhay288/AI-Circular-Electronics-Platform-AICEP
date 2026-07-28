"use client";

import React from "react";
import dynamic from "next/dynamic";
import SectionHeader from "@/components/ui/SectionHeader";
import GlassCard from "@/components/ui/GlassCard";
import TechBadge from "@/components/ui/TechBadge";
import { Cpu, Terminal, Database, Code, Globe, Shield, Box } from "lucide-react";

const TechSphere3D = dynamic(
  () => import("@/components/3d/TechSphere3D"),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#04070E] rounded-2xl" /> }
);

const techStackList = [
  { name: "Next.js 15", category: "Frontend Framework", role: "SSR & Turbo Engine Architecture" },
  { name: "Three.js / R3F", category: "3D WebGL Shaders", role: "Interactive Holographic Renderers" },
  { name: "YOLOv8 AI", category: "Computer Vision", role: "Sub-millimeter PCB Defect Neural Model" },
  { name: "OpenCV", category: "Spatial Processing", role: "Optical Alignment & Spectrometry" },
  { name: "TensorFlow", category: "Predictive ML", role: "Remaining Useful Life (RUL) Physics Model" },
  { name: "FastAPI", category: "High-Speed Async API", role: "Micro-second Neural Pipeline Gateway" },
  { name: "MongoDB Atlas", category: "Document Database", role: "Global Component & PCB Schema Registry" },
  { name: "Polygon POS", category: "Blockchain Network", role: "Immutable Digital Product Passports" },
];

export default function TechStackSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-[#0A1325]/40 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <SectionHeader
          badge="ENTERPRISE HIGH-PERFORMANCE ARCHITECTURE"
          title="World-Class Deep Tech Stack"
          subtitle="EcoIntel synthesizes cutting-edge computer vision, physics-informed machine learning, high-frequency spatial graphics, and decentralized blockchain infrastructure."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* 3D Tech Sphere */}
          <div className="lg:col-span-5 h-[400px] relative rounded-3xl border border-white/10 bg-[#04070E] overflow-hidden p-2">
            <TechSphere3D />
          </div>

          {/* Technology Nodes Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {techStackList.map((item) => (
              <GlassCard key={item.name} glow="cyan" className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-[#00E6FF]">{item.category}</span>
                  <TechBadge label="Active Node" variant="blue" />
                </div>
                <h3 className="font-heading text-lg font-bold text-white mb-1">{item.name}</h3>
                <p className="text-xs text-[#8A97B5] font-mono">{item.role}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
