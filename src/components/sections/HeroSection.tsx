"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import PrimaryButton from "@/components/ui/PrimaryButton";
import FloatingBadge from "@/components/ui/FloatingBadge";
import TechBadge from "@/components/ui/TechBadge";
import {
  ArrowRight,
  Play,
  Cpu,
  Activity,
  Coins,
  Leaf,
  Sparkles,
  ShieldCheck,
  Building2,
  GraduationCap,
  Layers,
  CheckCircle2,
} from "lucide-react";

const LabHeroRoboticScene = dynamic(
  () => import("@/components/3d/LabHeroRoboticScene"),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#F8FAFC]" /> }
);

export default function HeroSection() {
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-[#FFFFFF] to-[#F8FAFC]">
      {/* Subtle Blueprint & Electronic Traces Overlay */}
      <div className="absolute inset-0 bg-circuit-grid opacity-[0.04] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#2563EB]/5 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Content Column */}
          <div className="lg:col-span-6 flex flex-col gap-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] w-fit">
              <Sparkles className="w-4 h-4 text-[#2563EB]" />
              <span className="text-xs font-mono tracking-wider uppercase text-[#2563EB] font-bold">
                ENTERPRISE CIRCULAR ELECTRONICS OPERATING PLATFORM
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-heading text-5xl sm:text-6xl md:text-[76px] font-extrabold tracking-tight text-[#0F172A] leading-[1.05]">
              Intelligence for the{" "}
              <span className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] bg-clip-text text-transparent block mt-1">
                Circular Electronics
              </span>{" "}
              Economy
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-xl font-normal">
              AI-powered platform for detecting, reconstructing and extending the lifecycle of electronic components through Computer Vision, Machine Learning and Digital Product Passports.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-3">
              <Link href="/platform/detection" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#0F172A] text-white font-medium text-base shadow-lg hover:shadow-[0_0_25px_rgba(37,99,235,0.35)] hover:bg-[#1E293B] transition-all flex items-center justify-center gap-3 group cursor-pointer">
                  <span>Explore Platform</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                </button>
              </Link>

              <button
                onClick={() => setVideoModalOpen(true)}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/90 border border-[#E2E8F0] text-[#0F172A] font-medium text-base shadow-sm hover:border-[#2563EB] hover:bg-[#F8FAFC] transition-all flex items-center justify-center gap-3 cursor-pointer group"
              >
                <div className="w-6 h-6 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] group-hover:scale-110 transition-transform">
                  <Play className="w-3.5 h-3.5 fill-[#2563EB]" />
                </div>
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Monochrome Enterprise Trust Section */}
            <div className="pt-8 border-t border-[#E2E8F0] flex flex-col gap-3">
              <span className="text-xs font-mono text-[#64748B] uppercase tracking-wider font-semibold">
                Trusted by Enterprise Partners
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {["Research Labs", "Manufacturers", "Repair Centers", "Universities", "Government Programs"].map((pill) => (
                  <span
                    key={pill}
                    className="px-3 py-1 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-mono text-[#475569] font-medium"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Right Photorealistic 3D Industrial Inspection Scene */}
          <div className="lg:col-span-6 h-[500px] sm:h-[580px] relative rounded-3xl bg-white border border-[#E2E8F0] shadow-2xl overflow-hidden">
            <LabHeroRoboticScene />

            {/* Floating Glass Telemetry Cards */}
            <div className="absolute top-6 left-6 z-20">
              <FloatingBadge
                icon={<Cpu className="w-4 h-4 text-[#2563EB]" />}
                label="Components Detected"
                value="2,846"
                variant="blue"
              />
            </div>

            <div className="absolute top-6 right-6 z-20">
              <FloatingBadge
                icon={<Activity className="w-4 h-4 text-[#16A34A]" />}
                label="Health Score"
                value="92%"
                variant="green"
              />
            </div>

            <div className="absolute bottom-6 left-6 z-20">
              <FloatingBadge
                icon={<Coins className="w-4 h-4 text-[#C9A227]" />}
                label="Metal Value"
                value="$18.70"
                variant="gold"
              />
            </div>

            <div className="absolute bottom-6 right-6 z-20">
              <FloatingBadge
                icon={<Leaf className="w-4 h-4 text-[#16A34A]" />}
                label="CO₂ Saved"
                value="18.6 kg"
                variant="green"
              />
            </div>

            {/* Real-Time Detected Component Popups */}
            <div className="absolute top-1/2 left-8 -translate-y-1/2 z-20 hidden sm:block">
              <div className="px-3.5 py-2 rounded-xl bg-white/90 backdrop-blur-md border border-[#E2E8F0] shadow-lg flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                <div className="flex flex-col text-left">
                  <span className="font-mono text-xs font-bold text-[#0F172A]">LM358 IC</span>
                  <span className="text-[10px] font-mono text-[#16A34A]">92% Health • Verified</span>
                </div>
              </div>
            </div>

            <div className="absolute top-1/3 right-8 z-20 hidden sm:block">
              <div className="px-3.5 py-2 rounded-xl bg-white/90 backdrop-blur-md border border-[#E2E8F0] shadow-lg flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
                <div className="flex flex-col text-left">
                  <span className="font-mono text-xs font-bold text-[#0F172A]">ATmega328P</span>
                  <span className="text-[10px] font-mono text-[#2563EB]">6.4 Years RUL</span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-20 right-12 z-20 hidden sm:block">
              <div className="px-3.5 py-2 rounded-xl bg-white/90 backdrop-blur-md border border-[#E2E8F0] shadow-lg flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
                <div className="flex flex-col text-left">
                  <span className="font-mono text-xs font-bold text-[#0F172A]">STM32F103</span>
                  <span className="text-[10px] font-mono text-[#2563EB]">98% AI Confidence</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* BOTTOM METRICS BAR (PREMIUM GLASS CONTAINER) */}
        <div className="mt-16 p-8 rounded-3xl bg-white/90 backdrop-blur-md border border-[#E2E8F0] shadow-xl">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            <div className="p-4 rounded-2xl bg-[#F8FAFC]">
              <span className="font-mono text-3xl font-extrabold text-[#0F172A] block">120K+</span>
              <span className="text-xs text-[#64748B] font-mono">Components Analyzed</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#F8FAFC]">
              <span className="font-mono text-3xl font-extrabold text-[#2563EB] block">8,450+</span>
              <span className="text-xs text-[#64748B] font-mono">PCB Reconstructed</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#F8FAFC]">
              <span className="font-mono text-3xl font-extrabold text-[#C9A227] block">2.4 Tons</span>
              <span className="text-xs text-[#64748B] font-mono">Precious Metals Recovered</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#F8FAFC]">
              <span className="font-mono text-3xl font-extrabold text-[#16A34A] block">96.3 Tons</span>
              <span className="text-xs text-[#64748B] font-mono">Carbon Saved</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#F8FAFC] col-span-2 md:col-span-1">
              <span className="font-mono text-3xl font-extrabold text-[#0F172A] block">73K+</span>
              <span className="text-xs text-[#64748B] font-mono">Verified Component Passports</span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Video Modal */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#2563EB]" />
                <h3 className="font-heading text-lg font-bold text-[#0F172A]">EcoIntel 6-Axis Industrial Inspection Demo</h3>
              </div>
              <button
                onClick={() => setVideoModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] text-xs font-mono font-bold"
              >
                [ CLOSE ]
              </button>
            </div>
            <div className="aspect-video w-full mt-4 bg-[#0F172A] rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
              <Cpu className="w-16 h-16 text-[#2563EB] animate-pulse mb-4" />
              <p className="font-mono text-sm text-slate-300">Simulating 6-Axis Robotic Laser PCB Inspection...</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
