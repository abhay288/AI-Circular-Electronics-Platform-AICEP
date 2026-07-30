"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TechBadge from "@/components/ui/TechBadge";
import { ShoppingCart, ShieldCheck, Search, Filter, ArrowRight } from "lucide-react";

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("");

  const listings = [
    {
      id: "capsule_01",
      title: "ATmega328P Microcontrollers (Batch of 50)",
      health: "Grade A+ (92%)",
      rul: "6.4 Yrs Remaining",
      price: "$142.50",
      seller: "TerraCycle Lab (Tokyo)",
      polygonToken: "98421",
      badge: "VERIFIED PASSPORT",
    },
    {
      id: "capsule_02",
      title: "LM358 Dual Op-Amps (Batch of 100)",
      health: "Grade A (88%)",
      rul: "5.2 Yrs Remaining",
      price: "$85.00",
      seller: "LUMAFUSE Systems (Berlin)",
      polygonToken: "98422",
      badge: "VERIFIED PASSPORT",
    },
    {
      id: "capsule_03",
      title: "Solid Polymer Capacitors 220uF (Batch of 200)",
      health: "Grade A+ (95%)",
      rul: "8.0 Yrs Remaining",
      price: "$64.00",
      seller: "ReMaterials Corp (Austin)",
      polygonToken: "98423",
      badge: "VERIFIED PASSPORT",
    },
  ];

  return (
    <main className="relative flex flex-col min-h-screen bg-[#F1F5F9]">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-32 pb-16 bg-[#0F172A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[#60A5FA] text-xs font-mono font-bold w-fit">
              <ShoppingCart className="w-4 h-4" />
              <span>MODULE 07 · CIRCULAR B2B HARDWARE EXCHANGE & ESCROW</span>
            </div>
            <h1 className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tight">
              B2B Hardware Marketplace
            </h1>
            <p className="text-slate-300 text-base max-w-2xl leading-relaxed">
              Trade verified recovered electronic components inside transparent marketplace capsules with Polygon blockchain product passports and smart contract escrow.
            </p>
          </div>
        </div>
      </section>

      {/* Search & Listings Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">

          {/* Search Bar */}
          <div className="glass-panel p-4 mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#64748B] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search microchips, ICs, capacitors, or Polygon Token IDs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-[#E2E8F0] text-xs font-mono focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div className="flex gap-2">
              <button className="px-5 py-3 rounded-full bg-white border border-[#E2E8F0] text-xs font-mono font-bold text-[#0F172A] inline-flex items-center gap-2 hover:bg-slate-50">
                <Filter className="w-4 h-4 text-[#2563EB]" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {listings.map((item) => (
              <div key={item.id} className="glass-card-interactive p-7 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <TechBadge label={item.badge} variant="green" />
                    <span className="font-mono text-xs font-bold text-[#2563EB]">#{item.polygonToken}</span>
                  </div>

                  <h3 className="font-heading text-lg font-bold text-[#0F172A]">{item.title}</h3>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#64748B]">Certified Health</span>
                      <span className="font-bold text-[#16A34A]">{item.health}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#64748B]">Lifespan Baseline</span>
                      <span className="font-bold text-[#2563EB]">{item.rul}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#64748B]">Verified Facility</span>
                      <span className="font-bold text-[#0F172A]">{item.seller}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-mono font-extrabold text-xl text-[#0F172A]">{item.price}</span>
                  <button className="px-6 py-2.5 rounded-full bg-[#0F172A] text-white text-xs font-mono font-bold inline-flex items-center gap-2 hover:bg-[#1E293B]">
                    <span>Buy Capsule</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
