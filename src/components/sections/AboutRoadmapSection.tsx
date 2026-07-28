"use client";

import React from "react";
import SectionHeader from "@/components/ui/SectionHeader";
import GlassCard from "@/components/ui/GlassCard";
import TechBadge from "@/components/ui/TechBadge";
import { Target, Compass, Award, Lightbulb, CheckCircle2, ChevronRight } from "lucide-react";

const roadmapPhases = [
  {
    phase: "Phase 1: Q1 2025",
    title: "Sub-Millimeter Neural Vision Launch",
    status: "Completed",
    desc: "Deployment of YOLOv8 spectro-spatial models across 12 partner e-waste facilities in Tokyo and Berlin.",
  },
  {
    phase: "Phase 2: Q3 2025",
    title: "Generative PCB Topology HUD",
    status: "Active Deployment",
    desc: "Automated Gerber CAD export for severed copper traces with robotic soldering micro-jig integration.",
  },
  {
    phase: "Phase 3: Q1 2026",
    title: "Polygon Component Passport Protocol",
    status: "Scale",
    desc: "Cross-border B2B hardware marketplace launch with zero-knowledge proof supply chain verification.",
  },
  {
    phase: "Phase 4: Q4 2026",
    title: "Autonomous Hydro-Refinery Robotics",
    status: "Patent Pending",
    desc: "Fully autonomous robotic disassembly cells for server motherboards with 99.8% precious metal extraction.",
  },
];

export default function AboutRoadmapSection() {
  return (
    <section id="about" className="py-24 relative overflow-hidden bg-[#04070E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <SectionHeader
          badge="MISSION & PATENT PORTFOLIO"
          title="Transforming E-Waste Into a Sovereign Digital Asset"
          subtitle="EcoIntel is building the intelligence layer for the circular electronics economy—replacing primitive shredding with high-precision AI component extraction."
        />

        {/* Mission & Vision Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <GlassCard glow="cyan" className="p-8">
            <div className="w-12 h-12 rounded-2xl bg-[#00E6FF]/10 border border-[#00E6FF]/30 flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-[#00E6FF]" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-white mb-3">Enterprise Mission</h3>
            <p className="text-sm text-[#8A97B5] leading-relaxed">
              To eliminate global e-waste by giving every manufactured circuit board an AI-powered second life through sub-millimeter component detection, automated trace reconstruction, and decentralized product passports.
            </p>
          </GlassCard>

          <GlassCard glow="green" className="p-8">
            <div className="w-12 h-12 rounded-2xl bg-[#00FF99]/10 border border-[#00FF99]/30 flex items-center justify-center mb-6">
              <Compass className="w-6 h-6 text-[#00FF99]" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-white mb-3">Patent-Pending Innovation</h3>
            <p className="text-sm text-[#8A97B5] leading-relaxed">
              Our proprietary Generative Graph Neural Topology (GGNT) algorithm maps corrupted conductive layers and reconstructs missing schematics in real-time—protected under international PCT patent applications.
            </p>
          </GlassCard>
        </div>

        {/* Interactive Cyber Timeline */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-[#00E6FF]" />
            <h3 className="font-heading text-xl font-bold text-white">Future Innovation Roadmap</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {roadmapPhases.map((rp, idx) => (
              <GlassCard key={rp.phase} glow="purple" className="p-6">
                <span className="font-mono text-xs text-[#6C63FF] block mb-2">{rp.phase}</span>
                <h4 className="font-heading text-base font-bold text-white mb-2">{rp.title}</h4>
                <p className="text-xs text-[#8A97B5] leading-relaxed mb-4">{rp.desc}</p>
                <TechBadge label={rp.status} variant={idx === 1 ? "blue" : "neutral"} />
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
