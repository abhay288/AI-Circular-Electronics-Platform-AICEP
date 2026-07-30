"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TechBadge from "@/components/ui/TechBadge";
import { Cpu, Globe, ShieldCheck, Mail, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="relative flex flex-col min-h-screen bg-[#F1F5F9]">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-32 pb-16 bg-[#0F172A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[#60A5FA] text-xs font-mono font-bold w-fit">
              <Globe className="w-4 h-4" />
              <span>ABOUT ECOINTEL INC.</span>
            </div>
            <h1 className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tight">
              Building the Circular Electronics Operating System
            </h1>
            <p className="text-slate-300 text-base max-w-2xl leading-relaxed">
              We are an enterprise deep-tech organization engineering AI inspection pipelines, generative CAD topology, and Polygon blockchain product passports to eliminate global e-waste.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card p-10 space-y-4">
            <span className="font-mono text-xs font-bold text-[#2563EB] uppercase">OUR MISSION</span>
            <h3 className="font-heading text-2xl font-bold text-[#0F172A]">Zero E-Waste to Landfill</h3>
            <p className="text-sm text-[#475569] leading-relaxed">
              Deploy automated spectro-spatial computer vision directly into industrial recycling lines to classify, reconstruct, and mint digital product passports for every recoverable microchip.
            </p>
          </div>

          <div className="glass-card p-10 space-y-4">
            <span className="font-mono text-xs font-bold text-[#16A34A] uppercase">OUR VISION</span>
            <h3 className="font-heading text-2xl font-bold text-[#0F172A]">A Billion Reused Microchips</h3>
            <p className="text-sm text-[#475569] leading-relaxed">
              Creating a global B2B circular hardware marketplace where every recovered component carries an immutable health grade and Polygon blockchain certificate.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
