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
  FileText,
  Building,
  Radio,
  Zap,
  Globe,
  Database,
  Search,
} from "lucide-react";

// Dynamically import photorealistic 3D light studio scenes with ssr: false
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
    {
      step: "01",
      title: "Collect E-Waste",
      desc: "Scanned and indexed e-waste batches from global recyclers",
      icon: Database,
    },
    {
      step: "02",
      title: "AI Inspection",
      desc: "Sub-millimeter spectro-spatial neural scanning",
      icon: Cpu,
    },
    {
      step: "03",
      title: "PCB Reconstruction",
      desc: "Generative CAD topology & Gerber netlist generation",
      icon: Layers,
    },
    {
      step: "04",
      title: "Health Prediction",
      desc: "Physics-informed ML predicts remaining lifespan",
      icon: Activity,
    },
    {
      step: "05",
      title: "Digital Passport",
      desc: "Polygon ERC-721 product passport minted",
      icon: ShieldCheck,
    },
    {
      step: "06",
      title: "Marketplace",
      desc: "Listed on B2B circular hardware exchange",
      icon: ShoppingCart,
    },
    {
      step: "07",
      title: "Carbon Report",
      desc: "Quantified ESG Scope 3 emissions avoided",
      icon: Leaf,
    },
  ];

  const platformOverviewCards = [
    {
      badge: "VISION & SPECTROMETRY",
      title: "AI Component Detection",
      desc: "Detect and classify electronic components down to 50 microns with sub-millimeter precision.",
      href: "/platform/detection",
      stat: "99.2% Accuracy",
      icon: Cpu,
    },
    {
      badge: "GENERATIVE GRAPH AI",
      title: "PCB Reconstruction",
      desc: "Reconstruct severed copper traces and generate KiCad & Gerber CAD schematics automatically.",
      href: "/platform/reconstruction",
      stat: "100% Netlist Match",
      icon: Layers,
    },
    {
      badge: "PHYSICS-INFORMED ML",
      title: "Remaining Useful Life (RUL)",
      desc: "Electro-thermal physics simulations predict exact component lifespan across operational years.",
      href: "/platform/rul",
      stat: "50,000 Hr Baseline",
      icon: Activity,
    },
    {
      badge: "URBAN MINING SPECTROMETRY",
      title: "Precious Metal Intelligence",
      desc: "Estimate recoverable Gold, Silver, Copper, and Palladium yields before processing.",
      href: "/platform/metals",
      stat: "$78.40/g Gold Value",
      icon: Coins,
    },
    {
      badge: "POLYGON BLOCKCHAIN",
      title: "Blockchain Passport",
      desc: "Mint immutable ERC-721 product passports tracking origin, health grade, and reuse cycles.",
      href: "/platform/passport",
      stat: "Polygon Mainnet",
      icon: ShieldCheck,
    },
    {
      badge: "CIRCULAR B2B EXCHANGE",
      title: "Circular Marketplace",
      desc: "Trade verified hardware with embedded passports, verified lifespan, and instant escrow.",
      href: "/marketplace",
      stat: "1.4M Components",
      icon: ShoppingCart,
    },
  ];

  return (
    <main className="relative z-10 flex flex-col min-h-screen bg-[#F8FAFC]">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 flex flex-col gap-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] w-fit">
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
                <span className="text-xs font-mono tracking-wider uppercase text-[#2563EB] font-semibold">
                  INTELLIGENCE FOR THE CIRCULAR ELECTRONICS ECONOMY
                </span>
              </div>

              <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-[1.1]">
                Intelligence for the Circular Electronics Economy
              </h1>

              <p className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-xl">
                AI-powered operating platform to detect, diagnose, and recover maximum value from electronic waste—sustainably, accurately, and intelligently.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <Link href="/platform/detection" className="w-full sm:w-auto">
                  <PrimaryButton variant="primary" size="lg" className="w-full sm:w-auto">
                    <span>Explore Platform</span>
                    <ArrowRight className="w-4 h-4" />
                  </PrimaryButton>
                </Link>

                <Link href="/console" className="w-full sm:w-auto">
                  <PrimaryButton variant="outline" size="lg" className="w-full sm:w-auto">
                    <Play className="w-4 h-4 text-[#2563EB]" />
                    <span>Watch Demo</span>
                  </PrimaryButton>
                </Link>
              </div>

              {/* Trusted Innovators Bar */}
              <div className="pt-8 border-t border-[#E2E8F0] flex flex-col gap-3">
                <span className="text-xs font-mono text-[#64748B] uppercase tracking-wider">
                  Trusted by Electronics Innovators Worldwide
                </span>
                <div className="flex items-center gap-6 text-xs font-mono text-[#475569] font-medium">
                  <span>TerraCycle</span>
                  <span>LUMAFUSE</span>
                  <span>EcoSynch</span>
                  <span>ReMaterials</span>
                </div>
              </div>
            </div>

            {/* Right Photorealistic 3D Light Studio Scene */}
            <div className="lg:col-span-6 h-[480px] sm:h-[540px] relative rounded-3xl bg-white border border-[#E2E8F0] shadow-2xl overflow-hidden">
              <LabHeroRoboticScene />

              {/* Floating Studio Telemetry Badges */}
              <div className="absolute top-6 left-6 z-20">
                <FloatingBadge
                  icon={<Cpu className="w-4 h-4 text-[#2563EB]" />}
                  label="Component Detected"
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
            </div>

          </div>
        </div>
      </section>

      {/* METRIC BANNER */}
      <section className="py-8 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            <div className="p-4 rounded-xl bg-[#F8FAFC]">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#0F172A] block">120K+</span>
              <span className="text-xs text-[#64748B] font-mono">Components Analyzed</span>
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAFC]">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#2563EB] block">8,450+</span>
              <span className="text-xs text-[#64748B] font-mono">PCBs Reconstructed</span>
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAFC]">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#C9A227] block">2.4 Tons</span>
              <span className="text-xs text-[#64748B] font-mono">Metals Recovered</span>
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAFC]">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#16A34A] block">96.3 Tons</span>
              <span className="text-xs text-[#64748B] font-mono">CO₂ Impact Reduced</span>
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAFC] col-span-2 md:col-span-1">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#0F172A] block">73K+</span>
              <span className="text-xs text-[#64748B] font-mono">Active Passport IDs</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW ECOINTEL WORKS (HORIZONTAL 7-STAGE WORKFLOW) */}
      <section className="py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionHeader
            badge="02 | PLATFORM WORKFLOW"
            title="How EcoIntel Works"
            subtitle="End-to-end circular electronics intelligence platform transforming discarded hardware into verified high-value digital assets."
          />

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mb-8">
            {workflowSteps.map((step, idx) => {
              const IconComp = step.icon;
              const isSelected = selectedWorkflowStep === idx;
              return (
                <button
                  key={step.step}
                  onClick={() => setSelectedWorkflowStep(idx)}
                  className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white border-[#2563EB] shadow-lg"
                      : "bg-white/60 border-[#E2E8F0] hover:bg-white"
                  }`}
                >
                  <span className="font-mono text-xs text-[#2563EB] block font-bold mb-1">{step.step}</span>
                  <div className="flex items-center gap-2 mb-2">
                    <IconComp className={`w-4 h-4 ${isSelected ? "text-[#2563EB]" : "text-[#64748B]"}`} />
                    <span className="font-heading text-xs font-bold text-[#0F172A] line-clamp-1">{step.title}</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-tight line-clamp-2">{step.desc}</p>
                </button>
              );
            })}
          </div>

          <LabCard className="p-8 bg-white border-[#E2E8F0]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <TechBadge label={`Stage ${workflowSteps[selectedWorkflowStep].step}`} variant="blue" />
                <h3 className="font-heading text-2xl sm:text-3xl font-bold text-[#0F172A]">
                  {workflowSteps[selectedWorkflowStep].title}
                </h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  {workflowSteps[selectedWorkflowStep].desc}. EcoIntel uses computer vision models and neural spectral synthesis to process hardware batches at scale.
                </p>
                <div className="pt-2 flex items-center gap-4 text-xs font-mono text-[#16A34A]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Fully Automated Industrial Line Compatible</span>
                </div>
              </div>

              <div className="lg:col-span-6 h-64 rounded-2xl bg-[#F1F5F9] border border-[#E2E8F0] flex flex-col items-center justify-center p-6 text-center">
                <Cpu className="w-12 h-12 text-[#2563EB] animate-pulse mb-3" />
                <span className="font-mono text-sm font-bold text-[#0F172A]">
                  Workflow Interactive Step {selectedWorkflowStep + 1}
                </span>
                <span className="text-xs text-[#64748B] font-mono mt-1">
                  Ready for enterprise API payload execution
                </span>
              </div>
            </div>
          </LabCard>
        </div>
      </section>

      {/* PLATFORM OVERVIEW CARDS (6 MODULES) */}
      <section className="py-24 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionHeader
            badge="03 | PLATFORM OVERVIEW"
            title="Six Core Intelligence Modules"
            subtitle="Explore EcoIntel's modular deep tech ecosystem designed for recyclers, original equipment manufacturers, and sustainability researchers."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {platformOverviewCards.map((card) => {
              const IconComp = card.icon;
              return (
                <Link key={card.title} href={card.href}>
                  <LabCard interactive className="p-8 h-full flex flex-col justify-between group">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                          <IconComp className="w-5 h-5" />
                        </div>
                        <TechBadge label={card.stat} variant="blue" />
                      </div>

                      <span className="font-mono text-[11px] text-[#2563EB] uppercase tracking-wider block">
                        {card.badge}
                      </span>
                      <h3 className="font-heading text-xl font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs text-[#64748B] leading-relaxed">
                        {card.desc}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-[#E2E8F0] mt-6 flex items-center justify-between text-xs font-semibold text-[#2563EB]">
                      <span>Learn More</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </LabCard>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* TECHNOLOGY STACK (FLOATING 3D ICONS) */}
      <section className="py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionHeader
            badge="04 | TECHNOLOGY STACK"
            title="Powered by Deep Tech Infrastructure"
            subtitle="Combining real-time computer vision, physics-informed machine learning, and decentralized blockchain registries."
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
            {[
              { name: "YOLOv8", role: "AI Vision" },
              { name: "OpenCV", role: "Spectrometry" },
              { name: "FastAPI", role: "Async API" },
              { name: "MongoDB Atlas", role: "Schema DB" },
              { name: "Polygon POS", role: "Blockchain" },
              { name: "Next.js 15", role: "App Framework" },
            ].map((tech) => (
              <LabCard key={tech.name} className="p-6 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#2563EB] font-bold mb-3 font-mono">
                  {tech.name.substring(0, 3)}
                </div>
                <h4 className="font-heading text-sm font-bold text-[#0F172A]">{tech.name}</h4>
                <span className="text-[11px] font-mono text-[#64748B]">{tech.role}</span>
              </LabCard>
            ))}
          </div>
        </div>
      </section>

      {/* IMPACT & METALLIC CUBES PREVIEW */}
      <section className="py-24 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionHeader
            badge="06 | PRECIOUS METAL ESTIMATION"
            title="Urban Mining Spectrometry"
            subtitle="Photorealistic estimation of recoverable Gold, Silver, Copper, and Palladium elements before pyrometallurgical processing."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 h-[380px] rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] overflow-hidden">
              <MetallicCubes3D />
            </div>

            <div className="lg:col-span-6 space-y-6">
              <LabCard className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FEF9C3] text-[#C9A227] flex items-center justify-center font-bold font-mono text-xl">
                    Au
                  </div>
                  <div>
                    <h4 className="font-heading text-lg font-bold text-[#0F172A]">Gold (79) Yield</h4>
                    <span className="text-xs font-mono text-[#64748B]">280 - 350 grams / Ton e-waste ($78.40/g)</span>
                  </div>
                </div>
              </LabCard>

              <LabCard className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#F1F5F9] text-[#475569] flex items-center justify-center font-bold font-mono text-xl">
                    Ag
                  </div>
                  <div>
                    <h4 className="font-heading text-lg font-bold text-[#0F172A]">Silver (47) Yield</h4>
                    <span className="text-xs font-mono text-[#64748B]">1,200 - 1,800 grams / Ton e-waste ($0.95/g)</span>
                  </div>
                </div>
              </LabCard>

              <Link href="/platform/metals">
                <PrimaryButton variant="secondary" size="md" className="w-full sm:w-auto mt-2">
                  <span>Explore Metal Intelligence</span>
                  <ArrowRight className="w-4 h-4" />
                </PrimaryButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-24 bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <LabCard className="p-10 sm:p-16 text-center bg-white border-[#E2E8F0] shadow-xl">
            <div className="flex flex-col items-center space-y-6 max-w-2xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#0F172A]">
                Ready to Build the Circular Electronics Future?
              </h2>
              <p className="text-base text-[#475569] leading-relaxed">
                Deploy EcoIntel AI inspection pipelines directly into your recycling facility or hardware production line.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <Link href="/console">
                  <PrimaryButton variant="primary" size="lg">
                    <span>Launch Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </PrimaryButton>
                </Link>
                <Link href="/about">
                  <PrimaryButton variant="outline" size="lg">
                    <span>Contact AI Lab</span>
                  </PrimaryButton>
                </Link>
              </div>
            </div>
          </LabCard>
        </div>
      </section>

      <Footer />
    </main>
  );
}
