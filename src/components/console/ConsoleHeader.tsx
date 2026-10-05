"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Cpu,
  HelpCircle,
  Bell,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  X,
  Copy,
  Check,
  Info,
  Sparkles,
  History,
  PlusCircle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useAnalysisSession } from "@/lib/context/AnalysisSessionContext";

export default function ConsoleHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryAnalysisId = searchParams.get("analysisId") || searchParams.get("sessionId");

  const {
    session,
    isNewAnalysis,
    resetToNewAnalysis,
    recentSessions,
    loadSessionById,
  } = useAnalysisSession();

  const [helpOpen, setHelpOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Active session display check: only show session details if NOT in new analysis mode on /console
  const isViewingSession = !isNewAnalysis && (pathname !== "/console" || !!queryAnalysisId);
  const sessionId = queryAnalysisId || session.id || "ECI-2026-7740";

  const handleCopySession = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartNewAnalysis = () => {
    resetToNewAnalysis();
    router.push("/console");
  };

  const handleResumeRecent = (id: string) => {
    setRecentOpen(false);
    loadSessionById(id);
    router.push(`/console/results?analysisId=${encodeURIComponent(id)}`);
  };

  const getStatusBadge = () => {
    if (!isViewingSession) return null;

    switch (session.status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#16A34A] text-[10px] font-mono font-bold">
            <CheckCircle2 className="w-3 h-3" />
            <span>ANALYSIS COMPLETE</span>
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-[10px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-ping" />
            <span>INFERENCE ACTIVE</span>
          </span>
        );
      case "CAPTURED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] text-[10px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
            <span>READY FOR ANALYSIS</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-[#64748B] text-[10px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
            <span>DRAFT INGEST</span>
          </span>
        );
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-16 bg-white border-b border-[#E2E8F0] px-4 sm:px-8 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        {/* Left: Brand Identity & Active Session / New Analysis Badge */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <Image
                src="/logo.png"
                alt="EcoIntel Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain drop-shadow-[0_2px_6px_rgba(37,99,235,0.3)]"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-base font-bold tracking-tight text-[#0F172A] leading-tight">
                EcoIntel
              </span>
              <span className="text-[9px] font-mono text-[#2563EB] tracking-wider uppercase font-semibold">
                CIRCULAR AI PLATFORM
              </span>
            </div>
          </Link>

          <div className="hidden md:block h-5 w-px bg-[#E2E8F0]" />

          {/* Conditional Session Badge: NEW ANALYSIS vs ACTIVE SESSION */}
          {!isViewingSession ? (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-mono text-[#2563EB]">
              <Sparkles className="w-3 h-3 text-[#2563EB]" />
              <span className="font-bold tracking-wider uppercase text-[10px]">
                NEW ANALYSIS
              </span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono text-[#475569]">
              <span className="font-semibold text-[#0F172A]">Session:</span>
              <button
                onClick={handleCopySession}
                className="text-[#2563EB] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                title="Click to copy Session ID"
              >
                #{sessionId}
                {copied ? (
                  <Check className="w-3 h-3 text-[#16A34A]" />
                ) : (
                  <Copy className="w-3 h-3 text-[#94A3B8]" />
                )}
              </button>
              <span className="text-[#CBD5E1]">·</span>
              {session.sourceType === "sample" ||
              session.dataClassification === "sample" ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase font-bold tracking-wider">
                  DEMO DATASET
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase font-bold tracking-wider">
                  LIVE INGEST
                </span>
              )}
              {getStatusBadge()}
            </div>
          )}
        </div>

        {/* Center: Device Breadcrumb */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-[#475569]">
          <span className="font-semibold text-[#0F172A]">Workspace</span>
          <span className="text-[#CBD5E1]">/</span>
          {isViewingSession ? (
            <>
              <span className="text-[#2563EB] font-mono font-bold">
                {session.deviceName}
              </span>
              <span className="text-[#94A3B8]">({session.deviceType})</span>
            </>
          ) : (
            <span className="text-[#64748B] font-mono">No device selected</span>
          )}
        </div>

        {/* Right: Actions, Recent, Help & User */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* New Analysis Quick Button (When viewing an active session) */}
          {isViewingSession && (
            <button
              onClick={handleStartNewAnalysis}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] text-xs font-semibold transition-colors cursor-pointer"
              title="Start a new electronic hardware analysis"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Analysis</span>
            </button>
          )}

          {/* Recent Analyses Trigger */}
          <div className="relative">
            <button
              onClick={() => setRecentOpen(!recentOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              title="View recent hardware analysis sessions"
            >
              <History className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="hidden sm:inline">Recent</span>
            </button>

            {/* Recent Analyses Dropdown */}
            {recentOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[#E2E8F0] shadow-xl p-4 z-50 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <div>
                    <span className="font-bold text-[#0F172A] block">
                      Recent Analyses
                    </span>
                    <span className="text-[10px] text-[#64748B]">
                      Resume or inspect previous hardware profiles
                    </span>
                  </div>
                  <button
                    onClick={() => setRecentOpen(false)}
                    className="text-[#94A3B8] hover:text-[#0F172A]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2 pt-3 max-h-72 overflow-y-auto">
                  {recentSessions.length > 0 ? (
                    recentSessions.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#2563EB]/40 bg-[#F8FAFC] hover:bg-white transition-all flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#0F172A] truncate">
                              {rec.deviceName}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-[#475569]">
                              {rec.id}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#64748B] truncate">
                            {rec.deviceType} ·{" "}
                            {rec.dataClassification === "sample"
                              ? "Demo"
                              : "Live Ingest"}
                          </p>
                        </div>

                        <button
                          onClick={() => handleResumeRecent(rec.id)}
                          className="px-3 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer flex-shrink-0"
                        >
                          <span>Resume</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-[#94A3B8]">
                      No previous sessions found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Help Button */}
          <button
            onClick={() => setHelpOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
            title="Scientific Methodology & Help"
          >
            <HelpCircle className="w-4 h-4 text-[#64748B]" />
            <span className="hidden sm:inline">Help</span>
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors relative cursor-pointer"
              title="System Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2563EB]" />
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-[#E2E8F0] shadow-xl p-4 z-50 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <span className="font-bold text-[#0F172A]">
                    Workspace Activity
                  </span>
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="text-[#94A3B8] hover:text-[#0F172A]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-3 pt-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-[#0F172A]">
                        Spectro-Spatial Engine Active
                      </p>
                      <p className="text-[11px] text-[#64748B]">
                        YOLOv11 50-micron weights loaded.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#2563EB] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-[#0F172A]">
                        Product Passport Prepared
                      </p>
                      <p className="text-[11px] text-[#64748B]">
                        ERC-721 metadata synthesized.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-[#E2E8F0]" />

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-[10px]">
              OP
            </div>
            <span className="hidden sm:inline text-xs font-medium text-[#0F172A]">
              Lab Operator
            </span>
          </div>

          {/* Exit Console */}
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-xs font-semibold text-[#475569] hover:text-[#0F172A] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit Console</span>
          </Link>
        </div>
      </header>

      {/* Help Modal */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setHelpOpen(false)}
              className="absolute top-5 right-5 text-[#94A3B8] hover:text-[#0F172A]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-[#0F172A]">
                  EcoIntel Analysis Workspace Guide
                </h3>
                <p className="text-xs text-[#64748B]">
                  Industrial Circular Electronics Methodology
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-[#475569] leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <h4 className="font-bold text-[#0F172A] mb-1">
                  Scientific Transparency Protocol
                </h4>
                <p>
                  EcoIntel enforces strict transparency across all hardware
                  assessments. Each data point is classified as either:
                  <strong> Measured</strong>, <strong>Detected</strong>,{" "}
                  <strong>Predicted</strong>, <strong>Estimated</strong>, or{" "}
                  <strong>Simulated</strong>. Demo datasets are explicitly flagged
                  to preserve industrial integrity without claiming laboratory
                  chemical certification.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#0F172A] mb-1.5">
                  The 8-Stage Intelligence Pipeline:
                </h4>
                <ul className="space-y-2 list-disc pl-4 text-[11px]">
                  <li>
                    <strong>01 Capture:</strong> Optical ingest via camera stream
                    or multi-spectrum image upload.
                  </li>
                  <li>
                    <strong>02 AI Detection:</strong> 50-micron sub-millimeter
                    component classification and localization.
                  </li>
                  <li>
                    <strong>03 PCB Analysis:</strong> Trace continuity,
                    topological netlist synthesis, and KiCad extraction.
                  </li>
                  <li>
                    <strong>04 Health & RUL:</strong> Physics-informed thermal,
                    voltage, and cycle lifespan predictions.
                  </li>
                  <li>
                    <strong>05 Material Recovery:</strong> Gold, Silver, Copper,
                    and Palladium spectrometry estimation.
                  </li>
                  <li>
                    <strong>06 Repair Intelligence:</strong> Component-level
                    reflow, reballing, or swap diagnostics.
                  </li>
                  <li>
                    <strong>07 Digital Passport:</strong> Polygon ERC-721
                    circular hardware pedigree token.
                  </li>
                  <li>
                    <strong>08 Impact Report:</strong> ESG Scope 3 CO₂ avoidance
                    and circularity accounting.
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex justify-end">
              <button
                onClick={() => setHelpOpen(false)}
                className="px-5 py-2 rounded-full bg-[#0F172A] text-white text-xs font-semibold hover:bg-[#1E293B] transition-colors"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
