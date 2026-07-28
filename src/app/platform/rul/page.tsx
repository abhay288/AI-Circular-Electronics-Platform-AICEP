"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
import LabCard from "@/components/ui/LabCard";
import PrimaryButton from "@/components/ui/PrimaryButton";
import TechBadge from "@/components/ui/TechBadge";
import { Activity, Flame, Cpu, Sliders, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RemainingUsefulLifePage() {
  const [temp, setTemp] = useState(45);
  const [freq, setFreq] = useState(3.8);

  const healthPercent = Math.max(20, Math.min(99, Math.round(100 - (temp - 25) * 0.8 - (freq - 2.5) * 8)));
  const years = ((50000 * (healthPercent / 100)) / 8760).toFixed(1);

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
            badge="03 | PHYSICS-INFORMED MACHINE LEARNING"
            title="Predictive Remaining Useful Life (RUL)"
            subtitle="Physics-informed electro-thermal simulations calculate exact hardware degradation curves across operational decades."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 flex flex-col items-center">
              <LabCard className="p-8 w-full flex flex-col items-center text-center">
                <span className="font-mono text-xs text-[#2563EB] font-bold uppercase tracking-wider mb-6">
                  Live Diagnostic Gauge
                </span>

                <div className="relative w-60 h-60 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" stroke="#E2E8F0" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke="#2563EB"
                      strokeWidth="8"
                      strokeDasharray={264}
                      strokeDashoffset={264 - (264 * healthPercent) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono text-4xl font-bold text-[#0F172A]">{healthPercent}%</span>
                    <span className="text-xs font-mono text-[#16A34A] mt-1 font-bold">GRADE A+ HEALTH</span>
                    <span className="text-xs text-[#64748B] font-mono mt-1">~{years} Yrs Operational</span>
                  </div>
                </div>
              </LabCard>
            </div>

            <div className="lg:col-span-7">
              <LabCard className="p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                  <h3 className="font-heading text-lg font-bold text-[#0F172A]">Electro-Thermal Stress Telemetry</h3>
                  <TechBadge label="Physics-ML Engine" variant="blue" />
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#64748B] flex items-center gap-2">
                        <Flame className="w-4 h-4 text-[#DC2626]" /> Operating Temperature
                      </span>
                      <span className="text-[#0F172A] font-bold">{temp} °C</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="95"
                      value={temp}
                      onChange={(e) => setTemp(Number(e.target.value))}
                      className="w-full accent-[#2563EB] cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#64748B] flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-[#2563EB]" /> Clock Frequency
                      </span>
                      <span className="text-[#0F172A] font-bold">{freq} GHz</span>
                    </div>
                    <input
                      type="range"
                      min="1.5"
                      max="5.2"
                      step="0.1"
                      value={freq}
                      onChange={(e) => setFreq(Number(e.target.value))}
                      className="w-full accent-[#2563EB] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
                  <span className="text-xs font-mono text-[#64748B]">Degradation Curve Across 10 Years</span>
                  <div className="grid grid-cols-5 gap-2">
                    {[100, 93, 86, 79, healthPercent].map((hp, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className="w-full h-16 bg-[#F1F5F9] rounded-lg border border-[#E2E8F0] flex items-end p-1">
                          <div className="w-full bg-[#2563EB] rounded transition-all duration-500" style={{ height: `${hp}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-[#64748B]">Yr {i * 2 + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </LabCard>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
