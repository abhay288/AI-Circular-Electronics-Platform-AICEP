"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
import TechBadge from "@/components/ui/TechBadge";
import { Cpu, Upload, CheckCircle2, ShieldCheck, ArrowRight, Activity } from "lucide-react";

export default function DetectionPage() {
  const [selectedChip, setSelectedChip] = useState("LM358");

  const detectedChips = [
    { id: "LM358", name: "LM358 Dual Op-Amp IC", package: "SOP-8", mfr: "Texas Instruments", health: "92%", rul: "6.4 Yrs", conf: "99.2%", status: "Polygon Verified" },
    { id: "ATmega328P", name: "ATmega328P Microcontroller", package: "TQFP-32", mfr: "Microchip Tech", health: "88%", rul: "5.2 Yrs", conf: "98.7%", status: "Polygon Verified" },
    { id: "Cap220uF", name: "Solid Polymer Capacitor", package: "SMD-6.3", mfr: "Nichicon", health: "95%", rul: "8.0 Yrs", conf: "97.5%", status: "Polygon Verified" },
  ];

  return (
    <main className="relative flex flex-col min-h-screen bg-[#F1F5F9]">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-32 pb-16 bg-[#0F172A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[#60A5FA] text-xs font-mono font-bold w-fit">
              <Cpu className="w-4 h-4" />
              <span>MODULE 01 · YOLOv11 & RT-DETR 50-MICRON AI VISION</span>
            </div>
            <h1 className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tight">
              AI Component Detection
            </h1>
            <p className="text-slate-300 text-base max-w-2xl leading-relaxed">
              Sub-millimeter spectro-spatial neural vision pipeline detecting microchips, SMD capacitors, MOSFETs, and relays from high-volume e-waste streams.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Detection Workbench */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left Upload & Bounding Box Viewer */}
            <div className="lg:col-span-7 glass-card p-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#2563EB]">INTERACTIVE PCB INSPECTION WORKBENCH</span>
                <TechBadge label="99.2% Vision Confidence" variant="blue" />
              </div>

              {/* PCB Inspection Display Frame */}
              <div className="relative h-[380px] rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#1E293B] border border-slate-800 flex items-center justify-center p-6 text-center text-white overflow-hidden shadow-inner">
                
                {/* Bounding Box Highlights */}
                <div className="absolute top-1/4 left-1/4 p-3 rounded-xl border-2 border-[#16A34A] bg-[#16A34A]/20 cursor-pointer animate-pulse" onClick={() => setSelectedChip("LM358")}>
                  <span className="font-mono text-[10px] font-bold text-[#4ADE80]">LM358 (99.2%)</span>
                </div>

                <div className="absolute top-1/3 right-1/4 p-4 rounded-xl border-2 border-[#2563EB] bg-[#2563EB]/20 cursor-pointer" onClick={() => setSelectedChip("ATmega328P")}>
                  <span className="font-mono text-[10px] font-bold text-[#60A5FA]">ATmega328P (98.7%)</span>
                </div>

                <div className="flex flex-col items-center space-y-3 pointer-events-none">
                  <Cpu className="w-12 h-12 text-[#60A5FA] animate-bounce" />
                  <span className="font-heading font-extrabold text-lg">Hover / Click Component Bounding Box</span>
                  <span className="text-xs text-slate-400 font-mono">50 Micron Spectro-Spatial Neural Feed Online</span>
                </div>
              </div>

              {/* Upload Drop Zone */}
              <div className="border-2 border-dashed border-[#BFDBFE] rounded-2xl p-6 text-center bg-[#EFF6FF]/40 hover:bg-[#EFF6FF] transition-colors cursor-pointer flex flex-col items-center gap-2">
                <Upload className="w-6 h-6 text-[#2563EB]" />
                <span className="text-xs font-bold text-[#0F172A]">Upload Custom PCB Batch Image (JPG / PNG / TIFF)</span>
                <span className="text-[10px] font-mono text-[#64748B]">Supports high-resolution 4K optical & X-ray spectrometry feeds</span>
              </div>
            </div>

            {/* Right Selected Component Inspector Panel */}
            <div className="lg:col-span-5 glass-card p-8 space-y-6">
              <span className="font-mono text-xs font-bold text-[#2563EB]">COMPONENT TELEMETRY INSPECTOR</span>
              
              {detectedChips.filter(c => c.id === selectedChip || selectedChip === "LM358").slice(0, 1).map((chip) => (
                <div key={chip.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-xl font-bold text-[#0F172A]">{chip.name}</h3>
                    <TechBadge label={chip.status} variant="green" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-4 rounded-xl bg-white border border-[#E2E8F0]">
                      <span className="text-[10px] font-mono text-[#64748B] block">Package Type</span>
                      <span className="font-mono font-bold text-sm text-[#0F172A]">{chip.package}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-[#E2E8F0]">
                      <span className="text-[10px] font-mono text-[#64748B] block">Manufacturer</span>
                      <span className="font-mono font-bold text-sm text-[#0F172A]">{chip.mfr}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-[#E2E8F0]">
                      <span className="text-[10px] font-mono text-[#64748B] block">Health Score</span>
                      <span className="font-mono font-bold text-sm text-[#16A34A]">{chip.health}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-[#E2E8F0]">
                      <span className="text-[10px] font-mono text-[#64748B] block">Remaining Life</span>
                      <span className="font-mono font-bold text-sm text-[#2563EB]">{chip.rul}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-between text-xs font-mono">
                    <span className="text-[#2563EB] font-bold">Detection Model Confidence</span>
                    <span className="font-extrabold text-[#0F172A]">{chip.conf}</span>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-slate-200">
                <span className="text-xs font-mono text-[#64748B] block mb-3">Model Architecture Pipeline</span>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-white border text-[10px] font-mono text-[#0F172A] font-bold">YOLOv11-x</span>
                  <span className="px-3 py-1 rounded-full bg-white border text-[10px] font-mono text-[#0F172A] font-bold">RT-DETR-L</span>
                  <span className="px-3 py-1 rounded-full bg-white border text-[10px] font-mono text-[#0F172A] font-bold">SAM Segmentation</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
