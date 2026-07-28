"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
import LabCard from "@/components/ui/LabCard";
import PrimaryButton from "@/components/ui/PrimaryButton";
import TechBadge from "@/components/ui/TechBadge";
import { Coins, ArrowLeft, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function PreciousMetalsPage() {
  const metals = [
    { symbol: "Au", name: "Gold", num: 79, yield: "280 - 350 grams", price: "$78.40 / gram", purity: "99.99% Ultra Fine", color: "#C9A227" },
    { symbol: "Ag", name: "Silver", num: 47, yield: "1,200 - 1,800 grams", price: "$0.95 / gram", purity: "99.9% High Purity", color: "#64748B" },
    { symbol: "Cu", name: "Copper", num: 29, yield: "120 - 180 kilograms", price: "$9.20 / kilogram", purity: "99.95% Electrolytic", color: "#B87333" },
    { symbol: "Pd", name: "Palladium", num: 46, yield: "45 - 75 grams", price: "$34.10 / gram", purity: "99.8% Catalyst", color: "#0F172A" },
  ];

  const [activeMetal, setActiveMetal] = useState(metals[0]);

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
            badge="04 | SPECTROMETRY & URBAN MINING"
            title="Precious Metal Yield Intelligence"
            subtitle="Quantitative elemental analysis estimating recoverable high-value metals inside e-waste batches prior to pyrometallurgical processing."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {metals.map((m) => (
              <button
                key={m.symbol}
                onClick={() => setActiveMetal(m)}
                className="text-left cursor-pointer"
              >
                <LabCard
                  className={`p-6 transition-all ${
                    activeMetal.symbol === m.symbol ? "border-[#2563EB] ring-2 ring-[#2563EB]/20 bg-white" : "bg-white/70"
                  }`}
                >
                  <span className="font-mono text-xs text-[#64748B] block mb-2">{m.num}</span>
                  <div className="w-14 h-14 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center font-heading text-2xl font-bold text-[#0F172A] mb-3">
                    {m.symbol}
                  </div>
                  <h3 className="font-heading text-lg font-bold text-[#0F172A]">{m.name}</h3>
                  <span className="text-xs font-mono text-[#2563EB] mt-1 block">{m.yield} / Ton</span>
                </LabCard>
              </button>
            ))}
          </div>

          <LabCard className="p-8 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-[#F8FAFC] border-2 border-[#2563EB] flex flex-col items-center justify-center">
                  <span className="text-xs font-mono text-[#64748B]">{activeMetal.num}</span>
                  <span className="font-heading text-3xl font-extrabold text-[#0F172A]">{activeMetal.symbol}</span>
                </div>
                <div>
                  <h4 className="font-heading text-xl font-bold text-[#0F172A]">{activeMetal.name} Spectrometry</h4>
                  <span className="text-xs font-mono text-[#16A34A]">{activeMetal.purity}</span>
                </div>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Yield Rate / Ton</span>
                  <span className="text-[#2563EB] font-bold">{activeMetal.yield}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Market Price</span>
                  <span className="text-[#16A34A] font-bold">{activeMetal.price}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]">
                <span className="text-xs font-mono text-[#2563EB] font-semibold flex items-center gap-1 mb-1">
                  <TrendingUp className="w-4 h-4" /> Urban Mining Advantage
                </span>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Extracting {activeMetal.name} from e-waste yields up to 80x higher density than virgin mine ore.
                </p>
              </div>
            </div>
          </LabCard>
        </div>
      </section>

      <Footer />
    </main>
  );
}
