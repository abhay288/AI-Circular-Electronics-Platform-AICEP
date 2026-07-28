"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
import LabCard from "@/components/ui/LabCard";
import PrimaryButton from "@/components/ui/PrimaryButton";
import TechBadge from "@/components/ui/TechBadge";
import { Wrench, CheckCircle2, AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function RepairIntelligencePage() {
  const [selectedAction, setSelectedAction] = useState<"reflow" | "reball" | "swap">("reflow");

  const actions = {
    reflow: {
      title: "Solder Reflow Thermal Process",
      feasibility: "94% Success Probability",
      cost: "$12.50 Estimated Cost",
      co2: "14.2 kg CO₂ Saved vs New Board",
      desc: "Apply targeted infrared thermal profile to eliminate micro-cracks across CPU BGA solder balls.",
    },
    reball: {
      title: "Full BGA Reballing Assembly",
      feasibility: "88% Success Probability",
      cost: "$28.00 Estimated Cost",
      co2: "22.0 kg CO₂ Saved vs New Board",
      desc: "Remove degraded BGA die, clean copper pad substrate, and deposit 0.4mm SAC305 lead-free solder spheres.",
    },
    swap: {
      title: "Component Direct Replacement",
      feasibility: "99% Success Probability",
      cost: "$45.00 Estimated Cost",
      co2: "35.8 kg CO₂ Saved vs New Board",
      desc: "Replace failed DrMOS MOSFET from EcoIntel verified inventory and re-test VRM phase stability.",
    },
  };

  const currentAction = actions[selectedAction];

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-[#2563EB] mb-6 hover:underline font-semibold">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Vision Overview</span>
          </Link>

          <SectionHeader
            badge="06 | HARDWARE REPAIR & REUSE INTELLIGENCE"
            title="AI Repair & Decision Engine"
            subtitle="Automated economic and technical diagnostics advising technicians whether to Reflow, Reball, Component Swap, or route to Pyrometallurgical Recovery."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 space-y-6">
              <LabCard className="p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                  <span className="font-mono text-xs font-bold text-[#0F172A] uppercase">
                    Select AI Diagnostic Recommendation
                  </span>
                  <TechBadge label="Repairability Score: 88/100" variant="green" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "reflow", label: "Solder Reflow" },
                    { key: "reball", label: "BGA Reball" },
                    { key: "swap", label: "Component Swap" },
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      onClick={() => setSelectedAction(btn.key as any)}
                      className={`p-3 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${
                        selectedAction === btn.key
                          ? "bg-[#2563EB] text-white border-[#2563EB] shadow-md"
                          : "bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-[#F1F5F9]"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <h3 className="font-heading text-xl font-bold text-[#0F172A]">{currentAction.title}</h3>
                  <p className="text-sm text-[#475569] leading-relaxed">{currentAction.desc}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[#64748B] block">Feasibility Probability</span>
                    <span className="text-[#16A34A] font-bold text-sm">{currentAction.feasibility}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[#64748B] block">Repair Cost</span>
                    <span className="text-[#2563EB] font-bold text-sm">{currentAction.cost}</span>
                  </div>
                </div>
              </LabCard>
            </div>

            <div className="lg:col-span-6">
              <LabCard className="p-8 space-y-6 bg-white">
                <h4 className="font-heading text-lg font-bold text-[#0F172A]">Why Repair Over Recycling?</h4>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  EcoIntel calculates that repairing this board preserves 94% of embodied energy and prevents virgin mining of 180 grams of copper substrate.
                </p>

                <div className="p-4 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-xs font-mono text-[#16A34A] font-semibold">
                  {currentAction.co2}
                </div>

                <PrimaryButton variant="primary" size="md" className="w-full">
                  <span>Generate Technician Repair Workorder</span>
                </PrimaryButton>
              </LabCard>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
