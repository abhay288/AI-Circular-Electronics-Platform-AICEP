"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TechBadge from "@/components/ui/TechBadge";
import DynamicRecyclingGlobe from "@/components/3d/RecyclingGlobe3D";
import { Leaf, Download, ArrowRight, Zap, Droplets } from "lucide-react";

export default function ImpactPage() {
  return (
    <main className="relative flex flex-col min-h-screen bg-[#F1F5F9]">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-32 pb-16 bg-[#0F172A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[#4ADE80] text-xs font-mono font-bold w-fit">
              <Leaf className="w-4 h-4" />
              <span>MODULE 08 · SCOPE 3 CARBON ANALYTICS & ISO 14040 ESG REPORTS</span>
            </div>
            <h1 className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tight">
              Carbon Impact & ESG Analytics
            </h1>
            <p className="text-slate-300 text-base max-w-2xl leading-relaxed">
              Quantifying greenhouse gas avoidance, clean energy preservation, water savings, and landfill diversion rate metrics across hardware supply chains.
            </p>
          </div>
        </div>
      </section>

      {/* Analytics Dashboard Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          
          {/* Top 3D Earth & Metric Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-12">
            
            <div className="lg:col-span-6 h-[400px] glass-panel overflow-hidden">
              <DynamicRecyclingGlobe />
            </div>

            <div className="lg:col-span-6 space-y-4">
              <div className="p-6 rounded-2xl glass-card border border-emerald-200 space-y-2">
                <span className="font-mono text-xs font-bold text-[#16A34A] uppercase">Total Greenhouse Gas Avoided</span>
                <span className="font-mono text-4xl font-extrabold text-[#0F172A] block">96.3 Tons CO₂e</span>
                <span className="text-xs text-[#64748B] font-mono">Equivalent to removing 21,000 passenger vehicles from global roads.</span>
              </div>

              <div className="p-6 rounded-2xl glass-card border border-blue-200 space-y-2">
                <span className="font-mono text-xs font-bold text-[#2563EB] uppercase">Clean Energy Saved</span>
                <span className="font-mono text-4xl font-extrabold text-[#0F172A] block">1.42 GWh</span>
                <span className="text-xs text-[#64748B] font-mono">Preserved through component direct reuse vs virgin silicon refining.</span>
              </div>

              <div className="p-6 rounded-2xl glass-card border border-amber-200 space-y-2">
                <span className="font-mono text-xs font-bold text-[#D97706] uppercase">Zero-Landfill Diversion Rate</span>
                <span className="font-mono text-4xl font-extrabold text-[#0F172A] block">100.0%</span>
                <span className="text-xs text-[#64748B] font-mono">Certified ISO 14001 zero-waste facility audit compliance.</span>
              </div>
            </div>

          </div>

          {/* Export PDF Report Bar */}
          <div className="glass-panel p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-heading text-lg font-bold text-[#0F172A]">Export ISO 14040 Certified Audit PDF Report</h3>
              <p className="text-xs text-[#64748B] font-mono">Generate corporate ESG compliance reports for corporate stakeholders</p>
            </div>
            <button className="px-8 py-4 rounded-full bg-[#0F172A] text-white text-xs font-mono font-bold inline-flex items-center gap-2.5 hover:bg-[#1E293B]">
              <Download className="w-4 h-4 text-[#4ADE80]" />
              <span>Export Carbon Audit PDF</span>
            </button>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
