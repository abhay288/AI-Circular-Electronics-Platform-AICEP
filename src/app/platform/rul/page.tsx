"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TechBadge from "@/components/ui/TechBadge";
import { Activity, Sliders, Play, CheckCircle2 } from "lucide-react";

export default function RULPage() {
  const [temp, setTemp] = useState(45);
  const [voltage, setVoltage] = useState(3.3);
  const [cycles, setCycles] = useState(12000);

  // Electro-Thermal Physics RUL Simulation Math
  const tempFactor = Math.max(0.2, 1 - temp / 120);
  const voltFactor = Math.max(0.3, 1 - Math.abs(voltage - 3.3) / 5);
  const cycleFactor = Math.max(0.4, 1 - cycles / 50000);
  
  const predictedHours = Math.round(60000 * tempFactor * voltFactor * cycleFactor);
  const predictedYears = +(predictedHours / 8760).toFixed(1);
  const healthScore = Math.min(100, Math.round((predictedHours / 60000) * 100));

  return (
    <main className="relative flex flex-col min-h-screen bg-[#F1F5F9]">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-32 pb-16 bg-[#0F172A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[#60A5FA] text-xs font-mono font-bold w-fit">
              <Activity className="w-4 h-4" />
              <span>MODULE 03 · PHYSICS-INFORMED ELECTRO-THERMAL ML</span>
            </div>
            <h1 className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tight">
              Remaining Useful Life (RUL)
            </h1>
            <p className="text-slate-300 text-base max-w-2xl leading-relaxed">
              Physics-informed ML models predicting operational lifespan hours, silicon degradation, and failure probability before hardware deployment.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Simulation Sliders & Gauge Panel */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left Controls */}
            <div className="lg:col-span-6 glass-card p-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#2563EB]">ELECTRO-THERMAL STRESS SIMULATOR</span>
                <Sliders className="w-4 h-4 text-[#2563EB]" />
              </div>

              {/* Temp Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#0F172A] font-bold">Operating Temperature (°C)</span>
                  <span className="text-[#2563EB] font-extrabold">{temp}°C</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="110"
                  value={temp}
                  onChange={(e) => setTemp(+e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
                />
              </div>

              {/* Voltage Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#0F172A] font-bold">Supply Voltage (V)</span>
                  <span className="text-[#2563EB] font-extrabold">{voltage}V</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="6.0"
                  step="0.1"
                  value={voltage}
                  onChange={(e) => setVoltage(+e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
                />
              </div>

              {/* Cycles Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#0F172A] font-bold">Operational Cycles</span>
                  <span className="text-[#2563EB] font-extrabold">{cycles.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="1000"
                  value={cycles}
                  onChange={(e) => setCycles(+e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
                />
              </div>
            </div>

            {/* Right Output Prediction Gauge */}
            <div className="lg:col-span-6 glass-card p-8 space-y-6 flex flex-col justify-between">
              <span className="font-mono text-xs font-bold text-[#16A34A]">PHYSICS ML PREDICTION RESULT</span>

              <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-gradient-to-br from-[#EFF6FF] to-[#DCFCE7]/50 border border-[#BFDBFE] text-center space-y-2">
                <span className="text-5xl font-mono font-extrabold text-[#0F172A]">{healthScore}%</span>
                <span className="font-mono text-xs font-bold text-[#16A34A] uppercase">Estimated Health Score</span>
                <div className="pt-4 flex items-center gap-6">
                  <div>
                    <span className="text-2xl font-mono font-bold text-[#2563EB] block">{predictedHours.toLocaleString()}</span>
                    <span className="text-[10px] font-mono text-[#64748B]">Remaining Hours</span>
                  </div>
                  <div className="h-8 w-px bg-slate-300" />
                  <div>
                    <span className="text-2xl font-mono font-bold text-[#2563EB] block">{predictedYears} Yrs</span>
                    <span className="text-[10px] font-mono text-[#64748B]">Lifespan Baseline</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-between text-xs font-mono">
                <span className="text-[#64748B]">Physics Failure Probability</span>
                <span className="font-bold text-[#DC2626]">{((100 - healthScore) / 100).toFixed(2)}</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
