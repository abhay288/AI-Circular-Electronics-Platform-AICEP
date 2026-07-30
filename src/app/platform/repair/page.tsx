"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TechBadge from "@/components/ui/TechBadge";
import { Wrench, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

export default function RepairPage() {
  const [selectedDiagnostic, setSelectedDiagnostic] = useState("LM358");

  return (
    <main className="relative flex flex-col min-h-screen bg-[#F1F5F9]">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-32 pb-16 bg-[#0F172A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[#60A5FA] text-xs font-mono font-bold w-fit">
              <Wrench className="w-4 h-4" />
              <span>MODULE 06 · AI FAULT DIAGNOSTICS & REFLOW RECOMMENDATIONS</span>
            </div>
            <h1 className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tight">
              AI Repair Intelligence
            </h1>
            <p className="text-slate-300 text-base max-w-2xl leading-relaxed">
              Automated soldering fault diagnostics, component reflow instructions, and decision engines categorizing hardware into Reuse, Repair, Replace, or Recycle.
            </p>
          </div>
        </div>
      </section>

      {/* Diagnostic Decision Matrix Workbench */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left AI Recommendation Cards */}
            <div className="lg:col-span-7 glass-card p-8 space-y-6">
              <span className="font-mono text-xs font-bold text-[#2563EB]">AI FAULT DIAGNOSTIC DECISION MATRIX</span>

              <div className="space-y-4">
                <div className="p-6 rounded-2xl bg-white border-2 border-[#16A34A] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#16A34A] uppercase">RECOMMENDATION: REUSE AS IS</span>
                    <TechBadge label="Priority: LOW" variant="green" />
                  </div>
                  <h4 className="font-heading text-lg font-bold text-[#0F172A]">LM358 Dual Op-Amp IC</h4>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Solder joints intact. Zero thermal stress cracks detected. Component certified for direct reuse in secondary electronics manufacturing.
                  </p>
                  <div className="pt-2 flex justify-between text-xs font-mono">
                    <span className="text-[#64748B]">Estimated Cost: $0.00</span>
                    <span className="text-[#16A34A] font-bold">14.2 kg CO₂ Saved</span>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white border-2 border-[#2563EB] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#2563EB] uppercase">RECOMMENDATION: SOLDER REFLOW REPAIR</span>
                    <TechBadge label="Priority: MEDIUM" variant="blue" />
                  </div>
                  <h4 className="font-heading text-lg font-bold text-[#0F172A]">ATmega328P Microcontroller</h4>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Mild micro-cracks on Pin 14 solder pad. Thermal reflow at 240°C for 45 seconds will restore full electrical connectivity.
                  </p>
                  <div className="pt-2 flex justify-between text-xs font-mono">
                    <span className="text-[#64748B]">Estimated Cost: $14.50</span>
                    <span className="text-[#2563EB] font-bold">18.6 kg CO₂ Saved</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Industrial Reflow Instructions */}
            <div className="lg:col-span-5 glass-card p-8 space-y-6">
              <span className="font-mono text-xs font-bold text-[#0F172A]">AUTOMATED REFLOW GUIDELINES</span>

              <div className="p-6 rounded-2xl bg-[#0F172A] text-white space-y-4 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Reflow Temp Peak</span>
                  <span className="text-[#60A5FA] font-bold">245°C ± 5°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Preheat Soak Time</span>
                  <span className="text-[#60A5FA] font-bold">90 Seconds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Flux Type</span>
                  <span className="text-[#60A5FA] font-bold">No-Clean RMA Type</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cooling Ramp Rate</span>
                  <span className="text-[#60A5FA] font-bold">4°C / Second</span>
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
