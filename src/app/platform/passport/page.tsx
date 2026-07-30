"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TechBadge from "@/components/ui/TechBadge";
import { ShieldCheck, QrCode, ExternalLink, CheckCircle2, ArrowRight } from "lucide-react";

export default function PassportPage() {
  const [passportId, setPassportId] = useState("ECO-PASSPORT-2026-9842");

  return (
    <main className="relative flex flex-col min-h-screen bg-[#F1F5F9]">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-32 pb-16 bg-[#0F172A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[#4ADE80] text-xs font-mono font-bold w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>MODULE 05 · POLYGON BLOCKCHAIN ERC-721 DIGITAL PRODUCT PASSPORT</span>
            </div>
            <h1 className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tight">
              Blockchain Product Passport
            </h1>
            <p className="text-slate-300 text-base max-w-2xl leading-relaxed">
              Minting tamper-proof Polygon smart contract NFTs certifying origin facility, component health grade, remaining operational lifespan, and Scope 3 carbon offset metrics.
            </p>
          </div>
        </div>
      </section>

      {/* Glass Digital Passport & QR Verification Workbench */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Left Glass Product Passport Display */}
            <div className="lg:col-span-7 glass-panel p-8 sm:p-10 space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center font-bold">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-[#0F172A]">Digital Product Passport</h3>
                    <span className="font-mono text-xs text-[#2563EB]">{passportId}</span>
                  </div>
                </div>
                <TechBadge label="Polygon Mainnet Verified" variant="green" />
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] flex justify-between text-xs font-mono">
                  <span className="text-[#64748B]">Component Part Number</span>
                  <span className="font-bold text-[#0F172A]">ATmega328P Microcontroller</span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] flex justify-between text-xs font-mono">
                  <span className="text-[#64748B]">Origin Recovery Facility</span>
                  <span className="font-bold text-[#0F172A]">TerraCycle Lab 04 (Tokyo, Japan)</span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] flex justify-between text-xs font-mono">
                  <span className="text-[#64748B]">Certified Health Grade</span>
                  <span className="font-bold text-[#16A34A]">Grade A+ (92% Health)</span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] flex justify-between text-xs font-mono">
                  <span className="text-[#64748B]">Scope 3 Carbon Avoided</span>
                  <span className="font-bold text-[#16A34A]">18.6 kg CO₂</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0F172A] text-white flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Contract Address</span>
                <span className="text-[#60A5FA] font-bold truncate max-w-[220px]">0x3B82F6e71C7656EC7ab88b098defB751B7401B5f</span>
              </div>
            </div>

            {/* Right QR Verifier Panel */}
            <div className="lg:col-span-5 glass-card p-8 space-y-6 text-center flex flex-col items-center">
              <span className="font-mono text-xs font-bold text-[#16A34A]">INSTANT ON-CHAIN QR VERIFICATION</span>
              
              <div className="w-48 h-48 rounded-2xl bg-white border-2 border-dashed border-[#86EFAC] p-4 flex items-center justify-center shadow-md">
                <QrCode className="w-36 h-36 text-[#0F172A]" />
              </div>

              <span className="text-xs text-[#64748B] font-mono max-w-xs">
                Scan with any smartphone or Web3 wallet to verify Polygon ERC-721 smart contract ownership.
              </span>

              <a
                href="https://polygonscan.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#16A34A] text-white text-xs font-mono font-bold hover:bg-[#15803D] transition-colors"
              >
                <span>View on PolygonScan</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
