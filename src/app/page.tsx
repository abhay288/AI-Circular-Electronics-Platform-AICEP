"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
import LabCard from "@/components/ui/LabCard";
import PrimaryButton from "@/components/ui/PrimaryButton";
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
  Sparkles,
  CheckCircle2,
  Database,
  Zap,
  Globe,
  ChevronRight,
  CircleDot,
} from "lucide-react";

const LabHeroRoboticScene = dynamic(
  () => import("@/components/3d/LabHeroRoboticScene"),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#F8FAFC]" /> }
);

const MetallicCubes3D = dynamic(
  () => import("@/components/3d/MetallicCubes3D"),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#F8FAFC]" /> }
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
    <main className="relative flex flex-col min-h-screen bg-[#F8FAFC]">
      <Navbar />

      {/* ─── HERO SECTION ─────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Blueprint dot grid background */}
        <div className="absolute inset-0 bg-blueprint opacity-100 pointer-events-none" />
        {/* Radial blue aura behind 3D */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2563EB]/[0.04] blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Content Column */}
            <div className="lg:col-span-6 flex flex-col gap-7">

              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                <span className="text-[10px] font-mono tracking-[0.12em] uppercase text-[#2563EB] font-bold">
                  Enterprise Circular Electronics Platform
                </span>
              </div>

              {/* Headline */}
              <div className="flex flex-col gap-1">
                <h1 className="font-heading text-[52px] sm:text-[64px] md:text-[76px] font-extrabold leading-[1.02] tracking-[-0.04em] text-[#0F172A]">
                  Intelligence<br />
                  for the{" "}
                  <span className="bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#1D4ED8] bg-clip-text text-transparent">
                    Circular<br />Electronics
                  </span>
                  {" "}Economy
                </h1>
              </div>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-[#475569] leading-[1.7] max-w-[500px] font-normal">
                AI-powered platform for detecting, reconstructing and extending the lifecycle of electronic components through Computer Vision, Machine Learning and Digital Product Passports.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                <Link href="/platform/detection" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-[#0F172A] text-white text-sm font-semibold transition-all duration-200 hover:bg-[#1E293B] hover:shadow-[0_0_0_3px_rgba(37,99,235,0.2),0_8px_24px_-6px_rgba(37,99,235,0.3)] active:scale-[0.98] cursor-pointer group">
                    <span>Explore Platform</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </button>
                </Link>

                <Link href="/console" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-white text-[#0F172A] text-sm font-semibold border border-[#E2E8F0] transition-all duration-200 hover:border-[#2563EB]/40 hover:bg-[#F8FAFC] cursor-pointer group">
                    <div className="w-5 h-5 rounded-full bg-[#EFF6FF] flex items-center justify-center group-hover:bg-[#2563EB]/10 transition-colors">
                      <Play className="w-2.5 h-2.5 fill-[#2563EB] text-[#2563EB]" />
                    </div>
                    <span>Watch Demo</span>
                  </button>
                </Link>
              </div>

              {/* Trust Strip */}
              <div className="pt-6 border-t border-[#E2E8F0]">
                <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-[#94A3B8] mb-3 font-medium">
                  Trusted by Electronics Innovators Worldwide
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Research Labs", "Manufacturers", "Repair Centers", "Universities", "Gov. Programs"].map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-[11px] font-mono text-[#475569] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 3D Studio Scene */}
            <div className="lg:col-span-6">
              <div className="relative h-[500px] sm:h-[580px] rounded-[2rem] bg-white border border-[#E2E8F0] shadow-[0_32px_64px_-12px_rgba(15,23,42,0.12),0_0_0_1px_rgba(15,23,42,0.02)] overflow-hidden">
                <LabHeroRoboticScene />

                {/* Floating Glass Telemetry Badges */}
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

                {/* Live Component Detection Labels */}
                <div className="absolute top-1/2 -translate-y-8 left-6 z-20 hidden sm:block">
                  <div className="px-3 py-2 rounded-xl glass-pill flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] font-bold text-[#0F172A]">LM358 IC</span>
                      <span className="text-[10px] font-mono text-[#16A34A]">92% Health · Verified</span>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/3 right-6 z-20 hidden sm:block">
                  <div className="px-3 py-2 rounded-xl glass-pill flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse flex-shrink-0" />
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

      {/* ─── METRICS STRIP ───────────────────────────────────── */}
      <section className="py-10 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-0 divide-x divide-[#F1F5F9]">
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
      </section>

      {/* ─── PLATFORM WORKFLOW ───────────────────────────────── */}
      <section className="py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionHeader
            badge="Platform Workflow"
            title="How EcoIntel Works"
            subtitle="End-to-end circular electronics intelligence platform transforming discarded hardware into verified high-value digital assets."
          />

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
                      ? "bg-white border-[#2563EB]/40 shadow-[0_4px_16px_-4px_rgba(37,99,235,0.15)]"
                      : "bg-white/60 border-[#E2E8F0] hover:bg-white hover:border-[#CBD5E1]"
                  }`}
                >
                  <span className="font-mono text-[10px] text-[#2563EB] block font-bold mb-2 tracking-widest">{step.step}</span>
                  <div className="flex items-center gap-1.5 mb-2">
                    <IconComp className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? "text-[#2563EB]" : "text-[#64748B]"}`} />
                    <span className="font-heading text-[11px] font-bold text-[#0F172A] leading-tight">{step.title}</span>
                  </div>
                  <p className="text-[10px] text-[#64748B] leading-snug line-clamp-2 hidden sm:block">{step.desc}</p>
                </button>
              );
            })}
          </div>

          <LabCard className="p-8 sm:p-10 bg-white">
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

              <div className="lg:col-span-5 h-52 rounded-2xl bg-gradient-to-br from-[#F8FAFC] to-[#EFF6FF] border border-[#E2E8F0] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center mb-4">
                  {React.createElement(workflowSteps[selectedWorkflowStep].icon, {
                    className: "w-7 h-7 text-[#2563EB]",
                  })}
                </div>
                <span className="font-mono text-xs font-bold text-[#0F172A]">
                  Stage {workflowSteps[selectedWorkflowStep].step} — {workflowSteps[selectedWorkflowStep].title}
                </span>
                <span className="text-[11px] text-[#64748B] font-mono mt-1.5">
                  Enterprise API payload ready
                </span>
              </div>
            </div>
          </LabCard>
        </div>
      </section>

      {/* ─── PLATFORM MODULES ────────────────────────────────── */}
      <section className="py-24 bg-white border-y border-[#E2E8F0]">
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
                  <LabCard interactive className="p-7 h-full flex flex-col justify-between group">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center group-hover:bg-[#2563EB] group-hover:text-white transition-all duration-200">
                          <IconComp className="w-5 h-5" />
                        </div>
                        <TechBadge label={card.stat} variant="blue" />
                      </div>

                      <span className="font-mono text-[10px] text-[#2563EB] uppercase tracking-[0.1em] block">
                        {card.badge}
                      </span>
                      <h3 className="font-heading text-lg sm:text-xl font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors tracking-tight">
                        {card.title}
                      </h3>
                      <p className="text-sm text-[#64748B] leading-relaxed">
                        {card.desc}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-[#F1F5F9] mt-6 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#2563EB]">Learn More</span>
                      <div className="w-7 h-7 rounded-full bg-[#EFF6FF] flex items-center justify-center group-hover:bg-[#2563EB] transition-all duration-200">
                        <ArrowRight className="w-3.5 h-3.5 text-[#2563EB] group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </LabCard>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── TECHNOLOGY STACK ────────────────────────────────── */}
      <section className="py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionHeader
            badge="Technology Stack"
            title="Powered by Deep Tech Infrastructure"
            subtitle="Combining real-time computer vision, physics-informed machine learning, and decentralized blockchain registries."
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { name: "YOLOv8", role: "AI Vision", abbr: "YOL" },
              { name: "OpenCV", role: "Spectrometry", abbr: "OCV" },
              { name: "FastAPI", role: "Async API", abbr: "API" },
              { name: "MongoDB Atlas", role: "Schema DB", abbr: "MDB" },
              { name: "Polygon POS", role: "Blockchain", abbr: "POL" },
              { name: "Next.js 15", role: "App Framework", abbr: "NXT" },
            ].map((tech) => (
              <LabCard key={tech.name} className="p-5 text-center flex flex-col items-center justify-center gap-3 hover:border-[#BFDBFE] transition-all duration-200">
                <div className="w-12 h-12 rounded-2xl bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#2563EB] font-mono font-bold text-xs">
                  {tech.abbr}
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-[#0F172A]">{tech.name}</h4>
                  <span className="text-[10px] font-mono text-[#64748B]">{tech.role}</span>
                </div>
              </LabCard>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRECIOUS METALS PREVIEW ─────────────────────────── */}
      <section className="py-24 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionHeader
            badge="Urban Mining Spectrometry"
            title="Precious Metal Intelligence"
            subtitle="Photorealistic estimation of recoverable Gold, Silver, Copper, and Palladium elements before pyrometallurgical processing."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 h-[380px] rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] overflow-hidden">
              <MetallicCubes3D />
            </div>

            <div className="lg:col-span-6 space-y-4">
              {[
                { symbol: "Au", name: "Gold (79)", yield: "280–350 g / Ton", price: "$78.40/g", bg: "bg-[#FEF9C3]", color: "text-[#C9A227]" },
                { symbol: "Ag", name: "Silver (47)", yield: "1,200–1,800 g / Ton", price: "$0.95/g", bg: "bg-[#F1F5F9]", color: "text-[#475569]" },
                { symbol: "Cu", name: "Copper (29)", yield: "15,000–20,000 g / Ton", price: "$0.009/g", bg: "bg-[#FFF7ED]", color: "text-[#EA580C]" },
                { symbol: "Pd", name: "Palladium (46)", yield: "30–60 g / Ton", price: "$49.20/g", bg: "bg-[#EFF6FF]", color: "text-[#2563EB]" },
              ].map((metal) => (
                <LabCard key={metal.symbol} className="p-5 hover:border-[#CBD5E1] transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${metal.bg} flex items-center justify-center font-mono font-extrabold text-lg ${metal.color} flex-shrink-0`}>
                      {metal.symbol}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-heading text-base font-bold text-[#0F172A] tracking-tight">{metal.name}</h4>
                      <span className="text-xs font-mono text-[#64748B]">{metal.yield}</span>
                    </div>
                    <span className={`text-sm font-mono font-bold ${metal.color} flex-shrink-0`}>{metal.price}</span>
                  </div>
                </LabCard>
              ))}

              <Link href="/platform/metals" className="block pt-2">
                <button className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB] hover:gap-3 transition-all duration-200">
                  <span>Explore Metal Intelligence</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────── */}
      <section className="py-24 bg-[#F8FAFC]">
        <div className="max-w-4xl mx-auto px-4 sm:px-8">
          <div className="relative p-12 sm:p-20 text-center bg-white border border-[#E2E8F0] rounded-[2rem] shadow-[0_20px_60px_-10px_rgba(15,23,42,0.10)] overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute inset-0 radial-glow-blue pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center">
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
                  <button className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#0F172A] text-white text-sm font-semibold transition-all duration-200 hover:bg-[#1E293B] hover:shadow-[0_0_0_3px_rgba(37,99,235,0.2),0_8px_24px_-6px_rgba(37,99,235,0.3)] cursor-pointer group">
                    <span>Launch Console</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <Link href="/about">
                  <button className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-transparent text-[#475569] text-sm font-semibold border border-[#E2E8F0] hover:border-[#2563EB]/40 hover:bg-white hover:text-[#0F172A] transition-all duration-200 cursor-pointer">
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
