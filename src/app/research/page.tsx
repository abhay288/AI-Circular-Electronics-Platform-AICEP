"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TechBadge from "@/components/ui/TechBadge";
import { BookOpen, FileText, Award, ExternalLink } from "lucide-react";

export default function ResearchPage() {
  const publications = [
    {
      title: "Generative Graph Neural Topology for Multilayer PCB Micro-Trace Reconstruction",
      journal: "IEEE Transactions on Industrial Informatics (2026)",
      patentId: "US-PAT-9842105-B2",
      authors: "EcoIntel AI Research Labs & MIT Computer Science",
      status: "PATENT GRANTED",
    },
    {
      title: "Sub-Millimeter Spectro-Spatial Neural Models for E-Waste Component Classification",
      journal: "ACM SIGKDD Conference on Knowledge Discovery & Data Mining (2025)",
      patentId: "PCT/US2025/084920",
      authors: "EcoIntel AI Vision Team & Stanford AI Lab",
      status: "IEEE PUBLISHED",
    },
  ];

  return (
    <main className="relative flex flex-col min-h-screen bg-[#F1F5F9]">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-32 pb-16 bg-[#0F172A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[#60A5FA] text-xs font-mono font-bold w-fit">
              <BookOpen className="w-4 h-4" />
              <span>DEEP TECH RESEARCH & IEEE PUBLICATIONS</span>
            </div>
            <h1 className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tight">
              Research & Patents
            </h1>
            <p className="text-slate-300 text-base max-w-2xl leading-relaxed">
              Peer-reviewed computer vision algorithms, electro-thermal physics models, and granted patents advancing the Circular Electronics Economy.
            </p>
          </div>
        </div>
      </section>

      {/* Publications Timeline */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
          {publications.map((pub) => (
            <div key={pub.patentId} className="glass-card p-8 space-y-4 hover:border-[#2563EB]/40 transition-colors">
              <div className="flex items-center justify-between">
                <TechBadge label={pub.status} variant="blue" />
                <span className="font-mono text-xs font-bold text-[#2563EB]">{pub.patentId}</span>
              </div>
              <h3 className="font-heading text-xl font-bold text-[#0F172A]">{pub.title}</h3>
              <p className="text-xs text-[#64748B] font-mono">{pub.journal} · {pub.authors}</p>
              <div className="pt-2 flex gap-3">
                <button className="px-5 py-2.5 rounded-full bg-[#0F172A] text-white text-xs font-mono font-bold inline-flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#60A5FA]" />
                  <span>Download IEEE Paper PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
