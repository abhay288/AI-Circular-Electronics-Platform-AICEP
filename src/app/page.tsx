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
  Recycle,
  Sparkles,
  Zap,
} from "lucide-react";

const LabHeroRoboticScene = dynamic(
  () => import("@/components/3d/LabHeroRoboticScene"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#F1F5F9] rounded-3xl p-8">
        <Cpu className="w-10 h-10 text-[#2563EB] animate-pulse mb-3" />
        <span className="font-mono text-xs font-bold text-[#0F172A]">Loading 3D AI Vision Inspection Scene...</span>
      </div>
    ),
  }
);

const MetallicCubes3D = dynamic(
  () => import("@/components/3d/MetallicCubes3D"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#F1F5F9] rounded-3xl p-8">
        <Coins className="w-10 h-10 text-[#C9A227] animate-pulse mb-3" />
        <span className="font-mono text-xs font-bold text-[#0F172A]">Loading Metal Yield Spectrometry Scene...</span>
      </div>
    ),
  }
);

const RecyclingGlobe3D = dynamic(
  () => import("@/components/3d/RecyclingGlobe3D"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#F1F5F9] rounded-3xl p-8">
        <Recycle className="w-10 h-10 text-[#16A34A] animate-pulse mb-3" />
        <span className="font-mono text-xs font-bold text-[#0F172A]">Loading 3D Recycling Globe...</span>
      </div>
    ),
  }
);

