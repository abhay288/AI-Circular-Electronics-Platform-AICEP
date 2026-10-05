"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TechBadge from "@/components/ui/TechBadge";
import DynamicMetallicCubes from "@/components/3d/MetallicCubes3D";
import { Coins, ArrowRight, TrendingUp, Layers, Scale, Sparkles, CheckCircle2 } from "lucide-react";

interface BatchGrade {
  id: string;
  name: string;
  badge: string;
  goldGramsPerKg: number;
  silverGramsPerKg: number;
  copperKgPerKg: number; // 0.18 = 18%
  palladiumGramsPerKg: number;
}

const BATCH_GRADES: BatchGrade[] = [
  {
    id: "telecom-server",
    name: "Server & Telecom High-Grade PCBs",
    badge: "Gold-Dense Multi-Layer",
    goldGramsPerKg: 0.32,     // 320 mg/kg -> ₹2,170/kg
    silverGramsPerKg: 1.50,    // 1.5 g/kg -> ₹123/kg
    copperKgPerKg: 0.18,       // 180 g/kg (18% board mass) -> ₹143/kg (Fixed from bugged ₹14!)
    palladiumGramsPerKg: 0.045,// 45 mg/kg -> ₹133/kg
  },
  {
    id: "consumer-motherboards",
    name: "PC Motherboards & Laptops",
    badge: "Standard Commercial Grade",
    goldGramsPerKg: 0.18,
    silverGramsPerKg: 0.90,
    copperKgPerKg: 0.15,
    palladiumGramsPerKg: 0.025,
  },
  {
    id: "mixed-ewaste",
    name: "Mixed Shredded E-Waste",
    badge: "Commodity Scrap Mix",
    goldGramsPerKg: 0.04,
    silverGramsPerKg: 0.25,
    copperKgPerKg: 0.06,
    palladiumGramsPerKg: 0.006,
  },
];

