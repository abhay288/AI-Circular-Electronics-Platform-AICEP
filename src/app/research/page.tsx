"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
import LabCard from "@/components/ui/LabCard";
import TechBadge from "@/components/ui/TechBadge";
import { FileText, Award, Download, Cpu, ExternalLink } from "lucide-react";

export default function ResearchPage() {
  const publications = [
    {
      title: "Generative Graph Neural Topology (GGNT) for Multilayer PCB Reconstruction",
      journal: "IEEE Transactions on Computer-Aided Design & AI 2025",
      type: "PCT International Patent Application PCT/JP2025/08839",
      desc: "Methodology for automated Gerber CAD synthesis from corrupted optical and thermal imagery.",
    },
    {
      title: "Physics-Informed Neural Lifespan Modeling of Power MOSFET Degradation",
      journal: "ACM Transactions on Embedded Computing Systems 2024",
      type: "IEEE Peer-Reviewed Paper",
      desc: "Simulating micro-crack formation across SAC305 solder joints using electro-thermal physics models.",
    },
    {
      title: "Decentralized Product Passports for B2B Electronics Refurbishment on Polygon POS",
      journal: "Journal of Circular Economy & Blockchain Technologies 2025",
      type: "Whitepaper & Open Standard",
      desc: "ERC-721 DPP schema for hardware verification, origin logs, and Scope 3 carbon proofs.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionHeader
            badge="PATENTS, PUBLICATIONS & OPEN DATASETS"
            title="Industrial Deep Tech Research"
            subtitle="EcoIntel's research team publishes open hardware datasets, PCT international patent specifications, and IEEE peer-reviewed algorithms."
          />

          <div className="space-y-6">
            {publications.map((pub) => (
              <LabCard key={pub.title} className="p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#2563EB]" />
                    <span className="font-mono text-xs font-bold text-[#2563EB] uppercase">{pub.type}</span>
                  </div>
                  <TechBadge label="Peer Reviewed" variant="blue" />
                </div>

                <h3 className="font-heading text-xl font-bold text-[#0F172A] mb-2">{pub.title}</h3>
                <span className="font-mono text-xs text-[#64748B] block mb-3">{pub.journal}</span>
                <p className="text-sm text-[#475569] leading-relaxed mb-6 max-w-3xl">{pub.desc}</p>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <button className="flex items-center gap-1.5 text-[#2563EB] hover:underline font-semibold cursor-pointer">
                    <Download className="w-4 h-4" />
                    <span>Download Whitepaper PDF (3.8 MB)</span>
                  </button>
                </div>
              </LabCard>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
