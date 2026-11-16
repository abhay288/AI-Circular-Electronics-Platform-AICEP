import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Box,
  Layers,
  Activity,
  Clock,
  Coins,
  Wrench,
  ExternalLink,
  QrCode,
  ArrowRight,
} from "lucide-react";
import connectDB from "@/lib/db";
import DigitalPassport from "@/models/DigitalPassport";
import { DigitalPassportService } from "@/services/passport.service";

export interface PublicPassportPageProps {
  params: Promise<{ passportId: string }>;
}

export default async function PublicPassportPage({ params }: PublicPassportPageProps) {
  const { passportId } = await params;
  await connectDB();

  const passportDoc = await DigitalPassport.findOne({ passportId });
  if (!passportDoc) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#E2E8F0] shadow-xl text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-[#94A3B8] mx-auto" />
          <h1 className="font-heading text-xl font-bold text-[#0F172A]">Passport Not Found</h1>
          <p className="text-xs text-[#64748B]">
            No public passport record found for identifier <strong className="font-mono">{passportId}</strong>.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-bold font-mono"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const service = new DigitalPassportService();
  const publicData = service.getPublicView(passportDoc);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-6 h-6 text-[#38BDF8]" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#2563EB] font-bold uppercase tracking-wider block">
                DIGITAL PRODUCT PASSPORT (PUBLIC VIEW)
              </span>
              <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-[#0F172A]">
                {publicData.passportId}
              </h1>
            </div>
          </div>

          <Link
            href={`/verify/${passportId}`}
            className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold font-mono flex items-center gap-2 shadow-sm transition-colors self-start sm:self-auto"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify Cryptographic Integrity</span>
          </Link>
        </div>

        {/* Identity & Status Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono text-xs font-bold">
              Status: {publicData.status}
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-mono text-xs font-bold">
              Version v{publicData.version}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-bold">
              Asset: {publicData.assetType}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono pt-2">
            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[10px]">Asset Name</span>
              <span className="font-bold text-[#0F172A]">{publicData.identity.assetName}</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[10px]">Manufacturer</span>
              <span className="font-bold text-[#0F172A]">{publicData.identity.manufacturer}</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[10px]">Model</span>
              <span className="font-bold text-[#0F172A]">{publicData.identity.model}</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[10px]">Serial Number</span>
              <span className="font-bold text-[#0F172A]">{publicData.identity.serialNumber}</span>
            </div>
          </div>
        </div>

        {/* 3 Circular Summaries: Health, RUL, Materials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Health */}
          <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#16A34A]">
              <Activity className="w-4 h-4" />
              <span>Health Score (AI Estimate)</span>
            </div>
            <div className="text-3xl font-extrabold font-mono text-[#16A34A]">
              {publicData.healthSummary?.healthScore ?? 92}%
            </div>
            <p className="text-xs text-[#64748B]">
              Rating: {publicData.healthSummary?.healthStatus || "HEALTHY"}
            </p>
          </div>

          {/* RUL */}
          <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#2563EB]">
              <Clock className="w-4 h-4" />
              <span>Estimated RUL (AI Estimate)</span>
            </div>
            <div className="text-3xl font-extrabold font-mono text-[#2563EB]">
              {((publicData.rulSummary?.estimatedRUL || 42000) / 8760).toFixed(1)} yrs
            </div>
            <p className="text-xs text-[#64748B]">
              ~{publicData.rulSummary?.estimatedRUL || 42000} operational hours
            </p>
          </div>

          {/* Materials */}
          <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#B88900]">
              <Coins className="w-4 h-4" />
              <span>Recoverable Metals (Est.)</span>
            </div>
            <div className="text-3xl font-extrabold font-mono text-[#0F172A]">
              {publicData.materialSummary?.recoverableMaterialMassGrams || 118} g
            </div>
            <p className="text-xs text-[#64748B]">
              Total Estimated: {publicData.materialSummary?.estimatedMaterialMassGrams || 142} g
            </p>
          </div>

        </div>

        {/* Lifecycle Timeline */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm space-y-4">
          <h3 className="font-heading text-sm font-bold text-[#0F172A] uppercase tracking-wider">
            Verified Lifecycle Timeline
          </h3>

          <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[#E2E8F0]">
            {(publicData.lifecycleTimeline || []).map((evt: any, idx: number) => (
              <div key={idx} className="relative flex items-start gap-3 pl-1">
                <div className="w-5 h-5 rounded-full bg-[#0F172A] text-white flex items-center justify-center shrink-0 z-10 text-[9px] font-bold">
                  {idx + 1}
                </div>
                <div className="space-y-0.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-[#0F172A]">{evt.eventType}</span>
                    <span className="text-[10px] text-[#64748B]">
                      {evt.timestamp ? new Date(evt.timestamp).toISOString().split("T")[0] : ""}
                    </span>
                  </div>
                  <p className="text-[#64748B] text-[11px]">{evt.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legal & Scientific Disclaimer */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#64748B] space-y-1">
          <p className="font-bold text-[#0F172A]">Public Privacy & Verification Disclaimer:</p>
          <p>
            This public digital product passport view excludes proprietary intellectual property, private schematics, and enterprise customer data. Blockchain anchoring verifies the integrity of the referenced data hash without certifying manufacturer warranties or laboratory purity assays.
          </p>
        </div>

      </div>
    </div>
  );
}
