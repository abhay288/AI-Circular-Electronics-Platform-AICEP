"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
import TechBadge from "@/components/ui/TechBadge";
import FloatingBadge from "@/components/ui/FloatingBadge";
import {
  ArrowRight,
  Play,
  Cpu,
  Layers,
  Activity,
  Coins,
  ShieldCheck,
  ShoppingCart,
  Leaf,
  CheckCircle2,
  Database,
  Sparkles,
  Zap,
  Check,
} from "lucide-react";

const LabHeroRoboticScene = dynamic(
  () => import("@/components/3d/LabHeroRoboticScene"),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#F1F5F9]" /> }
);

const MetallicCubes3D = dynamic(
  () => import("@/components/3d/MetallicCubes3D"),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#F1F5F9]" /> }
);

export default function Home() {
  const [selectedWorkflowStep, setSelectedWorkflowStep] = useState(0);

  const workflowSteps = [
    { step: "01", title: "Collect E-Waste", desc: "Scanned and indexed e-waste batches from global recyclers", icon: Database },
    { step: "02", title: "AI Inspection", desc: "Sub-millimeter spectro-spatial neural scanning", icon: Cpu },
    { step: "03", title: "PCB Reconstruction", desc: "Generative CAD topology & Gerber netlist generation", icon: Layers },
    { step: "04", title: "Health Prediction", desc: "Physics-informed ML predicts remaining lifespan", icon: Activity },
    { step: "05", title: "Digital Passport", desc: "Polygon ERC-721 product passport minted", icon: ShieldCheck },
    { step: "06", title: "Marketplace", desc: "Listed on B2B circular hardware exchange", icon: ShoppingCart },
    { step: "07", title: "Carbon Report", desc: "Quantified ESG Scope 3 emissions avoided", icon: Leaf },
  ];

  const platformOverviewCards = [
    { badge: "VISION & SPECTROMETRY", title: "AI Component Detection", desc: "Detect and classify electronic components down to 50 microns with sub-millimeter precision.", href: "/platform/detection", stat: "99.2% Accuracy", icon: Cpu },
    { badge: "GENERATIVE GRAPH AI", title: "PCB Reconstruction", desc: "Reconstruct severed copper traces and generate KiCad & Gerber CAD schematics automatically.", href: "/platform/reconstruction", stat: "100% Netlist Match", icon: Layers },
    { badge: "PHYSICS-INFORMED ML", title: "Remaining Useful Life (RUL)", desc: "Electro-thermal physics simulations predict exact component lifespan across operational years.", href: "/platform/rul", stat: "50,000 Hr Baseline", icon: Activity },
    { badge: "URBAN MINING SPECTROMETRY", title: "Precious Metal Intelligence", desc: "Estimate recoverable Gold, Silver, Copper, and Palladium yields before processing.", href: "/platform/metals", stat: "$78.40/g Gold Value", icon: Coins },
    { badge: "POLYGON BLOCKCHAIN", title: "Blockchain Passport", desc: "Mint immutable ERC-721 product passports tracking origin, health grade, and reuse cycles.", href: "/platform/passport", stat: "Polygon Mainnet", icon: ShieldCheck },
    { badge: "CIRCULAR B2B EXCHANGE", title: "Circular Marketplace", desc: "Trade verified hardware with embedded passports, verified lifespan, and instant escrow.", href: "/marketplace", stat: "1.4M Components", icon: ShoppingCart },
  ];

  const metrics = [
    { value: "120K+", label: "Components Analyzed", color: "text-[#0F172A]" },
    { value: "8,450+", label: "PCBs Reconstructed", color: "text-[#2563EB]" },
    { value: "2.4 Tons", label: "Metals Recovered", color: "text-[#C9A227]" },
    { value: "96.3 Tons", label: "CO₂ Impact Reduced", color: "text-[#16A34A]" },
    { value: "73K+", label: "Active Passport IDs", color: "text-[#0F172A]" },
  ];

  return (
    <main className="relative flex flex-col min-h-screen bg-[#F1F5F9]">
      <Navbar />

      {/* ─── HERO SECTION ─────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Subtle technical blueprint background */}
        <div className="absolute inset-0 bg-blueprint opacity-100 pointer-events-none" />
        {/* Ambient blue aura glow behind left content */}
        <div className="absolute -left-32 top-1/4 w-[500px] h-[500px] rounded-full bg-[#E0F2FE]/60 blur-[130px] pointer-events-none" />
        {/* Ambient emerald aura glow behind 3D */}
        <div className="absolute right-0 top-1/3 w-[600px] h-[600px] rounded-full bg-[#DCFCE7]/50 blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Content Column */}
            <div className="lg:col-span-6 flex flex-col gap-7">

              {/* Eyebrow Glass Pill Badge */}
              <div className="glass-pill inline-flex items-center gap-2 px-4 py-2 w-fit">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
                <span className="text-[10px] font-mono tracking-[0.14em] uppercase text-[#2563EB] font-bold">
                  Enterprise Circular Electronics Operating Platform
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-heading text-[52px] sm:text-[64px] md:text-[76px] font-extrabold leading-[1.02] tracking-[-0.04em] text-[#0F172A]">
                Intelligence<br />
                for the{" "}
                <span className="bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#1D4ED8] bg-clip-text text-transparent">
                  Circular<br />Electronics
                </span>
                {" "}Economy
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-[17px] text-[#475569] leading-[1.75] max-w-[520px]">
                AI-powered platform for detecting, reconstructing and extending the lifecycle of electronic components through Computer Vision, Machine Learning and Digital Product Passports.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Link href="/platform/detection" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#0F172A] text-white text-sm font-semibold transition-all duration-200 hover:bg-[#1E293B] hover:shadow-[0_0_0_3px_rgba(37,99,235,0.2),0_12px_28px_-6px_rgba(37,99,235,0.35)] active:scale-[0.98] cursor-pointer group shadow-lg shadow-slate-900/20">
                    <span>Explore Platform</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </button>
                </Link>

                <Link href="/console" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full glass-pill text-[#0F172A] text-sm font-semibold transition-all duration-200 hover:border-[#2563EB]/40 hover:bg-white cursor-pointer group">
                    <div className="w-5 h-5 rounded-full bg-[#EFF6FF] flex items-center justify-center">
                      <Play className="w-2.5 h-2.5 fill-[#2563EB] text-[#2563EB]" />
                    </div>
                    <span>Watch Demo</span>
                  </button>
                </Link>
              </div>

              {/* Trust Section Badges */}
              <div className="pt-6 border-t border-[#CBD5E1]/60">
                <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#64748B] mb-3 font-semibold">
                  Trusted by Electronics Innovators Worldwide
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Research Labs", "Manufacturers", "Repair Centers", "Universities", "Gov. Programs"].map((tag) => (
                    <span
                      key={tag}
                      className="px-3.5 py-1.5 rounded-full glass-pill text-[11px] font-mono text-[#475569] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Photorealistic 3D Inspection Scene */}
            <div className="lg:col-span-6">
              <div className="relative h-[520px] sm:h-[600px] rounded-[2.2rem] glass-panel overflow-hidden">
                <LabHeroRoboticScene />

                {/* Floating Telemetry Glass Badges */}
                <div className="absolute top-5 left-5 z-20 animate-float">
                  <FloatingBadge
                    icon={<Cpu className="w-4 h-4 text-[#2563EB]" />}
                    label="Components Detected"
                    value="2,846"
                    variant="blue"
                  />
                </div>

                <div className="absolute top-5 right-5 z-20 animate-float-delayed">
                  <FloatingBadge
                    icon={<Activity className="w-4 h-4 text-[#16A34A]" />}
                    label="Health Score"
                    value="92%"
                    variant="green"
                  />
                </div>

                <div className="absolute bottom-5 left-5 z-20 animate-float">
                  <FloatingBadge
                    icon={<Coins className="w-4 h-4 text-[#C9A227]" />}
                    label="Metal Value"
                    value="$18.70"
                    variant="gold"
                  />
                </div>

                <div className="absolute bottom-5 right-5 z-20 animate-float-delayed">
                  <FloatingBadge
                    icon={<Leaf className="w-4 h-4 text-[#16A34A]" />}
                    label="CO₂ Saved"
                    value="18.6 kg"
                    variant="green"
                  />
                </div>

                {/* Live Component Scanning Indicators */}
                <div className="absolute top-1/2 -translate-y-8 left-6 z-20 hidden sm:block">
                  <div className="glass-pill px-3.5 py-2 flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] font-bold text-[#0F172A]">LM358 IC</span>
                      <span className="text-[10px] font-mono text-[#16A34A]">92% Health · Verified</span>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/3 right-6 z-20 hidden sm:block">
                  <div className="glass-pill px-3.5 py-2 flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] font-bold text-[#0F172A]">ATmega328P</span>
                      <span className="text-[10px] font-mono text-[#2563EB]">6.4 Years RUL</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── METRICS BANNER ───────────────────────────────────── */}
      <section className="py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="glass-panel p-2">
            <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-slate-200/60">
              {metrics.map((m) => (
                <div key={m.label} className="px-6 py-5 flex flex-col items-center text-center">
                  <span className={`font-mono text-2xl sm:text-3xl font-extrabold tracking-tight block ${m.color}`}>
                    {m.value}
                  </span>
                  <span className="text-[11px] text-[#64748B] font-mono mt-1 leading-snug">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── WORKFLOW SECTION ───────────────────────────────── */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionHeader
            badge="Platform Workflow"
            title="How EcoIntel Works"
            subtitle="End-to-end circular electronics intelligence platform transforming discarded hardware into verified high-value digital assets."
          />

          {/* Stepper Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-8">
            {workflowSteps.map((step, idx) => {
              const IconComp = step.icon;
              const isSelected = selectedWorkflowStep === idx;
              return (
                <button
                  key={step.step}
                  onClick={() => setSelectedWorkflowStep(idx)}
                  className={`p-4 rounded-2xl text-left border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-white border-[#2563EB] shadow-lg shadow-blue-500/10"
                      : "glass-card hover:bg-white"
                  }`}
                >
                  <span className="font-mono text-[10px] text-[#2563EB] block font-bold mb-2 tracking-widest">{step.step}</span>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <IconComp className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? "text-[#2563EB]" : "text-[#64748B]"}`} />
                    <span className="font-heading text-[11px] font-bold text-[#0F172A] leading-tight">{step.title}</span>
                  </div>
                  <p className="text-[10px] text-[#64748B] leading-snug line-clamp-2 hidden sm:block">{step.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Workflow Interactive Spotlight Card */}
          <div className="glass-card p-8 sm:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <TechBadge label={`Stage ${workflowSteps[selectedWorkflowStep].step}`} variant="blue" />
                <h3 className="font-heading text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
                  {workflowSteps[selectedWorkflowStep].title}
                </h3>
                <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
                  {workflowSteps[selectedWorkflowStep].desc}. EcoIntel uses computer vision models and neural spectral synthesis to process hardware batches at enterprise scale.
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-[#16A34A] pt-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Fully Automated · Industrial Line Compatible · ISO Certified</span>
                </div>
              </div>

              <div className="lg:col-span-5 h-56 rounded-2xl bg-gradient-to-br from-[#EFF6FF] via-[#F8FAFC] to-[#EFF6FF] border border-[#BFDBFE]/60 flex flex-col items-center justify-center p-6 text-center shadow-inner">
                <div className="w-14 h-14 rounded-2xl bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center mb-4">
                  {React.createElement(workflowSteps[selectedWorkflowStep].icon, {
                    className: "w-7 h-7 text-[#2563EB]",
                  })}
                </div>
                <span className="font-mono text-xs font-bold text-[#0F172A]">
                  Stage {workflowSteps[selectedWorkflowStep].step} — {workflowSteps[selectedWorkflowStep].title}
                </span>
                <span className="text-[11px] text-[#64748B] font-mono mt-1">
                  Enterprise API payload ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PLATFORM OVERVIEW MODULES ───────────────────────── */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionHeader
            badge="Platform Overview"
            title="Six Core Intelligence Modules"
            subtitle="Explore EcoIntel's modular deep tech ecosystem designed for recyclers, OEMs, and sustainability researchers."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformOverviewCards.map((card) => {
              const IconComp = card.icon;
              return (
                <Link key={card.title} href={card.href}>
                  <div className="glass-card-interactive p-7 h-full flex flex-col justify-between group">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE]/60 text-[#2563EB] flex items-center justify-center group-hover:bg-[#2563EB] group-hover:text-white transition-all duration-200 shadow-sm">
                          <IconComp className="w-5 h-5" />
                        </div>
                        <TechBadge label={card.stat} variant="blue" />
                      </div>

                      <span className="font-mono text-[10px] text-[#2563EB] uppercase tracking-[0.1em] block font-bold">
                        {card.badge}
                      </span>
                      <h3 className="font-heading text-lg sm:text-xl font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors tracking-tight">
                        {card.title}
                      </h3>
                      <p className="text-sm text-[#64748B] leading-relaxed">
                        {card.desc}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-slate-200/60 mt-6 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#2563EB]">Learn More</span>
                      <div className="w-7 h-7 rounded-full bg-[#EFF6FF] flex items-center justify-center group-hover:bg-[#2563EB] transition-all duration-200">
                        <ArrowRight className="w-3.5 h-3.5 text-[#2563EB] group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── PRECIOUS METAL INTELLIGENCE ──────────────────────── */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionHeader
            badge="Urban Mining Spectrometry"
            title="Precious Metal Intelligence"
            subtitle="Photorealistic estimation of recoverable Gold, Silver, Copper, and Palladium elements before pyrometallurgical processing."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 h-[400px] rounded-3xl glass-panel overflow-hidden">
              <MetallicCubes3D />
            </div>

            <div className="lg:col-span-6 space-y-4">
              {[
                { symbol: "Au", name: "Gold (79)", yield: "280–350 g / Ton", price: "$78.40/g", bg: "bg-[#FEF9C3]", color: "text-[#C9A227]", border: "border-[#FDE047]" },
                { symbol: "Ag", name: "Silver (47)", yield: "1,200–1,800 g / Ton", price: "$0.95/g", bg: "bg-[#F1F5F9]", color: "text-[#475569]", border: "border-[#E2E8F0]" },
                { symbol: "Cu", name: "Copper (29)", yield: "15,000–20,000 g / Ton", price: "$0.009/g", bg: "bg-[#FFF7ED]", color: "text-[#EA580C]", border: "border-[#FED7AA]" },
                { symbol: "Pd", name: "Palladium (46)", yield: "30–60 g / Ton", price: "$49.20/g", bg: "bg-[#EFF6FF]", color: "text-[#2563EB]", border: "border-[#BFDBFE]" },
              ].map((metal) => (
                <div key={metal.symbol} className="glass-card p-5 hover:border-[#2563EB]/30 transition-all duration-200 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${metal.bg} border ${metal.border} flex items-center justify-center font-mono font-extrabold text-lg ${metal.color} flex-shrink-0 shadow-sm`}>
                    {metal.symbol}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-heading text-base font-bold text-[#0F172A] tracking-tight">{metal.name}</h4>
                    <span className="text-xs font-mono text-[#64748B]">{metal.yield}</span>
                  </div>
                  <span className={`text-sm font-mono font-bold ${metal.color} flex-shrink-0`}>{metal.price}</span>
                </div>
              ))}

              <Link href="/platform/metals" className="block pt-2">
                <button className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB] hover:gap-3 transition-all duration-200 cursor-pointer">
                  <span>Explore Metal Intelligence</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────── */}
      <section className="py-24 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-8">
          <div className="glass-panel p-12 sm:p-18 text-center relative overflow-hidden">
            <div className="absolute inset-0 radial-glow-blue pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center shadow-sm">
                <Cpu className="w-7 h-7 text-[#2563EB]" />
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight max-w-xl">
                Ready to Build the Circular Electronics Future?
              </h2>
              <p className="text-base text-[#475569] leading-relaxed max-w-lg">
                Deploy EcoIntel AI inspection pipelines directly into your recycling facility or hardware production line.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Link href="/console">
                  <button className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#0F172A] text-white text-sm font-semibold transition-all duration-200 hover:bg-[#1E293B] hover:shadow-[0_0_0_3px_rgba(37,99,235,0.2),0_12px_28px_-6px_rgba(37,99,235,0.35)] cursor-pointer group shadow-lg shadow-slate-900/20">
                    <span>Launch Console</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <Link href="/about">
                  <button className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full glass-pill text-[#475569] text-sm font-semibold hover:bg-white hover:text-[#0F172A] transition-all duration-200 cursor-pointer">
                    Contact AI Lab
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
