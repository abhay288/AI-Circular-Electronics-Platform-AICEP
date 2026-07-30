"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
import TechBadge from "@/components/ui/TechBadge";
import FloatingBadge from "@/components/ui/FloatingBadge";
import CountUpNumber from "@/components/ui/CountUpNumber";
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
  Wrench,
  ChevronRight,
  BarChart3,
  Pause,
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
  const [activeWorkflowStage, setActiveWorkflowStage] = useState(0);
  const [isAutoSliding, setIsAutoSliding] = useState(true);

  // 8-Stage Complete Workflow (Section 1 in Master Prompt)
  const workflowStages = [
    {
      step: "01",
      title: "Electronic Waste Intake",
      desc: "Batch e-waste indexing & spectro-spatial scanning intake from global recyclers.",
      icon: Database,
      badge: "BATCH INTAKE",
      detail: "Hardware batches from global recyclers are indexed into spectro-spatial intake streams, diverting toxic materials away from landfills.",
    },
    {
      step: "02",
      title: "AI Robotic Inspection",
      desc: "Sub-millimeter 50-micron industrial laser scanning & computer vision analysis.",
      icon: Cpu,
      badge: "50-MICRON SCAN",
      detail: "6-axis industrial robotic arms sweep multi-spectrum laser sensors across circuit board assemblies, identifying component boundaries.",
    },
    {
      step: "03",
      title: "Component Detection",
      desc: "Spectro-spatial neural models classify IC chips, microcontrollers, and capacitors.",
      icon: Sparkles,
      badge: "99.2% PRECISION",
      detail: "Neural object detection models segment every SMD, QFP, BGA package and microcontroller, mapping health grades and serial hashes.",
    },
    {
      step: "04",
      title: "PCB Reconstruction",
      desc: "Generative graph AI reconstructs damaged copper traces & synthesizes Gerber CAD.",
      icon: Layers,
      badge: "GERBER CAD SYNTHESIS",
      detail: "Generative Graph Neural Topology (GGNT) reconstructs severed multilayer copper traces, generating KiCad & Gerber schematics.",
    },
    {
      step: "05",
      title: "Remaining Useful Life",
      desc: "Physics-informed ML models predict remaining operational lifespan hours.",
      icon: Activity,
      badge: "PHYSICS ML SIMULATION",
      detail: "Electro-thermal physics simulations calculate component degradation under voltage stress, predicting exact remaining lifespan.",
    },
    {
      step: "06",
      title: "Precious Metal Yields",
      desc: "Urban mining spectrometry estimates Gold, Silver, Copper, and Palladium yields.",
      icon: Coins,
      badge: "URBAN MINING",
      detail: "Optical emission spectrometry quantifies precious metal yields ($78.40/g Gold) before pyrometallurgical recovery.",
    },
    {
      step: "07",
      title: "Blockchain Passport",
      desc: "Polygon ERC-721 Digital Product Passports minted for origin & health proof.",
      icon: ShieldCheck,
      badge: "POLYGON MAINNET",
      detail: "Immutable Polygon blockchain product passports record origin facility, health grade, and verified carbon offset proofs.",
    },
    {
      step: "08",
      title: "Circular B2B Exchange",
      desc: "Verified hardware listed on circular exchange with smart contract escrow.",
      icon: ShoppingCart,
      badge: "SMART ESCROW",
      detail: "Components are listed inside transparent marketplace capsules with embedded passports, verified lifespan, and instant escrow.",
    },
  ];

  // Auto-Sliding Interval Effect for How EcoIntel Works Section
  useEffect(() => {
    if (!isAutoSliding) return;
    const interval = setInterval(() => {
      setActiveWorkflowStage((prev) => (prev + 1) % workflowStages.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [isAutoSliding, workflowStages.length]);

  // 6 Platform Overview Cards (Section 2 in Master Prompt - Each linking to dedicated page)
  const platformOverviewCards = [
    {
      badge: "VISION & SPECTROMETRY",
      title: "AI Component Detection",
      desc: "Detect and classify electronic components down to 50 microns with sub-millimeter spectro-spatial neural precision.",
      href: "/platform/detection",
      stat: "99.2% Accuracy",
      icon: Cpu,
    },
    {
      badge: "GENERATIVE GRAPH AI",
      title: "PCB Reconstruction",
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
      badge: "AI REFLOW & REPAIR",
      title: "Repair Intelligence",
      desc: "AI-guided reflow, soldering fault diagnostics, and automated component replacement recommendations.",
      href: "/platform/repair",
      stat: "AI Fault Diagnostics",
      icon: Wrench,
    },
  ];

  const animatedMetrics = [
    { end: 120, suffix: "K+", label: "E-Waste PCBs Analyzed", color: "text-[#0F172A]" },
    { end: 8450, suffix: "+", label: "PCBs Reconstructed", color: "text-[#2563EB]" },
    { end: 2.4, suffix: " Tons", decimals: 1, label: "Precious Metals Mined", color: "text-[#D97706]" },
    { end: 96.3, suffix: " Tons", decimals: 1, label: "E-Waste Diverted From Landfill", color: "text-[#16A34A]" },
    { end: 73, suffix: "K+", label: "Polygon Component Passports", color: "text-[#0F172A]" },
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
                  THE INTELLIGENCE LAYER FOR CIRCULAR ELECTRONICS
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

      {/* ─── ANIMATED COUNT-UP METRICS BANNER ───────────────────── */}
      <section className="py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="glass-panel p-3 shadow-xl">
            <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-slate-200/80">
              {animatedMetrics.map((m) => (
                <div key={m.label} className="px-6 py-6 flex flex-col items-center text-center group">
                  <CountUpNumber
                    end={m.end}
                    duration={2400}
                    suffix={m.suffix}
                    decimals={m.decimals || 0}
                    className={`font-mono text-3xl sm:text-4xl font-extrabold tracking-tight block ${m.color} group-hover:scale-105 transition-transform duration-200`}
                  />
                  <span className="text-[11px] text-[#475569] font-mono font-semibold mt-1.5 leading-snug">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 1: HOW ECOINTEL WORKS (AUTO-SLIDABLE 8-STAGE WORKFLOW) ─── */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <SectionHeader
              badge="Platform Workflow"
              title="How EcoIntel Works"
              subtitle="Transforming electronic waste into intelligent digital assets through an 8-stage automated workflow."
            />

            {/* Auto-Slide Controls */}
            <div className="flex items-center gap-2 self-start md:self-auto mb-6">
              <button
                onClick={() => setIsAutoSliding(!isAutoSliding)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                  isAutoSliding
                    ? "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]"
                    : "bg-white text-[#64748B] border-[#E2E8F0]"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isAutoSliding ? "bg-[#2563EB] animate-pulse" : "bg-[#94A3B8]"}`} />
                <span>{isAutoSliding ? "Auto-Play Active" : "Paused"}</span>
              </button>
            </div>
          </div>

          {/* Workflow Stage Tabs with Auto-Slide Progress Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-8">
            {workflowStages.map((st, idx) => {
              const IconComp = st.icon;
              const isSelected = activeWorkflowStage === idx;
              return (
                <button
                  key={st.step}
                  onClick={() => {
                    setActiveWorkflowStage(idx);
                    setIsAutoSliding(false);
                  }}
                  className={`p-3 rounded-2xl text-left border relative overflow-hidden transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? "bg-white border-[#2563EB] shadow-lg shadow-blue-500/10 scale-[1.02]"
                      : "glass-card hover:bg-white"
                  }`}
                >
                  {/* Top Progress Line for Active Stage */}
                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#2563EB] animate-pulse" />
                  )}
                  <span className="font-mono text-[10px] text-[#2563EB] block font-bold mb-1 tracking-widest">{st.step}</span>
                  <div className="flex items-center gap-1.5">
                    <IconComp className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? "text-[#2563EB]" : "text-[#64748B]"}`} />
                    <span className="font-heading text-[11px] font-bold text-[#0F172A] leading-tight line-clamp-1">{st.title}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Stage Spotlight Panel */}
          <div className="glass-card p-8 sm:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-3">
                  <TechBadge label={`Stage ${workflowStages[activeWorkflowStage].step}`} variant="blue" />
                  <span className="font-mono text-xs font-bold text-[#2563EB] uppercase tracking-wider">
                    {workflowStages[activeWorkflowStage].badge}
                  </span>
                </div>

                <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  {workflowStages[activeWorkflowStage].title}
                </h3>

                <p className="text-base text-[#475569] leading-relaxed">
                  {workflowStages[activeWorkflowStage].detail}
                </p>

                <div className="pt-4 flex items-center gap-3 border-t border-slate-200/60">
                  <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                  <span className="text-xs font-mono font-semibold text-[#16A34A]">
                    Automated Facility Stream · ISO 14001 Compliant
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 h-64 rounded-3xl bg-gradient-to-br from-[#EFF6FF] via-[#F8FAFC] to-[#DCFCE7]/40 border border-[#BFDBFE]/60 flex flex-col items-center justify-center p-6 text-center shadow-inner relative overflow-hidden">
                <div className="w-16 h-16 rounded-2xl bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center mb-4 transition-transform duration-300 transform hover:scale-110">
                  {React.createElement(workflowStages[activeWorkflowStage].icon, {
                    className: "w-8 h-8 text-[#2563EB]",
                  })}
                </div>
                <span className="font-heading text-base font-bold text-[#0F172A]">
                  Stage {workflowStages[activeWorkflowStage].step} — {workflowStages[activeWorkflowStage].title}
                </span>
                <span className="text-xs text-[#64748B] font-mono mt-1.5">
                  {workflowStages[activeWorkflowStage].desc}
                </span>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: PLATFORM OVERVIEW (6 FEATURE MODULE CARDS) ─── */}
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
                      <span className="text-xs font-semibold text-[#2563EB]">Learn More</span>
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

      {/* ─── FINAL CTA ───────────────────────────────────────── */}
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

                {/* Floating Telemetry Badge */}
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
