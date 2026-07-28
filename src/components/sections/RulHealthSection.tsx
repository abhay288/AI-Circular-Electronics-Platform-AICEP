"use client";

import React, { useState } from "react";
import SectionHeader from "@/components/ui/SectionHeader";
import GlassCard from "@/components/ui/GlassCard";
import TechBadge from "@/components/ui/TechBadge";
import { Activity, Clock, Flame, Sliders, ShieldAlert, Cpu } from "lucide-react";

export default function RulHealthSection() {
  const [thermalStress, setThermalStress] = useState(45); // Degrees C
  const [clockSpeed, setClockSpeed] = useState(3.8); // GHz

  // Dynamic RUL calculations based on stress physics model
  const baseLifespanHours = 50000;
  const calculatedHealthPercent = Math.max(
    20,
    Math.min(99, Math.round(100 - (thermalStress - 25) * 0.8 - (clockSpeed - 2.5) * 8))
  );
  const remainingYears = ((baseLifespanHours * (calculatedHealthPercent / 100)) / 8760).toFixed(1);

  return (
    <section id="rul-metals" className="py-24 relative overflow-hidden bg-[#04070E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <SectionHeader
          badge="PHYSICS-INFORMED MACHINE LEARNING"
          title="Predictive Remaining Useful Life (RUL)"
          subtitle="Combining electro-thermal physics simulations with deep learning to calculate exact component degradation curves across decades of operational stress."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Circular Neon Health Meter */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <GlassCard glow="cyan" className="p-8 w-full flex flex-col items-center text-center">
              <span className="font-mono text-xs text-[#00E6FF] uppercase tracking-wider mb-6">
                Live Diagnostic Health Gauge
              </span>

              {/* Circular SVG Gauge */}
              <div className="relative w-64 h-64 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Outer Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  {/* Glowing Animated Progress Arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="#00E6FF"
                    strokeWidth="8"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * calculatedHealthPercent) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out shadow-[0_0_20px_#00E6FF]"
                  />
                </svg>

                {/* Center Content readout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-4xl font-extrabold text-[#F5F8FF]">
                    {calculatedHealthPercent}%
                  </span>
                  <span className="text-xs font-mono text-[#00FF99] mt-1">HEALTH GRADE A+</span>
                  <span className="text-[11px] text-[#8A97B5] mt-1 font-mono">
                    ~{remainingYears} Yrs Operational
                  </span>
                </div>
              </div>

              {/* Status summary */}
              <div className="w-full pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-[#8A97B5]">
                <span>Failure Risk: &lt; 0.02%</span>
                <span className="text-[#00E6FF]">50,000 Hr Baseline</span>
              </div>
            </GlassCard>
          </div>

          {/* Interactive Stress Controls & Degradation Curve */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <GlassCard glow="purple" className="p-8">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#6C63FF]" />
                  <h3 className="font-heading text-lg font-bold text-white">
                    Telemetry Stress Simulator
                  </h3>
                </div>
                <TechBadge label="Physics-ML Engine" variant="purple" />
              </div>

              <div className="py-6 space-y-6">
                {/* Thermal Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#8A97B5] flex items-center gap-2">
                      <Flame className="w-4 h-4 text-[#FF3366]" /> Operating Temperature
                    </span>
                    <span className="text-white font-bold">{thermalStress} °C</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="95"
                    value={thermalStress}
                    onChange={(e) => setThermalStress(Number(e.target.value))}
                    className="w-full accent-[#00E6FF] cursor-pointer"
                  />
                </div>

                {/* Clock Speed Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#8A97B5] flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#00E6FF]" /> Clock Frequency
                    </span>
                    <span className="text-white font-bold">{clockSpeed} GHz</span>
                  </div>
                  <input
                    type="range"
                    min="1.5"
                    max="5.2"
                    step="0.1"
                    value={clockSpeed}
                    onChange={(e) => setClockSpeed(Number(e.target.value))}
                    className="w-full accent-[#6C63FF] cursor-pointer"
                  />
                </div>

                {/* Timeline Degradation Bars */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <span className="text-xs font-mono text-[#8A97B5] block">
                    Degradation Timeline Curve Across 10 Years
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {[100, 94, 87, 80, calculatedHealthPercent].map((hp, idx) => (
                      <div key={`yr-${idx}`} className="flex flex-col items-center gap-1">
                        <div className="w-full h-16 bg-white/5 rounded-lg border border-white/10 flex items-end p-1">
                          <div
                            className="w-full bg-gradient-to-t from-[#6C63FF] to-[#00E6FF] rounded transition-all duration-500"
                            style={{ height: `${hp}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-[#8A97B5]">Yr {idx * 2 + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}