export default function MetalsPage() {
  const [pcbWeight, setPcbWeight] = useState(1); // Default to 1 kg to match inspector
  const [selectedGrade, setSelectedGrade] = useState<BatchGrade>(BATCH_GRADES[0]);

  // Benchmark Market Rates (Consistent with platform standards)
  const RATES = {
    Au: 6780, // ₹6,780 per gram (24K fine gold recovery benchmark)
    Ag: 82,   // ₹82 per gram (99.9% fine silver)
    Cu: 795,  // ₹795 per kilogram (Electrolytic copper cathode benchmark)
    Pd: 2950, // ₹2,950 per gram (Industrial catalytic palladium benchmark)
  };

  // Calculations for current weight and selected batch grade
  const goldRecoveredGrams = +(pcbWeight * selectedGrade.goldGramsPerKg).toFixed(3);
  const goldValueINR = Math.round(goldRecoveredGrams * RATES.Au);

  const silverRecoveredGrams = +(pcbWeight * selectedGrade.silverGramsPerKg).toFixed(2);
  const silverValueINR = Math.round(silverRecoveredGrams * RATES.Ag);

  const copperRecoveredKg = +(pcbWeight * selectedGrade.copperKgPerKg).toFixed(3);
  const copperRecoveredGrams = Math.round(copperRecoveredKg * 1000);
  const copperValueINR = Math.round(copperRecoveredKg * RATES.Cu);

  const palladiumRecoveredGrams = +(pcbWeight * selectedGrade.palladiumGramsPerKg).toFixed(3);
  const palladiumRecoveredMg = Math.round(palladiumRecoveredGrams * 1000);
  const palladiumValueINR = Math.round(palladiumRecoveredGrams * RATES.Pd);

  const totalRawINR = goldValueINR + silverValueINR + copperValueINR + palladiumValueINR;
  const totalBatchValue = totalRawINR.toLocaleString("en-IN");

  const metalsData = [
    {
      symbol: "Au",
      name: "Gold (79)",
      rateLabel: `₹${RATES.Au.toLocaleString("en-IN")}/g`,
      yieldDisplay: goldRecoveredGrams >= 1000
        ? `${(goldRecoveredGrams / 1000).toFixed(3)} kg (${goldRecoveredGrams.toLocaleString("en-IN")} g)`
        : `${goldRecoveredGrams.toFixed(2)} g (${(goldRecoveredGrams * 0.001).toFixed(4)} kg)`,
      valueINR: goldValueINR,
      sharePercent: totalRawINR > 0 ? Math.round((goldValueINR / totalRawINR) * 100) : 0,
      bg: "bg-[#FEF9C3]",
      color: "text-[#C9A227]",
      borderColor: "border-[#FDE047]",
    },
    {
      symbol: "Ag",
      name: "Silver (47)",
      rateLabel: `₹${RATES.Ag.toLocaleString("en-IN")}/g`,
      yieldDisplay: silverRecoveredGrams >= 1000
        ? `${(silverRecoveredGrams / 1000).toFixed(2)} kg`
        : `${silverRecoveredGrams.toFixed(2)} g (${(silverRecoveredGrams * 0.001).toFixed(4)} kg)`,
      valueINR: silverValueINR,
      sharePercent: totalRawINR > 0 ? Math.round((silverValueINR / totalRawINR) * 100) : 0,
      bg: "bg-[#F1F5F9]",
      color: "text-[#475569]",
      borderColor: "border-[#E2E8F0]",
    },
    {
      symbol: "Cu",
      name: "Copper (29)",
      rateLabel: `₹${RATES.Cu.toLocaleString("en-IN")}/kg`,
      yieldDisplay: `${copperRecoveredKg} kg (${copperRecoveredGrams.toLocaleString("en-IN")} g)`,
      valueINR: copperValueINR,
      sharePercent: totalRawINR > 0 ? Math.round((copperValueINR / totalRawINR) * 100) : 0,
      bg: "bg-[#FFF7ED]",
      color: "text-[#EA580C]",
      borderColor: "border-[#FED7AA]",
    },
    {
      symbol: "Pd",
      name: "Palladium (46)",
      rateLabel: `₹${RATES.Pd.toLocaleString("en-IN")}/g`,
      yieldDisplay: `${palladiumRecoveredMg} mg (${palladiumRecoveredGrams.toFixed(3)} g)`,
      valueINR: palladiumValueINR,
      sharePercent: totalRawINR > 0 ? Math.round((palladiumValueINR / totalRawINR) * 100) : 0,
      bg: "bg-[#EFF6FF]",
      color: "text-[#2563EB]",
      borderColor: "border-[#BFDBFE]",
    },
  ];

  const quickWeights = [1, 5, 10, 25, 50, 100];

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
              Optical emission spectrometry calculating recoverable Gold, Silver, Copper, and Palladium yields before pyrometallurgical processing with verified live market rates.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Yield Calculator & 3D Cubes */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left 3D PBR Metal Cubes */}
            <div className="lg:col-span-5 h-[480px] glass-panel overflow-hidden sticky top-28">
              <DynamicMetallicCubes />
            </div>

            {/* Right Calculator & Metal Table */}
            <div className="lg:col-span-7 glass-card p-6 sm:p-8 space-y-6">
              
              {/* Header & Total Yield Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
                <div>
                  <span className="font-mono text-xs font-bold text-[#D97706] tracking-wider uppercase block">
                    E-Waste Batch Weight Calculator
                  </span>
                  <span className="text-[11px] font-mono text-[#64748B]">
                    Industrial Spectrometry & Recovery Valuation
                  </span>
                </div>
                <TechBadge label={`₹${totalBatchValue} Total Yield`} variant="blue" />
              </div>

              {/* Batch Grade Selector */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-[#0F172A] block">
                  Select Hardware Batch Grade:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {BATCH_GRADES.map((grade) => {
                    const isSelected = grade.id === selectedGrade.id;
                    return (
                      <button
                        key={grade.id}
                        type="button"
                        onClick={() => setSelectedGrade(grade)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#0F172A] text-white border-[#0F172A] shadow-sm"
                            : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#94A3B8]"
                        }`}
                      >
                        <span className="text-xs font-bold block truncate">{grade.name}</span>
                        <span className={`text-[10px] font-mono block mt-0.5 ${isSelected ? "text-amber-400" : "text-[#94A3B8]"}`}>
                          {grade.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weight Slider */}
              <div className="space-y-2.5 pt-1">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-[#0F172A] font-bold">Scanned Hardware Weight</span>
                  <span className="text-base font-extrabold text-[#D97706] bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                    {pcbWeight} kg
                  </span>
                </div>
                
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={pcbWeight}
                  onChange={(e) => setPcbWeight(+e.target.value)}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#D97706]"
                />

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                  <span className="text-[10px] font-mono text-[#64748B] mr-1">Presets:</span>
                  {quickWeights.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setPcbWeight(w)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        pcbWeight === w
                          ? "bg-[#D97706] text-white shadow-xs"
                          : "bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]"
                      }`}
                    >
                      {w} kg
                    </button>
                  ))}
                </div>
              </div>

              {/* Metal Yield Breakdown List */}
              <div className="space-y-3 pt-2">
                {metalsData.map((m) => (
                  <div
                    key={m.symbol}
                    className="p-3.5 sm:p-4 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl ${m.bg} border ${m.borderColor} flex items-center justify-center font-mono font-extrabold text-sm ${m.color} flex-shrink-0 shadow-xs`}>
                        {m.symbol}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-heading font-bold text-sm text-[#0F172A]">
                            {m.name}
                          </span>
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-[#475569] border border-slate-200">
                            Rate: {m.rateLabel}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[#64748B] block mt-0.5 truncate">
                          {m.yieldDisplay} recoverable
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className={`font-mono font-extrabold text-base ${m.color} block`}>
                        ₹{m.valueINR.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] font-mono text-[#94A3B8]">
                        {m.sharePercent}% of yield
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Valuation Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-[#475569]">
                  <Scale className="w-4 h-4 text-[#D97706] flex-shrink-0" />
                  <span>
                    Batch Metric: <strong>₹{Math.round(totalRawINR / pcbWeight).toLocaleString("en-IN")} / kg</strong> recovery density
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[#16A34A] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified Pyrometallurgical Yield</span>
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
