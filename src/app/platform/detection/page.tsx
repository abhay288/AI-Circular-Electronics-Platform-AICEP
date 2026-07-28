"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
import LabCard from "@/components/ui/LabCard";
import PrimaryButton from "@/components/ui/PrimaryButton";
import TechBadge from "@/components/ui/TechBadge";
import { Cpu, ShieldCheck, Activity, Database, CheckCircle2, Layers, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ComponentDetail {
  name: string;
  package: string;
  health: number;
  confidence: number;
  rul: string;
  material: string;
}

const componentList: Record<string, ComponentDetail> = {
  soc: {
    name: "Apple M2 Max System-on-Chip (SoC)",
    package: "BGA-2304",
    health: 96,
    confidence: 99.4,
    rul: "4.2 Years (36,800 Hrs)",
    material: "99.99% Gold Pin Array, Silicon Die",
  },
  vram: {
    name: "GDDR6X High-Speed VRAM",
    package: "FBGA-180",
    health: 91,
    confidence: 98.8,
    rul: "3.5 Years (30,600 Hrs)",
    material: "Copper Substrate, Silver Solder",
  },
  mosfet: {
    name: "DrMOS Power Stage MOSFET",
    package: "QFN-40",
    health: 84,
    confidence: 97.9,
    rul: "2.1 Years (18,400 Hrs)",
    material: "Palladium Leadframe, Heavy Copper",
  },
};

export default function ComponentDetectionPage() {
  const [selectedCompKey, setSelectedCompKey] = useState<string>("soc");
  const selectedComp = componentList[selectedCompKey];

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
            badge="01 | COMPUTER VISION & SPECTROMETRY"
            title="Sub-Millimeter AI Component Intelligence"
            subtitle="EcoIntel's spectro-spatial vision models detect, classify, and diagnose electronic components down to 50 microns in under 120 milliseconds."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Interactive Component Inspector */}
            <div className="lg:col-span-7">
              <LabCard className="p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                  <span className="font-mono text-xs font-bold text-[#0F172A] uppercase">
                    PCB Spectro-Spatial Target Selector
                  </span>
                  <TechBadge label="YOLOv8-EcoPCB Live" variant="blue" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "soc", label: "Processor SoC" },
                    { key: "vram", label: "VRAM Memory" },
                    { key: "mosfet", label: "Power MOSFET" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setSelectedCompKey(item.key)}
                      className={`p-3 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${
                        selectedCompKey === item.key
                          ? "bg-[#2563EB] text-white border-[#2563EB] shadow-md"
                          : "bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-[#F1F5F9]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="aspect-[4/3] rounded-2xl bg-[#0F172A] p-6 text-white relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-center justify-between z-10">
                    <span className="font-mono text-xs text-[#60A5FA]">Spectrometer Output</span>
                    <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400">
                      {selectedComp.confidence}% Confidence
                    </span>
                  </div>

                  <div className="z-10 space-y-2">
                    <h3 className="font-heading text-2xl font-bold">{selectedComp.name}</h3>
                    <p className="text-xs font-mono text-slate-400">
                      Package: <span className="text-white">{selectedComp.package}</span>
                    </p>
                  </div>

                  <div className="z-10 pt-4 border-t border-slate-700 flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>Target ID: EINT-993A</span>
                    <span className="text-emerald-400 font-bold">Grade A+ Reuse Eligible</span>
                  </div>
                </div>
              </LabCard>
            </div>

            {/* Readout Telemetry Card */}
            <div className="lg:col-span-5 space-y-6">
              <LabCard className="p-8">
                <h3 className="font-heading text-xl font-bold text-[#0F172A] mb-6">
                  Diagnosed Component Specs
                </h3>

                <div className="space-y-4 font-mono text-xs">
                  <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B]">Component Name</span>
                    <span className="text-[#0F172A] font-bold">{selectedComp.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B]">Package Type</span>
                    <span className="text-[#0F172A]">{selectedComp.package}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B]">Health Score</span>
                    <span className="text-[#16A34A] font-bold">{selectedComp.health}%</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B]">Estimated RUL</span>
                    <span className="text-[#2563EB] font-bold">{selectedComp.rul}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B]">Precious Material</span>
                    <span className="text-[#0F172A]">{selectedComp.material}</span>
                  </div>
                </div>

                <div className="pt-6">
                  <Link href="/platform/passport">
                    <PrimaryButton variant="primary" size="md" className="w-full">
                      <span>View Polygon Passport</span>
                    </PrimaryButton>
                  </Link>
                </div>
              </LabCard>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
