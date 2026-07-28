"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import SectionHeader from "@/components/ui/SectionHeader";
import GlassCard from "@/components/ui/GlassCard";
import GlowingButton from "@/components/ui/GlowingButton";
import { Zap, RefreshCw, CheckCircle2, AlertTriangle, Layers, Cpu } from "lucide-react";

const PcbReconstructionScene = dynamic(
  () => import("@/components/3d/PcbReconstructionScene"),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#0A1325]/40 rounded-2xl" /> }
);

export default function PcbReconstructionSection() {
  const [isReconstructed, setIsReconstructed] = useState(false);

  return (
    <section id="pcb-reconstruction" className="py-24 relative overflow-hidden bg-[#0A1325]/40 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        <SectionHeader
          badge="HOLOGRAPHIC NEURAL RECONSTRUCTION"
          title="Generative PCB Topology Restoration"
          subtitle="Transform physically severed copper traces and missing micro-vias into fully operable CAD schema vectors using EcoIntel's generative graph neural networks."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Control Panel & Controls */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <GlassCard glow="green" className="p-8">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <span className="font-mono text-xs text-[#00FF99] uppercase tracking-wider">
                  Reconstruction Engine
                </span>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#00FF99]/10 text-[#00FF99]">
                  {isReconstructed ? "Status: RECONSTRUCTED" : "Status: SEVERED PCB SCAN"}
                </span>
              </div>

              <div className="py-6 space-y-6">
                <div>
                  <h3 className="font-heading text-2xl font-bold text-[#F5F8FF] mb-2">
                    {isReconstructed
                      ? "AI Copper Trace Topology Generated"
                      : "Corrupted Board Surface Detected"}
                  </h3>
                  <p className="text-xs text-[#8A97B5] leading-relaxed">
                    {isReconstructed
                      ? "EcoIntel's Iron-Man style holographic netlist engine has bridged 42 broken conductive channels and mapped replacement jumper schematics."
                      : "Severe thermal corrosion and trace breakage detected across Layer 3 copper ground plane. 14 micro-vias disconnected."}
                  </p>
                </div>

                {/* Reconstruction Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[11px] font-mono text-[#8A97B5] block">Trace Continuity</span>
                    <span className={`font-mono text-lg font-bold ${isReconstructed ? "text-[#00FF99]" : "text-[#FF3366]"}`}>
                      {isReconstructed ? "100.0%" : "54.2% Severed"}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[11px] font-mono text-[#8A97B5] block">Signal Integrity</span>
                    <span className={`font-mono text-lg font-bold ${isReconstructed ? "text-[#00E6FF]" : "text-[#8A97B5]"}`}>
                      {isReconstructed ? "99.8 GHz Pass" : "Degraded"}
                    </span>
                  </div>
                </div>

                {/* Interactive State Toggle Button */}
                <GlowingButton
                  variant="primary"
                  glowColor={isReconstructed ? "green" : "cyan"}
                  onClick={() => setIsReconstructed(!isReconstructed)}
                  className="w-full py-4 text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isReconstructed ? "animate-spin" : ""}`} />
                  <span>{isReconstructed ? "Reset to Damaged PCB" : "Run AI Holographic Reconstruction"}</span>
                </GlowingButton>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center gap-2 text-xs font-mono text-[#8A97B5]">
                {isReconstructed ? (
                  <CheckCircle2 className="w-4 h-4 text-[#00FF99]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[#FF3366]" />
                )}
                <span>
                  {isReconstructed ? "Schematic exported to Gerber & KiCad CAD formats" : "Manual repair cost prohibitive without AI map"}
                </span>
              </div>
            </GlassCard>
          </div>

          {/* 3D Holographic Reconstruction HUD Canvas */}
          <div className="lg:col-span-7 h-[450px] relative rounded-3xl border border-white/10 bg-[#04070E] overflow-hidden p-2 shadow-2xl">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0A1325]/80 border border-[#00FF99]/40 backdrop-blur-md">
              <Zap className="w-4 h-4 text-[#00FF99] animate-pulse" />
              <span className="text-xs font-mono text-[#00FF99]">Holographic HUD Active</span>
            </div>

            <PcbReconstructionScene isReconstructed={isReconstructed} />
          </div>
        </div>
      </div>
    </section>
  );
}
