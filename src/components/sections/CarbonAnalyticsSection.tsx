"use client";

import React from "react";
import dynamic from "next/dynamic";
import SectionHeader from "@/components/ui/SectionHeader";
import GlassCard from "@/components/ui/GlassCard";
import TechBadge from "@/components/ui/TechBadge";
import { Leaf, Droplets, Zap, Recycle, Globe, ArrowUpRight } from "lucide-react";

const EarthAnalytics3D = dynamic(
  () => import("@/components/3d/EarthAnalytics3D"),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#0A1325]/40 rounded-2xl" /> }
);

export default function CarbonAnalyticsSection() {
  return (
    <section id="carbon-analytics" className="py-24 relative overflow-hidden bg-[#04070E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <SectionHeader
          badge="QUANTIFIED ENVIRONMENTAL IMPACT"
          title="ESG Carbon Analytics & Circular Savings"
          subtitle="Real-time environmental telemetry calculating Scope 3 emissions avoided, virgin mining displacement, and energy conservation across global enterprise partners."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* 3D Holographic Earth Sphere Render */}
          <div className="lg:col-span-6 h-[420px] relative rounded-3xl border border-[#00FF99]/30 bg-[#0A1325]/40 overflow-hidden shadow-[0_0_50px_rgba(0,255,153,0.15)]">
            <EarthAnalytics3D />
          </div>

          {/* Environmental Metrics Grid Cards */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <GlassCard glow="green" className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#00FF99]/10 border border-[#00FF99]/30 flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-[#00FF99]" />
                </div>
                <span className="font-mono text-xs text-[#8A97B5]">CO₂ Emissions Prevented</span>
              </div>
              <span className="font-heading text-3xl font-extrabold text-white">42,850 Tons</span>
              <p className="text-xs font-mono text-[#00FF99] mt-2">+14.2% Month-over-Month</p>
            </GlassCard>

            <GlassCard glow="cyan" className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#00E6FF]/10 border border-[#00E6FF]/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#00E6FF]" />
                </div>
                <span className="font-mono text-xs text-[#8A97B5]">Clean Energy Saved</span>
              </div>
              <span className="font-heading text-3xl font-extrabold text-white">128 GWh</span>
              <p className="text-xs font-mono text-[#00E6FF] mt-2">Equivalent to 24,000 Homes</p>
            </GlassCard>

            <GlassCard glow="cyan" className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#00E6FF]/10 border border-[#00E6FF]/30 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-[#00E6FF]" />
                </div>
                <span className="font-mono text-xs text-[#8A97B5]">Water Conserved</span>
              </div>
              <span className="font-heading text-3xl font-extrabold text-white">850,000 Liters</span>
              <p className="text-xs font-mono text-[#00E6FF] mt-2">Zero Chemical Pollution</p>
            </GlassCard>

            <GlassCard glow="purple" className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#6C63FF]/10 border border-[#6C63FF]/30 flex items-center justify-center">
                  <Recycle className="w-5 h-5 text-[#6C63FF]" />
                </div>
                <span className="font-mono text-xs text-[#8A97B5]">Components Reused</span>
              </div>
              <span className="font-heading text-3xl font-extrabold text-white">1.4 Million</span>
              <p className="text-xs font-mono text-[#6C63FF] mt-2">Landfill Diverted Direct</p>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}
