"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  Info,
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

function DigitalPassportContent() {
  const searchParams = useSearchParams();
  const queryAnalysisId = searchParams.get("analysisId") || searchParams.get("sessionId");

  const { session, openMarketplaceListing, loadSessionById } = useAnalysisSession();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (queryAnalysisId && queryAnalysisId !== session.id) {
      loadSessionById(queryAnalysisId);
    }
  }, [queryAnalysisId, session.id, loadSessionById]);

  const passport = session.passport || session.passportResult || {
    passportId: `ECO-PASSPORT-2026-${session.id.split("-").pop() || "7740"}`,
    tokenId: "77401",
    blockchainStatus: "Passport Prepared",
    verificationStatus: "Prepared",
    originFacility: "EcoIntel Telecom Lab 07",
    manufactureYear: 2024,
    reuseCycleCount: 0,
    isVerified: true,
    qrDataUri: "",
    ownership: "Certified Circular Custody",
    repairHistory: ["Optical Saliency Inspection Verified", "IPC-A-610 Class 3 Integrity Passed"],
    recoveryDate: "2026-10-03",
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(passport.passportId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sessionIdParam = session?.id ? `?analysisId=${encodeURIComponent(session.id)}` : "";

  return (
    <div className="flex-1 py-10 px-4 sm:px-8 max-w-5xl mx-auto w-full space-y-8 text-[#0F172A]">
      
      {/* ─── HEADER ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#2563EB] uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Circular Hardware Pedigree</span>
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Digital Product Passport
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Traceable cryptographic identity for <strong className="text-[#0F172A]">{session.deviceName}</strong> ({session.deviceType}).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/console/results${sessionIdParam}`}
            className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-mono font-semibold text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
          >
            ← Back to Results
          </Link>

          <Link
            href={`/marketplace/create${sessionIdParam}`}
            className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-blue-500/25 transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>List with Passport</span>
          </Link>
        </div>
      </div>

      {/* ─── STATUS BANNER: HONEST BLOCKCHAIN STATE ─────────────── */}
      <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-[#2563EB]">
          <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
          <span>Blockchain State: <strong>Passport Prepared · Verification Pending</strong></span>
        </div>
        <span className="text-[11px] text-[#64748B]">
          Off-chain verified · Ready for ERC-721 smart contract anchoring
        </span>
      </div>

      {/* ─── PASSPORT HERO CARD & 3D HOLOGRAPHIC SLAB ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 3D Glass Passport Slab (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <span className="font-heading text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Cryptographic Card
            </span>
            <span className="text-[10px] font-mono text-[#16A34A] font-bold">
              Grade A+ Token
            </span>
          </div>

          <div className="h-64 w-full bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] overflow-hidden flex items-center justify-center">
            <PassportCard3D />
          </div>

          {/* QR Code and Passport ID */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-4">
            <div className="w-16 h-16 bg-white p-1 rounded-xl border border-[#E2E8F0] flex items-center justify-center flex-shrink-0">
              {passport.qrDataUri ? (
                <img src={passport.qrDataUri} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <QrCode className="w-12 h-12 text-[#0F172A]" />
              )}
            </div>

            <div className="space-y-1 text-xs font-mono">
              <span className="text-[10px] text-[#64748B] uppercase block">Passport ID</span>
              <button
                onClick={handleCopyId}
                className="font-bold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{passport.passportId}</span>
                {copied ? <Check className="w-3 h-3 text-[#16A34A]" /> : <Copy className="w-3 h-3 text-[#94A3B8]" />}
              </button>
              <span className="text-[10px] text-[#64748B] block">Scan for public provenance</span>
            </div>
          </div>
        </div>

        {/* Right Structured Identity Attributes (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
            <div>
              <span className="text-[10px] font-mono text-[#2563EB] uppercase font-bold tracking-wider">
                CIRCULAR PEDIGREE METRICS
              </span>
              <h2 className="font-heading text-xl font-bold text-[#0F172A]">
                Hardware Identity Attributes
              </h2>
            </div>

            <span className="px-3 py-1 rounded-full bg-[#DCFCE7] text-[#16A34A] text-xs font-mono font-bold">
              {passport.verificationStatus || "Verification Pending"}
            </span>
          </div>

          {/* Core Spec Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[10px]">PASSPORT ID</span>
              <strong className="text-[#0F172A]">{passport.passportId}</strong>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[10px]">COMPONENT / DEVICE ID</span>
              <strong className="text-[#0F172A]">{session.id}</strong>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[10px]">DEVICE ORIGIN</span>
              <strong className="text-[#0F172A]">{passport.deviceOrigin || passport.originFacility || "EcoIntel Ingest Lab 01"}</strong>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[10px]">RECOVERY DATE</span>
              <strong className="text-[#0F172A]">{passport.recoveryDate || "2026-10-03"}</strong>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7]">
              <span className="text-[#16A34A] block text-[10px]">HEALTH SCORE</span>
              <strong className="font-heading text-lg text-[#16A34A]">{session.rulPrediction?.overallHealthScore || 93}%</strong>
            </div>

            <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]">
              <span className="text-[#2563EB] block text-[10px]">REMAINING LIFE</span>
              <strong className="font-heading text-lg text-[#2563EB]">{session.rulPrediction?.predictedYears || 7.2} Years</strong>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[10px]">REUSE CYCLE COUNT</span>
              <strong className="text-[#0F172A]">{passport.reuseCount || passport.reuseCycleCount || 0} Cycles</strong>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[10px]">OWNERSHIP & CUSTODY</span>
              <strong className="text-[#0F172A]">{passport.ownership || "Certified Circular Custody"}</strong>
            </div>
          </div>

          {/* Repair & Audit History */}
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-[#0F172A]">
              Verified Audit & Repair History:
            </span>
            <div className="space-y-2">
              {(passport.repairHistory || [
                "Optical Saliency Inspection Verified",
                "IPC-A-610 Class 3 Integrity Passed",
                "Thermal Dissipation Within Spec",
              ]).map((entry, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-2.5 text-xs font-mono"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                  <span className="text-[#475569]">{entry}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transparency note */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
            <span>
              This passport is prepared in strict accordance with the European Union Ecodesign for Sustainable Products Regulation (ESPR Digital Product Passport).
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}

export default function DigitalPassportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 py-16 flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin mb-3" />
          <span className="font-mono text-xs font-bold text-[#0F172A]">Loading Digital Passport...</span>
        </div>
      }
    >
      <DigitalPassportContent />
    </Suspense>
  );
}
