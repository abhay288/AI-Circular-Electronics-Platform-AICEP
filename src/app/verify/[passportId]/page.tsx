import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Hash,
  Box,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";
import connectDB from "@/lib/db";
import DigitalPassport from "@/models/DigitalPassport";
import { DigitalPassportService } from "@/services/passport.service";

export interface PublicVerifyPageProps {
  params: Promise<{ passportId: string }>;
}

export default async function PublicVerifyPage({ params }: PublicVerifyPageProps) {
  const { passportId } = await params;
  await connectDB();

  const passportDoc = await DigitalPassport.findOne({ passportId });
  if (!passportDoc) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#E2E8F0] shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="font-heading text-xl font-bold text-[#0F172A]">Passport Not Found</h1>
          <p className="text-xs text-[#64748B]">
            No circular electronics identity exists for identifier <strong className="font-mono">{passportId}</strong>.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-bold font-mono"
          >
            Return to EcoIntel
          </Link>
        </div>
      </div>
    );
  }

  const service = new DigitalPassportService();
  const verifyResult = await service.verifyIntegrity(passportId);
  const publicView = service.getPublicView(passportDoc);

  const isValid = verifyResult.status === "VALID";
  const isSimulated = passportDoc.blockchain?.isSimulated ?? true;

  return (
    <div className="min-h-screen bg-[#0F172A] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header Branding */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2563EB] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-heading text-sm font-bold tracking-tight block">
                EcoIntel Platform
              </span>
              <span className="text-[11px] font-mono text-slate-400 block">
                Public Cryptographic Verification Service
              </span>
            </div>
          </div>
          <Link
            href={`/passport/${passportId}`}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <span>Full Public DPP</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Verification Status Banner */}
        <div
          className={`rounded-3xl p-6 sm:p-8 border shadow-2xl relative overflow-hidden ${
            isValid
              ? "bg-gradient-to-br from-[#064E3B] to-[#022C22] border-[#059669]/40"
              : "bg-gradient-to-br from-[#7F1D1D] to-[#450A0A] border-[#DC2626]/40"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isValid ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
                )}
                <h2 className="text-xl sm:text-2xl font-extrabold font-heading tracking-tight">
                  {isValid ? "PASSPORT VERIFIED" : "INTEGRITY WARNING"}
                </h2>
              </div>
              <p className="text-xs text-emerald-200/90 sm:pl-8">
                {verifyResult.details}
              </p>
            </div>

            <div className="text-right sm:border-l sm:border-white/10 sm:pl-6 shrink-0">
              <span className="text-[10px] font-mono uppercase text-emerald-300/80 block">
                Tamper Status
              </span>
              <span className="text-lg font-bold font-mono text-white">
                {verifyResult.isTampered ? "TAMPERED" : "AUTHENTIC"}
              </span>
            </div>
          </div>
        </div>

        {/* Verification Details Matrix */}
        <div className="bg-slate-900/80 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <h3 className="font-heading text-sm font-bold text-slate-300 uppercase tracking-wider">
            Verification Specifications
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1">
              <span className="text-slate-400 text-[10px] block">Passport Identifier</span>
              <span className="text-white font-bold text-sm block select-all">{publicView.passportId}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1">
              <span className="text-slate-400 text-[10px] block">Asset Classification</span>
              <span className="text-white font-bold text-sm block">{publicView.assetType}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1">
              <span className="text-slate-400 text-[10px] block">Passport Version</span>
              <span className="text-white font-bold text-sm block">Version v{publicView.version}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1">
              <span className="text-slate-400 text-[10px] block">Blockchain Network</span>
              <span className="text-white font-bold text-sm block">
                {publicView.blockchain?.network}
                {isSimulated && " (Simulated Demo)"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1 sm:col-span-2">
              <span className="text-slate-400 text-[10px] block">Deterministic Canonical Content Hash (SHA-256)</span>
              <span className="text-[#38BDF8] font-bold text-xs select-all break-all block">
                {publicView.verification?.contentHash}
              </span>
            </div>

            {publicView.blockchain?.transactionHash && (
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1 sm:col-span-2">
                <span className="text-slate-400 text-[10px] block">Anchored Transaction Hash</span>
                <span className="text-slate-300 font-bold text-xs select-all break-all block">
                  {publicView.blockchain.transactionHash}
                </span>
              </div>
            )}
          </div>

          {/* Scientific & Traceability Disclaimer */}
          <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-bold text-slate-300 block">Scientific & Integrity Notice:</span>
            <p>
              Blockchain anchoring verifies the mathematical integrity and provenance immutability of the referenced passport data. It does not independently verify the truthfulness of every underlying physical laboratory measurement or AI prediction.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
