"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  QrCode,
  Calendar,
  Building,
  Activity,
  Clock,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  ShoppingCart,
  Check,
} from "lucide-react";
import { useAnalysisSession } from "@/lib/context/AnalysisSessionContext";

const PassportCard3D = dynamic(
  () => import("@/components/3d/PassportCard3D"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 flex items-center justify-center bg-[#F1F5F9] rounded-2xl">
        <ShieldCheck className="w-8 h-8 text-[#2563EB] animate-pulse" />
      </div>
    ),
  }
);

export default function DigitalPassportPage() {
  const { session, openMarketplaceListing } = useAnalysisSession();
  const [copied, setCopied] = useState(false);

  const passport = session.passportResult || {
    passportId: session.passportId || "ECO-PASSPORT-2026-8941",
    tokenId: "78491",
    blockchainStatus: "Passport Ready",
    polygonTransactionHash: "0x3f9821aa904b77c38df48324bf8b2a19e5cd6f112288114400eefb319aa50291",
    contractAddress: "0x3B82F6e71C7656EC7ab88b098defB751B7401B5f",
    originFacility: "EcoIntel Circular Inspection Lab 01",
    manufactureYear: 2024,
    reuseCycleCount: 1,
    isVerified: true,
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(passport.polygonTransactionHash || passport.passportId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 py-10 px-4 sm:px-8 max-w-5xl mx-auto w-full space-y-8">
      
      {/* ─── HEADER ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#2563EB] uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Polygon ERC-721 Circular Provenance</span>
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Digital Product Passport
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Traceable component identity for circular electronics redistribution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/console/results"
            className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-mono font-semibold text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
          >
            ← Back to Results
          </Link>

          <button
            onClick={() => openMarketplaceListing()}
            className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-blue-500/25 transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>List with Passport</span>
          </button>
        </div>
      </div>

      {/* ─── PASSPORT HERO CARD & 3D HOLOGRAPHIC SLAB ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 3D Glass Passport Slab (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#2563EB] font-bold uppercase tracking-wider">
              HOLOGRAPHIC TOKEN SLAB
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-[10px] font-mono font-bold">
              ERC-721
            </span>
          </div>

          <div className="h-64 w-full bg-[#0F172A] rounded-2xl overflow-hidden relative border border-slate-800">
            <PassportCard3D />
            <div className="absolute bottom-2 left-3 text-[9px] font-mono text-slate-400">
              Polygon POS Network Node #137
            </div>
          </div>

          {/* QR Code Block */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-4">
            <div className="w-16 h-16 bg-white p-1 rounded-xl border border-[#CBD5E1] flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full">
                <rect width="100" height="100" fill="#ffffff" />
                <rect x="8" y="8" width="30" height="30" fill="#0f172a" />
                <rect x="62" y="8" width="30" height="30" fill="#0f172a" />
                <rect x="8" y="62" width="30" height="30" fill="#0f172a" />
                <rect x="16" y="16" width="14" height="14" fill="#ffffff" />
                <rect x="70" y="16" width="14" height="14" fill="#ffffff" />
                <rect x="16" y="70" width="14" height="14" fill="#ffffff" />
                <rect x="44" y="44" width="12" height="12" fill="#2563eb" />
                <rect x="20" y="44" width="8" height="8" fill="#0f172a" />
                <rect x="44" y="20" width="8" height="8" fill="#0f172a" />
                <rect x="72" y="72" width="16" height="16" fill="#0f172a" />
              </svg>
            </div>

            <div className="flex-1 min-w-0 text-xs">
              <span className="font-bold text-[#0F172A] block">Digital Verifier QR</span>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Scan with any standard mobile camera or optical AOI terminal for instant on-chain lookup.
              </p>
            </div>
          </div>
        </div>

        {/* Right Passport Data Ledger (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8 space-y-6">
          
          {/* Status & ID */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
            <div>
              <span className="text-[10px] font-mono text-[#64748B] uppercase">Passport Number</span>
              <div className="font-heading text-xl font-extrabold text-[#0F172A]">
                {passport.passportId}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-mono font-bold text-[#2563EB]">
                {passport.blockchainStatus}
              </span>
            </div>
          </div>

          {/* Core Telemetry Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[#64748B] text-[10px] block">ASSOCIATED HARDWARE</span>
              <span className="font-bold text-[#0F172A]">{session.deviceName}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[#64748B] text-[10px] block">ORIGIN LAB / FACILITY</span>
              <span className="font-bold text-[#0F172A]">{passport.originFacility}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[#64748B] text-[10px] block">VERIFIED HEALTH GRADE</span>
              <span className="font-bold text-[#16A34A] text-sm">
                Grade A+ ({session.rulResult?.overallHealthScore || 92}%)
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[#64748B] text-[10px] block">ESTIMATED REMAINING LIFE</span>
              <span className="font-bold text-[#2563EB] text-sm">
                {session.rulResult?.predictedYears || 6.4} Years
              </span>
            </div>
          </div>

          {/* Lifecycle & Ownership History */}
          <div className="space-y-3">
            <h3 className="font-heading text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Circular Provenance & Chain of Custody
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                  <span>Cycle #0: Original Electronics Ingest</span>
                </div>
                <span className="text-[#64748B]">2024 · Clean Initial Run</span>
              </div>

              <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-between text-[#2563EB]">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
                  <span className="font-bold">Cycle #1: EcoIntel Spectro-Spatial Verification</span>
                </div>
                <span className="font-bold">{new Date().toISOString().split("T")[0]}</span>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-[#64748B]">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#CBD5E1]" />
                  <span>Cycle #2: B2B Secondary Marketplace Allocation</span>
                </div>
                <span>Pending Purchaser</span>
              </div>
            </div>
          </div>

          {/* Blockchain Cryptographic Verification */}
          <div className="space-y-2 text-xs font-mono">
            <span className="text-[11px] text-[#64748B] font-semibold block">
              Polygon Transaction Reference:
            </span>
            <div className="p-3 rounded-xl bg-[#0F172A] text-white flex items-center justify-between gap-2 overflow-hidden">
              <span className="truncate text-[11px] text-[#38BDF8]">
                {passport.polygonTransactionHash}
              </span>
              <button
                onClick={handleCopyHash}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex-shrink-0 transition-colors"
                title="Copy Hash"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ─── BOTTOM ACTIONS ─────────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs font-mono text-[#64748B]">
          Digital Product Passport certified under EU Ecodesign ESPR standard.
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/console/report"
            className="px-5 py-2.5 rounded-full border border-[#CBD5E1] text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
          >
            Download Intelligence Report
          </Link>

          <button
            onClick={() => openMarketplaceListing()}
            className="px-6 py-2.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-colors flex items-center gap-2"
          >
            <span>List Component on Marketplace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
}