export default function Home() {
  const [selectedPhase, setSelectedPhase] = useState(0);

  const platformPhases = [
    {
      phase: "PHASE 01",
      title: "E-Waste Intake & Neural Inspection",
      shortDesc: "Sub-millimeter spectro-spatial neural scanning & e-waste batch classification",
      fullDesc: "Electronic waste batches from global recyclers are scanned down to 50 microns using multi-spectrum computer vision to divert toxic e-waste components away from landfills.",
      icon: Cpu,
      stats: "99.2% E-Waste Precision",
    },
    {
      phase: "PHASE 02",
      title: "Generative CAD & PCB Reconstruction",
      shortDesc: "PCB micro-trace reconstruction & automated Gerber netlist synthesis",
      fullDesc: "Generative Graph Neural Topology (GGNT) algorithms reconstruct damaged or severed multilayer copper traces, restoring broken e-waste circuit boards into production CAD schematics.",
      icon: Layers,
      stats: "100% Netlist Match",
    },
    {
      phase: "PHASE 03",
      title: "Lifespan & Precious Metals Mining",
      shortDesc: "Physics-informed RUL prediction & urban metal yield spectrometry",
      fullDesc: "Electro-thermal physics simulations calculate component degradation and predict remaining operational lifespan (RUL) while spectrometry estimates recoverable Gold, Silver, and Copper yields.",
      icon: Coins,
      stats: "$78.40/g Gold Value",
    },
    {
      phase: "PHASE 04",
      title: "Digital Passport & Circular Exchange",
      shortDesc: "Polygon ERC-721 product passports & verified hardware marketplace",
      fullDesc: "Every recovered component receives a Polygon blockchain Digital Product Passport detailing origin facility, health grade, and Scope 3 carbon reduction proofs.",
      icon: ShieldCheck,
      stats: "Polygon Mainnet Verified",
    },
  ];

  const platformOverviewCards = [
    {
      badge: "VISION & SPECTROMETRY",
      title: "AI Component Detection",
      desc: "Detect and classify discarded electronic waste components down to 50 microns with sub-millimeter spectro-spatial precision.",
      href: "/platform/detection",
      stat: "99.2% Accuracy",
      icon: Cpu,
    },
    {
      badge: "GENERATIVE GRAPH AI",
      title: "PCB Topology Reconstruction",
      desc: "Reconstruct severed copper traces on damaged e-waste boards and generate KiCad & Gerber CAD schematics automatically.",
      href: "/platform/reconstruction",
      stat: "100% Netlist Match",
      icon: Layers,
    },
    {
      badge: "PHYSICS-INFORMED ML",
      title: "Remaining Useful Life (RUL)",
      desc: "Electro-thermal physics simulations predict exact component lifespan across operational years, enabling safe hardware reuse.",
      href: "/platform/rul",
      stat: "50,000 Hr Baseline",
      icon: Activity,
    },
    {
      badge: "URBAN MINING SPECTROMETRY",
      title: "Precious Metal Intelligence",
      desc: "Estimate recoverable Gold, Silver, Copper, and Palladium yields from e-waste before pyrometallurgical processing.",
      href: "/platform/metals",
      stat: "$78.40/g Gold Value",
      icon: Coins,
    },
    {
      badge: "POLYGON BLOCKCHAIN",
      title: "Blockchain Component Passport",
      desc: "Mint immutable ERC-721 product passports tracking origin facility, verified health grade, and circular reuse cycles.",
      href: "/platform/passport",
      stat: "Polygon Mainnet",
      icon: ShieldCheck,
    },
    {
      badge: "CIRCULAR B2B EXCHANGE",
      title: "Circular Hardware Marketplace",
      desc: "Trade verified recovered components with embedded product passports, verified lifespan, and instant smart contract escrow.",
      href: "/marketplace",
      stat: "1.4M Components",
      icon: ShoppingCart,
    },
  ];

  const metrics = [
    { value: "120K+", label: "E-Waste PCBs Analyzed", color: "text-[#0F172A]" },
    { value: "8,450+", label: "PCBs Reconstructed", color: "text-[#2563EB]" },
    { value: "2.4 Tons", label: "Precious Metals Mined", color: "text-[#D97706]" },
    { value: "96.3 Tons", label: "E-Waste Diverted From Landfill", color: "text-[#16A34A]" },
    { value: "73K+", label: "Polygon Component Passports", color: "text-[#0F172A]" },
  ];

  return (
    <main className="relative flex flex-col min-h-screen bg-[#F1F5F9]">
      <Navbar />

      {/* ─── HERO SECTION ─────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-blueprint opacity-100 pointer-events-none" />
        <div className="absolute -left-32 top-1/4 w-[500px] h-[500px] rounded-full bg-[#E0F2FE]/60 blur-[130px] pointer-events-none" />
        <div className="absolute right-0 top-1/3 w-[600px] h-[600px] rounded-full bg-[#DCFCE7]/50 blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Content Column */}
            <div className="lg:col-span-6 flex flex-col gap-7">

              {/* E-Waste Reduction Pill Badge */}
              <div className="glass-pill inline-flex items-center gap-2 px-4 py-2 w-fit">
                <Recycle className="w-4 h-4 text-[#16A34A] animate-pulse" />
                <span className="text-[10px] font-mono tracking-[0.14em] uppercase text-[#16A34A] font-bold">
                  AI E-WASTE ELIMINATION & HARDWARE RECOVERY ENGINE
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-heading text-[52px] sm:text-[66px] md:text-[80px] font-extrabold leading-[1.01] tracking-[-0.04em] text-[#0F172A]">
                Intelligence<br />
                for the{" "}
                <span className="bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#1D4ED8] bg-clip-text text-transparent">
                  Circular<br />Electronics
                </span>
                {" "}Economy
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-[17px] text-[#475569] leading-[1.75] max-w-[520px]">
                Transforming global electronic waste into verified digital hardware assets. EcoIntel combines sub-millimeter computer vision, generative CAD topology, and Polygon blockchain passports to divert microchips from toxic landfills.
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

              {/* Trust & E-Waste Impact Bar */}
              <div className="pt-6 border-t border-[#CBD5E1]/60">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#64748B] font-semibold">
                    Trusted by E-Waste Recyclers & Manufacturers
                  </p>
                  <span className="text-[10px] font-mono text-[#16A34A] font-bold">96.3 Tons Landfill Diverted</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["TerraCycle", "LUMAFUSE", "EcoSynch", "ReMaterials", "Tokyo Recycling"].map((tag) => (
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
                    icon={<Coins className="w-4 h-4 text-[#D97706]" />}
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
                  <div className="px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white shadow-xl shadow-slate-900/10 flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-heading font-extrabold text-xs text-[#0F172A]">LM358 Microchip</span>
                      <span className="text-[10px] font-mono text-[#16A34A] font-bold">92% Health · Grade A+</span>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/3 right-6 z-20 hidden sm:block">
                  <div className="px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white shadow-xl shadow-slate-900/10 flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] animate-pulse flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-heading font-extrabold text-xs text-[#0F172A]">ATmega328P</span>
                      <span className="text-[10px] font-mono text-[#2563EB] font-bold">6.4 Years RUL</span>
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
            badge="E-Waste Platform Workflow"
            title="How EcoIntel Eliminates E-Waste"
            subtitle="Four core intelligent phases transforming e-waste into verified high-value digital hardware assets."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {platformPhases.map((phaseItem, idx) => {
              const IconComp = phaseItem.icon;
              const isSelected = selectedPhase === idx;
              return (
                <div
                  key={phaseItem.phase}
                  onClick={() => setSelectedPhase(idx)}
                  className={`glass-card p-8 cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? "border-[#2563EB] bg-white shadow-xl shadow-blue-500/10"
                      : "hover:bg-white/90 hover:border-[#BFDBFE]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold text-[#2563EB] tracking-widest">
                      {phaseItem.phase}
                    </span>
                    <TechBadge label={phaseItem.stats} variant={isSelected ? "blue" : "neutral"} />
                  </div>

                  <div className="flex items-center gap-3.5 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isSelected ? "bg-[#2563EB] text-white" : "bg-[#EFF6FF] text-[#2563EB]"
                    }`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-[#0F172A] tracking-tight">
                      {phaseItem.title}
                    </h3>
                  </div>

                  <p className="text-sm text-[#475569] leading-relaxed mb-4">
                    {phaseItem.fullDesc}
                  </p>

                  <div className="flex items-center gap-2 text-xs font-mono text-[#16A34A] pt-2 border-t border-slate-200/60">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Automated E-Waste Facility Line Compatible</span>
                  </div>
                </div>
              );
            })}
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
                  <div className="glass-card-interactive p-8 h-full flex flex-col justify-between group">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE]/60 text-[#2563EB] flex items-center justify-center group-hover:bg-[#2563EB] group-hover:text-white transition-all duration-200 shadow-sm">
                          <IconComp className="w-6 h-6" />
                        </div>
                        <TechBadge label={card.stat} variant="blue" />
                      </div>

                      <span className="font-mono text-[10px] text-[#2563EB] uppercase tracking-[0.12em] block font-bold">
                        {card.badge}
                      </span>
                      <h3 className="font-heading text-xl font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors tracking-tight">
                        {card.title}
                      </h3>
                      <p className="text-sm text-[#64748B] leading-relaxed">
                        {card.desc}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-slate-200/60 mt-6 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#2563EB]">Explore Module</span>
                      <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center group-hover:bg-[#2563EB] transition-all duration-200">
                        <ArrowRight className="w-4 h-4 text-[#2563EB] group-hover:text-white transition-colors" />
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
            subtitle="Photorealistic estimation of recoverable Gold, Silver, Copper, and Palladium elements from e-waste before processing."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 h-[420px] rounded-3xl glass-panel overflow-hidden">
              <MetallicCubes3D />
            </div>

            <div className="lg:col-span-6 space-y-4">
              {[
                { symbol: "Au", name: "Gold (79)", yield: "280–350 g / Ton e-waste", price: "$78.40/g", bg: "bg-[#FEF9C3]", color: "text-[#C9A227]", border: "border-[#FDE047]" },
                { symbol: "Ag", name: "Silver (47)", yield: "1,200–1,800 g / Ton e-waste", price: "$0.95/g", bg: "bg-[#F1F5F9]", color: "text-[#475569]", border: "border-[#E2E8F0]" },
                { symbol: "Cu", name: "Copper (29)", yield: "15,000–20,000 g / Ton e-waste", price: "$0.009/g", bg: "bg-[#FFF7ED]", color: "text-[#EA580C]", border: "border-[#FED7AA]" },
                { symbol: "Pd", name: "Palladium (46)", yield: "30–60 g / Ton e-waste", price: "$49.20/g", bg: "bg-[#EFF6FF]", color: "text-[#2563EB]", border: "border-[#BFDBFE]" },
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

      {/* ─── FINAL CTA (INTEGRATED PHOTOREALISTIC 3D RECYCLING GLOBE) ───── */}
      <section className="py-24 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="glass-panel p-8 sm:p-14 relative overflow-hidden">
            <div className="absolute inset-0 radial-glow-emerald pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              
              {/* Left CTA Text & Actions */}
              <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] border border-[#86EFAC] flex items-center justify-center shadow-sm">
                  <Recycle className="w-6 h-6 text-[#16A34A]" />
                </div>
                <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-[1.08]">
                  Ready to Eliminate E-Waste in Your Operations?
                </h2>
                <p className="text-base text-[#475569] leading-relaxed max-w-lg">
                  Deploy EcoIntel AI inspection pipelines directly into your high-volume hardware recycling facility or manufacturing line.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full sm:w-auto">
                  <Link href="/console" className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#0F172A] text-white text-sm font-semibold transition-all duration-200 hover:bg-[#1E293B] hover:shadow-[0_0_0_3px_rgba(37,99,235,0.2),0_12px_28px_-6px_rgba(37,99,235,0.35)] cursor-pointer group shadow-lg shadow-slate-900/20">
                      <span>Launch Console</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                  <Link href="/about" className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full glass-pill text-[#475569] text-sm font-semibold hover:bg-white hover:text-[#0F172A] transition-all duration-200 cursor-pointer">
                      Contact AI Lab
                    </button>
                  </Link>
                </div>
              </div>

              {/* Right Photorealistic 3D Recycling Globe */}
              <div className="lg:col-span-5 h-[340px] sm:h-[400px] rounded-3xl bg-gradient-to-br from-[#EFF6FF] via-[#F8FAFC] to-[#DCFCE7]/60 border border-white shadow-xl shadow-slate-900/5 relative overflow-hidden">
                <RecyclingGlobe3D />

                {/* Floating Telemetry Badge on 3D Recycling Scene */}
                <div className="absolute bottom-4 left-4 right-4 z-20">
                  <div className="glass-pill px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                      <span className="font-mono text-xs font-bold text-[#0F172A]">Zero-Landfill AI Engine</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#16A34A]">ISO 14001 Certified</span>
                  </div>
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
