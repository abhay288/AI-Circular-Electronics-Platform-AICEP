"use client";

import React, { useState } from "react";
import SectionHeader from "@/components/ui/SectionHeader";
import GlassCard from "@/components/ui/GlassCard";
import TechBadge from "@/components/ui/TechBadge";
import { Cpu, ShieldCheck, Zap, Activity, HardDrive, Database, Radio } from "lucide-react";

interface ComponentData {
  id: string;
  name: string;
  type: string;
  health: number;
  rul: string;
  material: string;
  confidence: number;
  pos: { top: string; left: string };
  spec: string;
}

const motherboardComponents: ComponentData[] = [
  {
    id: "cpu-die",
    name: "Apple/ARM Architecture SoC Core",
    type: "Processor",
    health: 96,
    rul: "4.2 Years (36,800 Hrs)",
    material: "99.99% Gold Pin Arrays, Silicon Die",
    confidence: 99.4,
    pos: { top: "42%", left: "48%" },
    spec: "3.4 GHz 12-Core, 5nm Process",
  },
  {
    id: "vram-chip",
    name: "GDDR6X Ultra VRAM Module",
    type: "Memory Component",
    health: 91,
    rul: "3.5 Years (30,600 Hrs)",
    material: "Copper Traces, Silver Solder",
    confidence: 98.8,
    pos: { top: "30%", left: "62%" },
    spec: "16 GB Bandwidth 936 GB/s",
  },
  {
    id: "power-vrm",
    name: "DrMOS Power Stage MOSFET",
    type: "Power Regulator",
    health: 84,
    rul: "2.1 Years (18,400 Hrs)",
    material: "Palladium Alloy, Heavy Copper",
    confidence: 97.9,
    pos: { top: "25%", left: "35%" },
    spec: "70A High-Current Phase",
  },
  {
    id: "capacitor-bank",
    name: "Solid Polymer Capacitor Array",
    type: "Filtering Capacitor",
    health: 79,
    rul: "1.8 Years (15,700 Hrs)",
    material: "Tantalum, Aluminum Foil",
    confidence: 99.1,
    pos: { top: "60%", left: "38%" },
    spec: "820uF 6.3V Ultra-Low ESR",
  },
  {
    id: "southbridge",
    name: "High-Speed I/O Controller IC",
    type: "Chipset",
    health: 94,
    rul: "3.9 Years (34,100 Hrs)",
    material: "Gold Wire Bonds, Copper Pad",
    confidence: 98.5,
    pos: { top: "65%", left: "65%" },
    spec: "PCIe Gen 5.0 x16 Bus Controller",
  },
];

export default function ComponentDetectionSection() {
  const [activeComponent, setActiveComponent] = useState<ComponentData>(motherboardComponents[0]);

  return (
    <section id="component-detection" className="py-24 relative overflow-hidden bg-[#04070E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <SectionHeader
          badge="COMPUTER VISION & NEURAL SPECTROMETRY"
          title="Sub-Millimeter AI Component Detection"
          subtitle="EcoIntel's high-speed spatial neural model identifies, measures, and diagnoses individual PCB components down to 50 microns in under 120 milliseconds."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Interactive Motherboard Scanner Simulation */}
          <div className="lg:col-span-7 relative aspect-[4/3] rounded-3xl border border-white/10 bg-[#0A1325]/80 backdrop-blur-xl overflow-hidden p-4 shadow-2xl">
            {/* Grid Laser Scanner Overlay */}
            <div className="absolute inset-0 bg-circuit-grid opacity-40" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00E6FF] to-transparent animate-radar-sweep shadow-[0_0_20px_#00E6FF]" />

            {/* Motherboard Visual Graphic Representation */}
            <div className="relative w-full h-full rounded-2xl bg-[#08101F] border border-white/5 flex items-center justify-center overflow-hidden">
              {/* Motherboard Board Graphics Lines */}
              <div className="absolute inset-4 border border-[#00E6FF]/20 rounded-xl pointer-events-none" />
              <div className="absolute inset-12 border border-white/5 rounded-lg pointer-events-none" />

              {/* Interactive Target Points */}
              {motherboardComponents.map((comp) => {
                const isSelected = activeComponent.id === comp.id;
                return (
                  <button
                    key={comp.id}
                    onClick={() => setActiveComponent(comp)}
                    onMouseEnter={() => setActiveComponent(comp)}
                    style={{ top: comp.pos.top, left: comp.pos.left }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-full transition-all duration-300 group cursor-pointer ${
                      isSelected
                        ? "bg-[#00E6FF]/30 border-2 border-[#00E6FF] shadow-[0_0_25px_#00E6FF]"
                        : "bg-white/10 border border-white/30 hover:border-[#00E6FF]"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isSelected ? "bg-[#00E6FF]" : "bg-white/60"}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#04070E]" />
                    </div>
                    {/* Ripple Ping */}
                    {isSelected && (
                      <span className="absolute inset-0 rounded-full border border-[#00E6FF] animate-ping" />
                    )}
                  </button>
                );
              })}

              {/* Central Scanner Label */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#04070E]/80 border border-[#00E6FF]/30 backdrop-blur-md">
                <Radio className="w-3.5 h-3.5 text-[#00E6FF] animate-pulse" />
                <span className="text-[11px] font-mono text-[#00E6FF]">YOLOv8-EcoPCB Spectrometer Live</span>
              </div>
            </div>
          </div>

          {/* Holographic Diagnostic Data Card */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <GlassCard glow="cyan" className="p-8">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#00E6FF]" />
                  <span className="font-mono text-xs uppercase tracking-widest text-[#00E6FF]">
                    {activeComponent.type}
                  </span>
                </div>
                <TechBadge label={`${activeComponent.confidence}% AI Match`} variant="green" />
              </div>

              <div className="py-6 space-y-4">
                <h3 className="font-heading text-2xl font-bold text-[#F5F8FF]">
                  {activeComponent.name}
                </h3>
                <p className="text-xs font-mono text-[#8A97B5]">
                  Specification: <span className="text-white">{activeComponent.spec}</span>
                </p>

                {/* Health Score Progress */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#8A97B5]">Health Score</span>
                    <span className="text-[#00FF99] font-bold">{activeComponent.health}% (Optimal)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#00E6FF] to-[#00FF99] transition-all duration-500"
                      style={{ width: `${activeComponent.health}%` }}
                    />
                  </div>
                </div>

                {/* Remaining Useful Life */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-[#00E6FF]" />
                    <span className="text-xs text-[#8A97B5]">Estimated Remaining Life</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-[#00E6FF]">
                    {activeComponent.rul}
                  </span>
                </div>

                {/* Material Composition */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-[#6C63FF]" />
                    <span className="text-xs text-[#8A97B5]">Precious Materials</span>
                  </div>
                  <span className="font-mono text-xs text-[#F5F8FF]">
                    {activeComponent.material}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-[#8A97B5] font-mono border-t border-white/10">
                <span className="flex items-center gap-1.5 text-[#00FF99]">
                  <ShieldCheck className="w-4 h-4" />
                  Eligible for Direct Reuse
                </span>
                <span>Component ID: EINT-993A</span>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}
