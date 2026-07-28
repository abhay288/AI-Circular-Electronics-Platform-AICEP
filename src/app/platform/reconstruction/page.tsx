"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
import LabCard from "@/components/ui/LabCard";
import PrimaryButton from "@/components/ui/PrimaryButton";
import TechBadge from "@/components/ui/TechBadge";
import { Layers, RefreshCw, CheckCircle2, AlertTriangle, ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

export default function PcbReconstructionPage() {
  const [isReconstructed, setIsReconstructed] = useState(false);

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-[#2563EB] mb-6 hover:underline font-semibold">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Vision Overview</span>
          </Link>

          <SectionHeader
            badge="02 | GENERATIVE GRAPH NEURAL NETWORKS"
            title="PCB Topology Reconstruction Engine"
            subtitle="Bridge severed conductive channels, reconstruct corrupted multilayer micro-vias, and generate clean KiCad CAD schematics automatically."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-6">
              <LabCard className="p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                  <span className="font-mono text-xs font-bold text-[#0F172A] uppercase">
                    Generative Trace Netlist State
                  </span>
                  <TechBadge
                    label={isReconstructed ? "RECONSTRUCTED (100% PASS)" : "CORRUPTED PCB SCAN"}
                    variant={isReconstructed ? "green" : "neutral"}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="font-heading text-2xl font-bold text-[#0F172A]">
                    {isReconstructed
                      ? "AI Copper Trace Netlist Generated"
                      : "Corrupted Trace Ground Plane Detected"}
                  </h3>
                  <p className="text-sm text-[#475569] leading-relaxed">
                    {isReconstructed
                      ? "EcoIntel's neural graph synthesizer has bridged 42 broken conductive traces, restored Layer 3 micro-vias, and generated verified KiCad schematics."
                      : "Physical corrosion detected across ground plane traces. 14 micro-vias disconnected across memory controller bus."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-xs text-[#64748B] block font-mono">Trace Continuity</span>
                    <span className={`font-mono text-lg font-bold ${isReconstructed ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
                      {isReconstructed ? "100.0%" : "54.2% Severed"}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-xs text-[#64748B] block font-mono">Signal Integrity</span>
                    <span className={`font-mono text-lg font-bold ${isReconstructed ? "text-[#2563EB]" : "text-[#64748B]"}`}>
                      {isReconstructed ? "99.8 GHz Pass" : "Degraded"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                  <PrimaryButton
                    variant="primary"
                    size="md"
                    onClick={() => setIsReconstructed(!isReconstructed)}
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw className={`w-4 h-4 ${isReconstructed ? "animate-spin" : ""}`} />
                    <span>{isReconstructed ? "Reset to Corrupted State" : "Run Generative AI Reconstruction"}</span>
                  </PrimaryButton>

                  {isReconstructed && (
                    <PrimaryButton variant="outline" size="md" className="w-full sm:w-auto">
                      <Download className="w-4 h-4" />
                      <span>Export Gerber CAD</span>
                    </PrimaryButton>
                  )}
                </div>
              </LabCard>
            </div>

            <div className="lg:col-span-6 h-[400px] rounded-3xl bg-[#0F172A] p-8 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between z-10">
                <span className="font-mono text-xs text-[#60A5FA]">Generative PCB HUD</span>
                <span className="text-xs font-mono px-3 py-1 rounded bg-blue-500/20 text-blue-400">
                  Gerber v2.4 Format
                </span>
              </div>

              <div className="z-10 flex flex-col items-center justify-center text-center space-y-4 my-auto">
                <Layers className={`w-16 h-16 ${isReconstructed ? "text-emerald-400 animate-pulse" : "text-rose-400"}`} />
                <h4 className="font-heading text-xl font-bold">
                  {isReconstructed ? "Topology Vector Netlist Restored" : "Scanning Layer 3 Micro-Vias..."}
                </h4>
                <p className="text-xs font-mono text-slate-400 max-w-sm">
                  {isReconstructed
                    ? "Interactive 3D copper traces mapped to automated robotic micro-soldering jigs."
                    : "Severe electrical break detected across memory bus line."}
                </p>
              </div>

              <div className="z-10 pt-4 border-t border-slate-700 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Model: GGNT-PCB-v4</span>
                <span className="text-emerald-400 font-bold">Status: Ready for Manufacturing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
