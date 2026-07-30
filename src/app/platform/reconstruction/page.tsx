"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TechBadge from "@/components/ui/TechBadge";
import { Layers, Download, CheckCircle2, RefreshCw, ArrowRight } from "lucide-react";

export default function ReconstructionPage() {
  const [reconstructing, setReconstructing] = useState(false);
  const [completed, setCompleted] = useState(true);

  return (
    <main className="relative flex flex-col min-h-screen bg-[#F1F5F9]">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-32 pb-16 bg-[#0F172A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[#60A5FA] text-xs font-mono font-bold w-fit">
              <Layers className="w-4 h-4" />
              <span>MODULE 02 · GENERATIVE GRAPH NEURAL TOPOLOGY (GGNT)</span>
            </div>
            <h1 className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tight">
              PCB Topology Reconstruction
            </h1>
            <p className="text-slate-300 text-base max-w-2xl leading-relaxed">
              Reconstructing damaged micro-traces on severed circuit boards to generate production-ready KiCad schematics and Gerber netlists automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Reconstruction Visualizer */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Damaged PCB (Before) */}
            <div className="lg:col-span-6 glass-card p-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#DC2626]">BEFORE: DAMAGED E-WASTE PCB</span>
                <TechBadge label="14 Severed Traces" variant="neutral" />
              </div>
              <div className="h-[300px] rounded-2xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-white">
                <span className="font-mono text-xs text-red-400 font-bold mb-2">● Copper Trace Discontinuities Detected</span>
                <span className="text-xs text-slate-400 max-w-xs">Layer 1 & Layer 3 severed due to mechanical stress during e-waste handling.</span>
              </div>
            </div>

            {/* Restored Gerber Netlist (After) */}
            <div className="lg:col-span-6 glass-card p-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#16A34A]">AFTER: RECONSTRUCTED GERBER CAD</span>
                <TechBadge label="100% Netlist Match" variant="green" />
              </div>
              <div className="h-[300px] rounded-2xl bg-gradient-to-br from-[#052E16] to-[#0F172A] border border-emerald-900 flex flex-col items-center justify-center p-6 text-center text-white">
                <CheckCircle2 className="w-10 h-10 text-[#4ADE80] mb-3 animate-pulse" />
                <span className="font-heading font-extrabold text-lg text-white">Generative CAD Restoration Complete</span>
                <span className="text-xs text-emerald-300 font-mono mt-1">Generated 6-Layer KiCad Schematic & Gerber Netlist</span>
              </div>
            </div>

          </div>

          {/* CAD Export Controls */}
          <div className="mt-8 glass-panel p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-heading text-lg font-bold text-[#0F172A]">Download Reconstructed CAD Assets</h3>
              <p className="text-xs text-[#64748B] font-mono">Compatible with Altium Designer, KiCad, Cadence Allegro, and Eagle CAD</p>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-3 rounded-full bg-[#0F172A] text-white text-xs font-mono font-bold inline-flex items-center gap-2 hover:bg-[#1E293B]">
                <Download className="w-4 h-4" />
                <span>Download Gerber ZIP</span>
              </button>
              <button className="px-6 py-3 rounded-full bg-white text-[#0F172A] border border-[#E2E8F0] text-xs font-mono font-bold inline-flex items-center gap-2 hover:bg-slate-50">
                <Download className="w-4 h-4 text-[#2563EB]" />
                <span>KiCad PCB File</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
