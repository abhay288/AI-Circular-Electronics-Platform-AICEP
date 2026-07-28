"use client";

import React from "react";
import dynamic from "next/dynamic";
import SectionHeader from "@/components/ui/SectionHeader";
import GlassCard from "@/components/ui/GlassCard";
import TechBadge from "@/components/ui/TechBadge";
import { ShieldCheck, Lock, ExternalLink, Cpu, CheckCircle } from "lucide-react";

const PassportCard3D = dynamic(
  () => import("@/components/3d/PassportCard3D"),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#0A1325]/40 rounded-2xl" /> }
);

export default function PassportSection() {
  return (
    <section id="passport" className="py-24 relative overflow-hidden bg-[#04070E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <SectionHeader
          badge="DECENTRALIZED COMPONENT PASSPORTS"
          title="Polygon Blockchain Traceability"
          subtitle="Every diagnosed component is minted as an immutable Polygon ERC-721 Digital Product Passport (DPP) containing lifetime health, origin, and refurbishment logs."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* 3D Holographic Passport Card Renderer */}
          <div className="lg:col-span-6 h-[400px] relative rounded-3xl border border-[#00E6FF]/30 bg-[#0A1325]/60 overflow-hidden shadow-[0_0_50px_rgba(0,230,255,0.15)]">
            <PassportCard3D />
          </div>

          {/* Holographic Passport Data Sheet Card */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <GlassCard glow="cyan" className="p-8">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#00E6FF]" />
                  <span className="font-mono text-xs uppercase tracking-widest text-[#00E6FF]">
                    Polygon Mainnet Contract
                  </span>
                </div>
                <TechBadge label="ERC-721 DPP Verified" variant="green" />
              </div>

              <div className="py-6 space-y-4 font-mono">
                <div className="flex justify-between items-center py-2 border-b border-white/5 text-xs">
                  <span className="text-[#8A97B5]">Component ID</span>
                  <span className="text-[#F5F8FF] font-bold">EINT-88392-AU</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-white/5 text-xs">
                  <span className="text-[#8A97B5]">Origin Facility</span>
                  <span className="text-[#F5F8FF]">EcoIntel Lab Alpha (Tokyo)</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-white/5 text-xs">
                  <span className="text-[#8A97B5]">Verified Health Grade</span>
                  <span className="text-[#00FF99] font-bold">98.4% (Grade A+)</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-white/5 text-xs">
                  <span className="text-[#8A97B5]">Reuse Cycle Count</span>
                  <span className="text-[#00E6FF] font-bold">2 Cycles</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-white/5 text-xs">
                  <span className="text-[#8A97B5]">Remaining Life</span>
                  <span className="text-[#F5F8FF]">4.2 Years (36,800 Hrs)</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-white/5 text-xs">
                  <span className="text-[#8A97B5]">Smart Contract Hash</span>
                  <span className="text-[#6C63FF] text-[11px] truncate max-w-[180px]">
                    0x7f9a88392c1044b3f
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-[#00FF99] font-mono">
                  <CheckCircle className="w-4 h-4" />
                  Polygon Network Confirmed
                </span>
                <a
                  href="https://polygonscan.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[#00E6FF] hover:underline font-mono"
                >
                  <span>PolygonScan</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}
