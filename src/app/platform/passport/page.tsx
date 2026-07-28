"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
import LabCard from "@/components/ui/LabCard";
import PrimaryButton from "@/components/ui/PrimaryButton";
import TechBadge from "@/components/ui/TechBadge";
import { ShieldCheck, Lock, ExternalLink, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function BlockchainPassportPage() {
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
            badge="05 | POLYGON BLOCKCHAIN DECENTRALIZED PASSPORTS"
            title="Digital Product Passport (DPP)"
            subtitle="Every component receives a tamper-proof Polygon ERC-721 Digital Product Passport recording origin facility, verified health grade, and lifetime reuse cycles."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Passport Data Card */}
            <div className="lg:col-span-7">
              <LabCard className="p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#2563EB]" />
                    <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#0F172A]">
                      Polygon Mainnet Contract
                    </span>
                  </div>
                  <TechBadge label="ERC-721 DPP Verified" variant="green" />
                </div>

                <div className="space-y-4 font-mono text-xs">
                  <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B]">Passport ID</span>
                    <span className="text-[#0F172A] font-bold">EINT-PASSPORT-88392</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B]">Component Type</span>
                    <span className="text-[#0F172A]">Microcontroller - STM32F103</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B]">Origin Facility</span>
                    <span className="text-[#0F172A]">EcoIntel Lab Alpha (Tokyo)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B]">Verified Health Grade</span>
                    <span className="text-[#16A34A] font-bold">98.4% (Grade A+)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B]">Reuse Cycle Count</span>
                    <span className="text-[#2563EB] font-bold">2 Cycles</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B]">Remaining Life</span>
                    <span className="text-[#0F172A]">4.2 Years (36,800 Hrs)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B]">Verification Hash</span>
                    <span className="text-[#2563EB] font-bold truncate max-w-[200px]">0x7f9a88392c1044b3f</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-[#16A34A] font-mono font-semibold">
                    <CheckCircle className="w-4 h-4" /> Polygon Smart Contract Confirmed
                  </span>
                  <a href="https://polygonscan.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#2563EB] hover:underline font-mono">
                    <span>PolygonScan</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </LabCard>
            </div>

            {/* QR Verification Placeholder */}
            <div className="lg:col-span-5">
              <LabCard className="p-8 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-40 h-40 rounded-2xl bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center p-4">
                  <ShieldCheck className="w-20 h-20 text-[#2563EB]" />
                </div>
                <h4 className="font-heading text-lg font-bold text-[#0F172A]">Scan QR Verification</h4>
                <p className="text-xs text-[#64748B] leading-relaxed max-w-xs font-mono">
                  Scan to verify supply chain audit, carbon offset proofs, and hardware origin on Polygon POS.
                </p>
              </LabCard>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
