"use client";

import React, { useState } from "react";
import SectionHeader from "@/components/ui/SectionHeader";
import GlassCard from "@/components/ui/GlassCard";
import TechBadge from "@/components/ui/TechBadge";
import { Coins, Sparkles, TrendingUp, Gem, Layers } from "lucide-react";

interface MetalItem {
  symbol: string;
  name: string;
  atomicNum: number;
  yieldPerTon: string;
  marketPrice: string;
  purity: string;
  color: string;
  glow: "cyan" | "green" | "purple";
}

const metalsData: MetalItem[] = [
  {
    symbol: "Au",
    name: "Gold",
    atomicNum: 79,
    yieldPerTon: "280 - 350 grams",
    marketPrice: "$78.40 / gram",
    purity: "99.99% Ultra Fine",
    color: "#FFD700",
    glow: "cyan",
  },
  {
    symbol: "Ag",
    name: "Silver",
    atomicNum: 47,
    yieldPerTon: "1,200 - 1,800 grams",
    marketPrice: "$0.95 / gram",
    purity: "99.9% High Purity",
    color: "#E0E0E0",
    glow: "green",
  },
  {
    symbol: "Cu",
    name: "Copper",
    atomicNum: 29,
    yieldPerTon: "120 - 180 kilograms",
    marketPrice: "$9.20 / kilogram",
    purity: "99.95% Electrolytic",
    color: "#B87333",
    glow: "cyan",
  },
  {
    symbol: "Pd",
    name: "Palladium",
    atomicNum: 46,
    yieldPerTon: "45 - 75 grams",
    marketPrice: "$34.10 / gram",
    purity: "99.8% Rare Catalyst",
    color: "#6C63FF",
    glow: "purple",
  },
];

export default function PreciousMetalsSection() {
  const [selectedMetal, setSelectedMetal] = useState<MetalItem>(metalsData[0]);

  return (
    <section className="py-24 relative overflow-hidden bg-[#0A1325]/40 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <SectionHeader
          badge="QUANTITATIVE URBAN MINING SPECTROMETRY"
          title="Precious Metal Yield Intelligence"
          subtitle="Precision estimation of recoverable high-value elements inside e-waste batches before pyrometallurgical processing."
        />

        {/* 4 Interactive Floating Periodic Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {metalsData.map((metal) => {
            const isSelected = selectedMetal.symbol === metal.symbol;
            return (
              <button
                key={metal.symbol}
                onClick={() => setSelectedMetal(metal)}
                className="text-left cursor-pointer focus:outline-none"
              >
                <GlassCard
                  glow={isSelected ? metal.glow : "none"}
                  className={`p-6 transition-all duration-300 transform ${
                    isSelected ? "-translate-y-2 border-[#00E6FF]/50 bg-[#0F1C36]" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs text-[#8A97B5]">{metal.atomicNum}</span>
                    <TechBadge label="Elemental" variant={metal.glow} />
                  </div>

                  {/* Periodic Element Symbol Box */}
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span
                      className="font-heading text-3xl font-extrabold"
                      style={{ color: metal.color }}
                    >
                      {metal.symbol}
                    </span>
                  </div>

                  <h3 className="font-heading text-xl font-bold text-[#F5F8FF]">{metal.name}</h3>
                  <p className="text-xs font-mono text-[#00E6FF] mt-1">{metal.yieldPerTon} / Ton</p>
                </GlassCard>
              </button>
            );
          })}
        </div>

        {/* Selected Metal Detailed Intelligence Display */}
        <GlassCard glow="cyan" className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="flex items-center gap-6">
              <div
                className="w-24 h-24 rounded-3xl bg-[#08101F] border-2 border-[#00E6FF]/50 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(0,230,255,0.2)]"
              >
                <span className="text-xs font-mono text-[#8A97B5]">{selectedMetal.atomicNum}</span>
                <span className="font-heading text-4xl font-black" style={{ color: selectedMetal.color }}>
                  {selectedMetal.symbol}
                </span>
              </div>
              <div>
                <h4 className="font-heading text-2xl font-bold text-white">{selectedMetal.name} Spectrometry</h4>
                <p className="text-xs font-mono text-[#00FF99] mt-1">{selectedMetal.purity}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs text-[#8A97B5] block font-mono">Yield Rate</span>
                <span className="font-mono text-lg font-bold text-[#00E6FF]">{selectedMetal.yieldPerTon}</span>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs text-[#8A97B5] block font-mono">Market Index</span>
                <span className="font-mono text-lg font-bold text-[#00FF99]">{selectedMetal.marketPrice}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-mono text-[#F5F8FF]">
                <TrendingUp className="w-4 h-4 text-[#00FF99]" />
                <span>+80x Higher Density than Virigine Mine Ore</span>
              </div>
              <p className="text-xs text-[#8A97B5] leading-relaxed">
                EcoIntel routes high-concentration batches directly to specialized hydrometallurgical refineries to maximize dollar recovery per kg.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
