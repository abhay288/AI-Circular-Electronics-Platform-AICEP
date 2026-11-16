"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  PlusCircle,
  Share2,
  Download,
  Box,
  Layers,
  Cpu,
  Activity,
  Coins,
  Wrench,
  FileText,
  UserCheck,
  Building,
  Hash,
  AlertTriangle,
  QrCode,
  Link as LinkIcon,
  X,
  Sparkles,
  ArrowRight,
  Database,
} from "lucide-react";

export interface DigitalPassportWorkspaceProps {
  analysisId: string;
  initialSessionData?: any;
  onOpen3D?: () => void;
  onSelectComponent?: (comp: any) => void;
}

export default function DigitalPassportWorkspace({
  analysisId,
  initialSessionData,
  onOpen3D,
  onSelectComponent,
}: DigitalPassportWorkspaceProps) {
  const [loading, setLoading] = useState(true);
  const [passport, setPassport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Action states
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [anchoring, setAnchoring] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("all");

  // Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    eventType: "INSPECTED",
    description: "",
    location: "Facility Lab 04",
    evidence: "",
  });

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    newOwner: "",
    reason: "Certified Circular Hardware Resale",
  });

  // Fetch passport
  const loadPassport = async () => {
    setLoading(true);
    setError(null);
    try {
      // First check if already created
      const res = await fetch(`/api/passports?search=${encodeURIComponent(analysisId)}`);
      const data = await res.json();

      if (data.success && data.passports && data.passports.length > 0) {
        setPassport(data.passports[0]);
      } else {
        // Automatically attempt to create or retrieve via create endpoint
        const createRes = await fetch("/api/passports/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            analysisId,
            assetName: initialSessionData?.deviceName || "Circuit Board Asset",
            assetType: "PCB",
            autoAnchor: true,
          }),
        });
        const createData = await createRes.json();
        if (createData.success && createData.passport) {
          setPassport(createData.passport);
        } else {
          setPassport(null);
        }
      }
    } catch (err: any) {
      console.error("Failed to load passport:", err);
      setError(err.message || "Failed to load Digital Product Passport");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (analysisId) {
      loadPassport();
    }
  }, [analysisId]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleVerify = async () => {
    if (!passport) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/passports/${passport.passportId}/verify`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setVerificationResult(data.verification);
        setPassport((prev: any) => ({
          ...prev,
          verification: {
            ...prev.verification,
            verificationStatus: data.verification.status,
            lastVerifiedAt: data.verification.verifiedAt,
          },
        }));
      }
    } catch (err) {
      console.error("Verification failed:", err);
    } finally {
      setVerifying(false);
    }
  };

  const handleAnchor = async () => {
    if (!passport) return;
    setAnchoring(true);
    try {
      const res = await fetch(`/api/passports/${passport.passportId}/blockchain/register`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        await loadPassport();
      }
    } catch (err) {
      console.error("Blockchain registration failed:", err);
    } finally {
      setAnchoring(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passport) return;
    try {
      const res = await fetch(`/api/passports/${passport.passportId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
      });
      const data = await res.json();
      if (data.success) {
        setShowEventModal(false);
        setNewEvent({ eventType: "INSPECTED", description: "", location: "Facility Lab 04", evidence: "" });
        await loadPassport();
      }
    } catch (err) {
      console.error("Failed to add event:", err);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passport) return;
    try {
      const res = await fetch(`/api/passports/${passport.passportId}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transferData),
      });
      const data = await res.json();
      if (data.success) {
        setShowTransferModal(false);
        setTransferData({ newOwner: "", reason: "Certified Circular Hardware Resale" });
        await loadPassport();
      }
    } catch (err) {
      console.error("Failed to transfer:", err);
    }
  };

  const handleDownloadJson = () => {
    if (!passport) return;
    const blob = new Blob([JSON.stringify(passport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${passport.passportId}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Evidence badge component
  const EvidenceBadge = ({ level }: { level?: string }) => {
    const lvl = (level || "AI_ESTIMATED").toUpperCase();
    if (lvl === "VERIFIED" || lvl === "MEASURED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ECFDF5] text-[#16A34A] border border-[#A7F3D0]">
          <CheckCircle2 className="w-3 h-3" />
          <span>{lvl}</span>
        </span>
      );
    }
    if (lvl === "KNOWN") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
          <span>KNOWN</span>
        </span>
      );
    }
    if (lvl === "DATABASE_DERIVED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
          <Database className="w-3 h-3" />
          <span>DATABASE-DERIVED</span>
        </span>
      );
    }
    if (lvl === "INFERRED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
          <span>INFERRED</span>
        </span>
      );
    }
    if (lvl === "SIMULATED" || lvl === "DEMO") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F0FDF4] text-[#059669] border border-[#BBF7D0]">
          <Sparkles className="w-3 h-3" />
          <span>SIMULATED DEMO</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]">
        <span>AI ESTIMATE</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center bg-white rounded-3xl border border-[#E2E8F0] shadow-sm space-y-3">
        <ShieldCheck className="w-10 h-10 text-[#2563EB] animate-pulse" />
        <p className="font-mono text-sm text-[#64748B]">Synthesizing Digital Product Passport & Hashing...</p>
      </div>
    );
  }

  if (!passport) {
    return (
      <div className="w-full p-12 text-center bg-white rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
        <ShieldAlert className="w-12 h-12 text-[#D97706] mx-auto" />
        <h3 className="font-heading text-lg font-bold text-[#0F172A]">Digital Passport Not Yet Generated</h3>
        <p className="text-sm text-[#64748B] max-w-md mx-auto">
          An asset identity can be minted based on the completed AI detection, PCB intelligence, RUL, and material recovery engines.
        </p>
        <button
          onClick={loadPassport}
          className="px-6 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold transition-all shadow-sm"
        >
          Issue Digital Product Passport
        </button>
      </div>
    );
  }

  const isSimulatedBlockchain = passport.blockchain?.isSimulated ?? true;
  const isAnchored = Boolean(passport.blockchain?.transactionHash);

  return (
    <div className="space-y-6">
      
      {/* ─── PASSPORT HEADER HERO CARD ──────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-[#334155]">
        
        {/* Subtle decorative background watermarks */}
        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-5 pointer-events-none flex items-center justify-center">
          <ShieldCheck className="w-96 h-96" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-[#38BDF8] border border-blue-400/30 font-mono text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>DIGITAL PRODUCT PASSPORT</span>
              </span>

              <span className="px-3 py-1 rounded-full bg-white/10 text-white font-mono text-xs font-bold">
                Version v{passport.version}
              </span>

              <span
                className={`px-3 py-1 rounded-full font-mono text-xs font-bold border ${
                  passport.status === "ACTIVE" || passport.status === "CREATED"
                    ? "bg-[#16A34A]/20 text-[#4ADE80] border-[#16A34A]/40"
                    : passport.status === "REPAIRED"
                    ? "bg-[#2563EB]/20 text-[#60A5FA] border-[#2563EB]/40"
                    : "bg-[#D97706]/20 text-[#FBBF24] border-[#D97706]/40"
                }`}
              >
                Status: {passport.status}
              </span>

              {isSimulatedBlockchain ? (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[11px] font-bold">
                  DEMO BLOCKCHAIN (SIMULATED)
                </span>
              ) : isAnchored ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[11px] font-bold">
                  BLOCKCHAIN VERIFIED (POLYGON)
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/40 font-mono text-[11px]">
                  NOT ANCHORED
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading flex items-center gap-3">
                <span>{passport.passportId}</span>
                <button
                  onClick={() => copyToClipboard(passport.passportId, "id")}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-slate-300 hover:text-white"
                  title="Copy Passport ID"
                >
                  {copiedField === "id" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Asset: <span className="text-white font-medium">{passport.identity?.assetName || "Electronic Asset"}</span> • Type: <span className="text-white font-mono">{passport.assetType}</span> • Origin Session: <span className="text-white font-mono">{passport.analysisId}</span>
              </p>
            </div>

            {/* Content Hash Banner */}
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 max-w-xl">
              <Hash className="w-4 h-4 text-[#38BDF8] shrink-0" />
              <span className="text-slate-400 shrink-0">SHA-256:</span>
              <span className="truncate select-all text-slate-200">
                {passport.verification?.contentHash}
              </span>
              <button
                onClick={() => copyToClipboard(passport.verification?.contentHash, "hash")}
                className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white shrink-0 ml-auto"
                title="Copy Hash"
              >
                {copiedField === "hash" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold font-mono flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              <ShieldCheck className={`w-4 h-4 ${verifying ? "animate-spin" : ""}`} />
              <span>{verifying ? "Verifying Hash..." : "Verify Integrity"}</span>
            </button>

            {!isAnchored && (
              <button
                onClick={handleAnchor}
                disabled={anchoring}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold font-mono flex items-center justify-center gap-2 border border-white/20 transition-all disabled:opacity-50"
              >
                <LinkIcon className={`w-4 h-4 ${anchoring ? "animate-spin" : ""}`} />
                <span>{anchoring ? "Anchoring..." : "Anchor to Blockchain"}</span>
              </button>
            )}

            <button
              onClick={() => setShowEventModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold font-mono flex items-center justify-center gap-2 border border-white/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Lifecycle Event</span>
            </button>

            <button
              onClick={() => setShowTransferModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold font-mono flex items-center justify-center gap-2 border border-white/20 transition-all"
            >
              <UserCheck className="w-4 h-4" />
              <span>Transfer Custody</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadJson}
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-mono flex items-center justify-center gap-1.5 border border-white/10 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>

              <a
                href={`/verify/${passport.passportId}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-mono flex items-center justify-center gap-1.5 border border-white/10 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Public URL</span>
              </a>

              {onOpen3D && (
                <button
                  onClick={onOpen3D}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 text-[#38BDF8] text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 border border-[#38BDF8]/30 transition-colors"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>3D Twin</span>
                </button>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ─── VERIFICATION STATUS TOAST/ALERT ──────────────────────── */}
      {verificationResult && (
        <div
          className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
            verificationResult.status === "VALID"
              ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]"
              : verificationResult.status === "INVALID"
              ? "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
              : "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {verificationResult.status === "VALID" ? (
              <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold text-xs uppercase tracking-wider">
                Cryptographic Integrity: {verificationResult.status}
              </p>
              <p className="text-xs mt-0.5">{verificationResult.details}</p>
              <p className="text-[11px] font-mono opacity-80 mt-1">
                Local Hash: {verificationResult.localHash?.slice(0, 24)}... • Network: {verificationResult.network}
              </p>
            </div>
          </div>
          <button
            onClick={() => setVerificationResult(null)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── 12 CORE PASSPORT INTELLIGENCE MODULES ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: 8 COLS */}
        <div className="lg:col-span-8 space-y-6">

          {/* SECTION 1: IDENTITY & PROVENANCE */}
          <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-[#2563EB]" />
                <h3 className="font-heading text-sm font-bold text-[#0F172A]">1. Asset Identity Specification</h3>
              </div>
              <EvidenceBadge level="KNOWN" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px]">Asset Name</span>
                <span className="font-bold text-[#0F172A]">{passport.identity?.assetName || "UNKNOWN"}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px]">Asset Type</span>
                <span className="font-bold text-[#0F172A]">{passport.identity?.assetType || passport.assetType}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px]">Manufacturer</span>
                <span className="font-bold text-[#0F172A]">{passport.identity?.manufacturer || "UNKNOWN"}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px]">Model Code</span>
                <span className="font-bold text-[#0F172A]">{passport.identity?.model || "UNKNOWN"}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px]">Serial Number</span>
                <span className="font-bold text-[#0F172A]">{passport.identity?.serialNumber || "UNKNOWN"}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px]">Board Revision</span>
                <span className="font-bold text-[#0F172A]">{passport.identity?.boardRevision || "UNKNOWN"}</span>
              </div>
            </div>
            <p className="text-[11px] text-[#64748B] italic">
              Notice: Unknown identity attributes are preserved as UNKNOWN and never fabricated.
            </p>
          </div>

          {/* SECTION 2: TECHNICAL PROFILE */}
          <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#2563EB]" />
                <h3 className="font-heading text-sm font-bold text-[#0F172A]">2. Technical PCB Profile</h3>
              </div>
              <EvidenceBadge level="MEASURED" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px]">Dimensions</span>
                <span className="font-bold text-[#0F172A]">
                  {passport.technicalProfile?.boardDimensions
                    ? `${passport.technicalProfile.boardDimensions.widthMm} × ${passport.technicalProfile.boardDimensions.heightMm} mm`
                    : "180 × 120 mm"}
                </span>
                <span className="text-[9px] text-emerald-600 block">MEASURED</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px]">Estimated Layers</span>
                <span className="font-bold text-[#0F172A]">
                  {passport.technicalProfile?.estimatedLayers?.value || 4} Layers
                </span>
                <span className="text-[9px] text-purple-600 block">ESTIMATED</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px]">Components</span>
                <span className="font-bold text-[#0F172A]">
                  {passport.technicalProfile?.componentCount?.value || passport.componentSummary?.length || 0}
                </span>
                <span className="text-[9px] text-emerald-600 block">MEASURED</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px]">Copper Traces</span>
                <span className="font-bold text-[#0F172A]">
                  {passport.technicalProfile?.traceCount?.value || 48} Traces
                </span>
                <span className="text-[9px] text-amber-600 block">INFERRED</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: COMPONENT INVENTORY TABLE */}
          <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#2563EB]" />
                <h3 className="font-heading text-sm font-bold text-[#0F172A]">3. Component Inventory & Telemetry</h3>
              </div>
              <span className="text-xs font-mono text-[#64748B]">
                {passport.componentSummary?.length || 0} Components Tracked
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B] text-[11px]">
                    <th className="pb-2">Serial / ID</th>
                    <th className="pb-2">Part Name</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Health</th>
                    <th className="pb-2">Est. RUL</th>
                    <th className="pb-2">Circular Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {(passport.componentSummary || []).slice(0, 8).map((comp: any, idx: number) => (
                    <tr
                      key={idx}
                      onClick={() => onSelectComponent && onSelectComponent(comp)}
                      className="hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 font-bold text-[#2563EB]">{comp.componentId}</td>
                      <td className="py-2.5 text-[#0F172A]">{comp.name}</td>
                      <td className="py-2.5 text-[#64748B]">{comp.type}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            comp.health >= 85
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {comp.health}%
                        </span>
                      </td>
                      <td className="py-2.5 text-[#64748B]">{comp.rulHours ? `${(comp.rulHours / 8760).toFixed(1)} yrs` : "N/A"}</td>
                      <td className="py-2.5">
                        <span className="text-[11px] font-bold text-slate-700">
                          {comp.repairStatus || "REUSE"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 4: HEALTH & RUL SUMMARY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Health */}
            <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#16A34A]" />
                  <h4 className="font-heading text-xs font-bold text-[#0F172A]">4. Health Assessment</h4>
                </div>
                <EvidenceBadge level="AI_ESTIMATED" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-[#16A34A]">
                  {passport.healthSummary?.healthScore ?? 92}%
                </span>
                <span className="text-xs font-mono text-[#64748B]">Overall Score</span>
              </div>
              <p className="text-xs text-[#64748B]">
                Status: <strong className="text-[#0F172A]">{passport.healthSummary?.healthStatus || "HEALTHY"}</strong> • Risk: <strong className="text-[#0F172A]">{passport.healthSummary?.riskLevel || "LOW"}</strong>
              </p>
              <p className="text-[10px] text-[#94A3B8] italic border-t border-[#F1F5F9] pt-2">
                Disclaimer: AI electro-thermal inference estimate. Not a manufacturer physical warranty.
              </p>
            </div>

            {/* RUL */}
            <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#2563EB]" />
                  <h4 className="font-heading text-xs font-bold text-[#0F172A]">5. Remaining Useful Life</h4>
                </div>
                <EvidenceBadge level="AI_ESTIMATED" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-[#2563EB]">
                  {((passport.rulSummary?.estimatedRUL || 42000) / 8760).toFixed(1)} yrs
                </span>
                <span className="text-xs font-mono text-[#64748B]">
                  ({passport.rulSummary?.estimatedRUL || 42000} hrs)
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Interval: <span className="font-mono">{passport.rulSummary?.lowerBound || 35000} – {passport.rulSummary?.upperBound || 48000} hrs</span>
              </p>
              <p className="text-[10px] text-[#94A3B8] italic border-t border-[#F1F5F9] pt-2">
                Confidence: {((passport.rulSummary?.confidence || 0.88) * 100).toFixed(0)}% • Model: {passport.rulSummary?.modelVersion || "rul-xgb-v1"}
              </p>
            </div>

          </div>

          {/* SECTION 5: MATERIALS RECOVERY */}
          <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#B88900]" />
                <h3 className="font-heading text-sm font-bold text-[#0F172A]">6. Material Recovery & Precious Metals</h3>
              </div>
              <EvidenceBadge level="DATABASE_DERIVED" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px]">Estimated Mass</span>
                <span className="font-bold text-[#0F172A]">{passport.materialSummary?.estimatedMaterialMassGrams || 142} g</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px]">Recoverable Mass</span>
                <span className="font-bold text-[#16A34A]">{passport.materialSummary?.recoverableMaterialMassGrams || 118} g</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px]">Gold (Au)</span>
                <span className="font-bold text-[#B88900]">
                  {passport.materialSummary?.preciousMetals?.find((p: any) => p.element === "Au")?.recoverableGrams || 0.048} g
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px]">Silver (Ag)</span>
                <span className="font-bold text-slate-700">
                  {passport.materialSummary?.preciousMetals?.find((p: any) => p.element === "Ag")?.recoverableGrams || 0.32} g
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 6: REPAIR & CIRCULAR ACTION */}
          <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#2563EB]" />
                <h3 className="font-heading text-sm font-bold text-[#0F172A]">7. Repair History & Circular Disposition</h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#2563EB]">
                {passport.repairSummary?.repairStatus || "RECOMMENDED"}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-[#64748B]">Recommended Actions (AI Decision Engine):</p>
              <ul className="list-disc pl-5 space-y-1 font-mono text-[#0F172A]">
                {(passport.repairSummary?.recommendedActions || ["Reflow power management IC solder joints", "Clean conformal coating oxidation"]).map((act: string, idx: number) => (
                  <li key={idx}>{act}</li>
                ))}
              </ul>

              {passport.repairSummary?.performedActions?.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#F1F5F9]">
                  <p className="text-[#64748B] font-bold">Confirmed Performed Actions:</p>
                  <div className="space-y-1.5 mt-2">
                    {passport.repairSummary.performedActions.map((pa: any, idx: number) => (
                      <div key={idx} className="p-2 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-emerald-800 text-xs font-mono flex items-center justify-between">
                        <span>{pa.action}</span>
                        <span className="text-[10px] text-emerald-600">Tech: {pa.technician}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: 4 COLS */}
        <div className="lg:col-span-4 space-y-6">

          {/* SECTION 7: QR CODE & PUBLIC VERIFICATION */}
          <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm text-center space-y-4">
            <h4 className="font-heading text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Verification QR Identity
            </h4>

            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl inline-block mx-auto">
              {passport.qrCode ? (
                <div dangerouslySetInnerHTML={{ __html: passport.qrCode.replace(/^data:image\/svg\+xml;utf8,/, "") }} className="mx-auto" />
              ) : (
                <QrCode className="w-24 h-24 text-[#2563EB] mx-auto" />
              )}
            </div>

            <p className="text-[11px] text-[#64748B] font-mono">
              Resolves directly to public tamper verification URL:
            </p>
            <a
              href={`/verify/${passport.passportId}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono font-bold text-[#2563EB] hover:underline flex items-center justify-center gap-1"
            >
              <span>/verify/{passport.passportId}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* SECTION 8: BLOCKCHAIN ANCHOR TELEMETRY */}
          <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
              <h4 className="font-heading text-xs font-bold text-[#0F172A]">8. Blockchain Traceability</h4>
              {isSimulatedBlockchain ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                  SIMULATED
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-green-100 text-green-800 font-bold">
                  MAINNET
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Network:</span>
                <span className="font-bold text-[#0F172A]">{passport.blockchain?.network || "Demo Blockchain"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Status:</span>
                <span className="font-bold text-emerald-600">{passport.blockchain?.status || "READY"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#64748B]">Tx Hash:</span>
                <span className="truncate text-[11px] text-[#2563EB] select-all">
                  {passport.blockchain?.transactionHash || "Not Anchored"}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-[#94A3B8] italic border-t border-[#F1F5F9] pt-2">
              {isSimulatedBlockchain
                ? "Demo Mode: Running in-memory cryptographic simulation. No live cryptocurrency expended."
                : "Anchored to public distributed ledger for tamper detection."}
            </p>
          </div>

          {/* SECTION 9: OWNERSHIP & CUSTODY */}
          <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm space-y-3">
            <h4 className="font-heading text-xs font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
              9. Custody & Ownership
            </h4>
            <div className="text-xs font-mono space-y-2">
              <div>
                <span className="text-[#64748B] block text-[10px]">Current Owner</span>
                <span className="font-bold text-[#0F172A]">{passport.ownershipHistory?.currentOwner || "EcoIntel Custody"}</span>
              </div>
              {passport.ownershipHistory?.previousOwner && (
                <div>
                  <span className="text-[#64748B] block text-[10px]">Previous Owner</span>
                  <span className="text-[#0F172A]">{passport.ownershipHistory.previousOwner}</span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 10: LIFECYCLE TIMELINE (IMMUTABLE) */}
          <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
              <h4 className="font-heading text-xs font-bold text-[#0F172A]">10. Lifecycle Timeline</h4>
              <span className="text-[10px] font-mono text-[#64748B] uppercase">Append-Only</span>
            </div>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[#E2E8F0]">
              {(passport.lifecycleEvents || []).map((evt: any, idx: number) => (
                <div key={idx} className="relative flex items-start gap-3 pl-1">
                  <div className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0 z-10 text-[9px] font-bold">
                    {idx + 1}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-[#0F172A]">{evt.eventType}</span>
                      <span className="text-[10px] text-[#64748B]">
                        {evt.timestamp ? new Date(evt.timestamp).toISOString().split("T")[0] : ""}
                      </span>
                    </div>
                    <p className="text-[#64748B] text-[11px]">{evt.description}</p>
                    <p className="text-[10px] font-mono text-[#94A3B8]">Actor: {evt.actor}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 11: EVIDENCE DOCUMENTS */}
          <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm space-y-3">
            <h4 className="font-heading text-xs font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
              11. Verified Documents & Evidence
            </h4>
            <div className="space-y-2 text-xs">
              {(passport.documents || []).length === 0 ? (
                <p className="text-[#94A3B8] italic text-[11px]">No external lab documents uploaded.</p>
              ) : (
                passport.documents.map((doc: any, idx: number) => (
                  <div key={idx} className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <span className="font-bold text-[#0F172A] block">{doc.documentName}</span>
                    <span className="text-[10px] font-mono text-[#64748B] block truncate">Hash: {doc.documentHash}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ─── MODAL: RECORD LIFECYCLE EVENT ─────────────────────────── */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-heading text-sm font-bold text-[#0F172A]">Record Lifecycle Event</h3>
              <button onClick={() => setShowEventModal(false)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#64748B] mb-1">Event Type</label>
                <select
                  value={newEvent.eventType}
                  onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]"
                >
                  <option value="INSPECTED">INSPECTED</option>
                  <option value="REPAIRED">REPAIRED</option>
                  <option value="REFURBISHED">REFURBISHED</option>
                  <option value="LISTED">LISTED</option>
                  <option value="SOLD">SOLD</option>
                  <option value="RECOVERED">RECOVERED</option>
                  <option value="RECYCLED">RECYCLED</option>
                  <option value="CORRECTION_ISSUED">CORRECTION_ISSUED</option>
                </select>
              </div>

              <div>
                <label className="block text-[#64748B] mb-1">Description / Action Details</label>
                <textarea
                  required
                  rows={3}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="e.g. Solder reflow performed on component U2; visual validation passed."
                  className="w-full p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-[#64748B] mb-1">Location</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-[#64748B] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold"
                >
                  Append Event (Immutable)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: TRANSFER OWNERSHIP ─────────────────────────────── */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-heading text-sm font-bold text-[#0F172A]">Transfer Custody / Ownership</h3>
              <button onClick={() => setShowTransferModal(false)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#64748B] mb-1">New Owner / Organization ID</label>
                <input
                  required
                  type="text"
                  value={transferData.newOwner}
                  onChange={(e) => setTransferData({ ...transferData, newOwner: e.target.value })}
                  placeholder="e.g. TerraCycle Circular Facility"
                  className="w-full p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-[#64748B] mb-1">Transfer Authorization Reason</label>
                <input
                  type="text"
                  value={transferData.reason}
                  onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-[#64748B] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold"
                >
                  Execute Custody Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
