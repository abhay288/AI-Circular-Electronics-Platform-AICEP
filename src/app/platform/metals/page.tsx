"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TechBadge from "@/components/ui/TechBadge";
import DynamicMetallicCubes from "@/components/3d/MetallicCubes3D";
import { Coins, ArrowRight, TrendingUp } from "lucide-react";

export default function MetalsPage() {
  const [pcbWeight, setPcbWeight] = useState(10); // 10 kg e-waste batch

  const metalsData = [
    { symbol: "Au", name: "Gold (79)", rateUSD: 78.40, yieldKg: +(pcbWeight * 0.00032).toFixed(4), valueUSD: +(pcbWeight * 0.32 * 78.40).toFixed(2), bg: "bg-[#FEF9C3]", color: "text-[#C9A227]" },
    { symbol: "Ag", name: "Silver (47)", rateUSD: 0.95, yieldKg: +(pcbWeight * 0.0015).toFixed(4), valueUSD: +(pcbWeight * 1.5 * 0.95).toFixed(2), bg: "bg-[#F1F5F9]", color: "text-[#475569]" },
    { symbol: "Cu", name: "Copper (29)", rateUSD: 0.009, yieldKg: +(pcbWeight * 0.018).toFixed(4), valueUSD: +(pcbWeight * 18 * 0.009).toFixed(2), bg: "bg-[#FFF7ED]", color: "text-[#EA580C]" },
    { symbol: "Pd", name: "Palladium (46)", rateUSD: 49.20, yieldKg: +(pcbWeight * 0.000045).toFixed(5), valueUSD: +(pcbWeight * 0.045 * 49.20).toFixed(2), bg: "bg-[#EFF6FF]", color: "text-[#2563EB]" },
  ];

  const totalBatchValue = metalsData.reduce((acc, m) => acc + m.valueUSD, 0).toFixed(2);

  return (
    <main className="relative flex flex-col min-h-screen bg-[#F1F5F9]">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-32 pb-16 bg-[#0F172A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#FBBF24] text-xs font-mono font-bold w-fit">
              <Coins className="w-4 h-4" />
              <span>MODULE 04 · URBAN MINING SPECTROMETRY</span>
            </div>
            <h1 className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tight">
              Precious Metal Intelligence
            </h1>
            <p className="text-slate-300 text-base max-w-2xl leading-relaxed">
              Optical emission spectrometry calculating recoverable Gold, Silver, Copper, and Palladium yields before pyrometallurgical processing.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Yield Calculator & 3D Cubes */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Left 3D PBR Metal Cubes */}
            <div className="lg:col-span-6 h-[420px] glass-panel overflow-hidden">
              <DynamicMetallicCubes />
            </div>

            {/* Right Calculator & Metal Table */}
            <div className="lg:col-span-6 glass-card p-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#D97706]">E-WASTE BATCH WEIGHT CALCULATOR</span>
                <TechBadge label={`$${totalBatchValue} Total Yield`} variant="blue" />
              </div>

              {/* Weight Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#0F172A] font-bold">Scanned Hardware Weight (kg)</span>
                  <span className="text-[#D97706] font-extrabold">{pcbWeight} kg</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={pcbWeight}
                  onChange={(e) => setPcbWeight(+e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#D97706]"
                />
              </div>

              {/* Metal Yield Breakdown List */}
              <div className="space-y-3 pt-2">
                {metalsData.map((m) => (
                  <div key={m.symbol} className="p-4 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${m.bg} flex items-center justify-center font-mono font-bold ${m.color}`}>
                        {m.symbol}
                      </div>
                      <div>
                        <span className="font-heading font-bold text-sm text-[#0F172A] block">{m.name}</span>
                        <span className="text-[10px] font-mono text-[#64748B]">{m.yieldKg} kg recoverable</span>
                      </div>
                    </div>
                    <span className={`font-mono font-extrabold text-sm ${m.color}`}>${m.valueUSD}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
