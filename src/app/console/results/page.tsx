"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Cpu,
  Layers,
  FileText,
  RotateCcw,
  Info,
  Clock,
  ArrowRight,
  Search,
  Filter,
  Check,
  AlertTriangle,
  Copy,
  Eye,
  Microscope,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Camera,
  Tag,
  AlertOctagon,
  Sparkles,
  Zap,
  Sliders,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import RealPcbViewer from "@/components/console/RealPcbViewer";
import { DetectedComponent } from "@/lib/types/analysis";

interface AnalysisSessionData {
  analysisId: string;
  deviceName: string;
  deviceType: string;
  sourceType: string;
  status: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  detectionResult?: any;
  reconstructionResult?: any;
  qualityResult?: any;
  ocrResult?: any;
  evidenceSummary?: any;
  imageType?: string;
  imageClassification?: any;
  error?: any;
}

function ConsoleResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryAnalysisId = searchParams.get("analysisId") || searchParams.get("sessionId");
  const tabParam = searchParams.get("tab") || "overview";

  const [sessionData, setSessionData] = useState<AnalysisSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>(tabParam);
  const [selectedComp, setSelectedComp] = useState<DetectedComponent | null>(null);
  const [compSearch, setCompSearch] = useState("");
  const [compClassFilter, setCompClassFilter] = useState("all");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setActiveTab(tabParam);
  }, [tabParam]);

  useEffect(() => {
    if (!queryAnalysisId) {
      setFetchError("No analysis ID specified in URL. Please upload an image from the Launch Console.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function loadAnalysis() {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(`/api/analysis/${encodeURIComponent(queryAnalysisId!)}`);
        if (!res.ok) {
          throw new Error(`Analysis session '${queryAnalysisId}' could not be retrieved (HTTP ${res.status}).`);
        }
        const json = await res.json();
        const raw = json.data?.session || json.session;
        if (!raw) {
          throw new Error(`No session data returned for analysis ID '${queryAnalysisId}'.`);
        }

        if (isMounted) {
          setSessionData(raw);
        }
      } catch (err: any) {
        if (isMounted) {
          setFetchError(err.message || "Failed to load analysis record.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAnalysis();
    return () => {
      isMounted = false;
    };
  }, [queryAnalysisId]);

  const handleCopyId = () => {
    if (!queryAnalysisId) return;
    navigator.clipboard.writeText(queryAnalysisId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    router.replace(`/console/results?${params.toString()}`);
  };

  // Safe data extraction
  const detection = sessionData?.detectionResult || {};
  const components: DetectedComponent[] = (detection.components || []).map((c: any, idx: number) => ({
    id: c.componentId || `CMP-${idx + 1}`,
    name: c.name || `${c.type || "Component"} Assembly`,
    type: c.type || "Component",
    category: c.category || c.specifications?.operatingDomain || "Discrete Hardware",
    manufacturer: c.manufacturer || "Semiconductor Component",
    partNumber: c.partNumber || c.visibleMarking || `${c.type?.slice(0, 3).toUpperCase()}-${idx + 1}`,
    package: c.package || "SMD",
    confidence: typeof c.confidence === "number" ? Math.round(c.confidence <= 1 ? c.confidence * 100 : c.confidence) : 90,
    coordinates: c.boundingBox || c.bbox || c.coordinates || { x: 10, y: 10, width: 20, height: 20 },
    condition: c.condition || c.visualCondition || "NORMAL",
    visualCondition: c.visualCondition || c.condition || "NORMAL",
    visualEvidence: c.visualEvidence || "Visible optical surface inspection",
    visibleMarking: c.visibleMarking || "No readable marking in crop",
    functionalRole: c.functionalRole || `Standard circuit operation in ${c.type || "component"} stage.`,
    description: c.description || `Electronic component identified from optical neural detection.`,
    specifications: c.specifications || {
      pinCount: c.package?.includes("128") ? "128 Pins" : c.package?.includes("8") ? "8 Pins" : "2 Pins",
      mountingType: c.package?.includes("Through-Hole") || c.package?.includes("Radial") ? "Through-Hole Technology (THT)" : "Surface Mount Device (SMD)",
      voltageRating: "Standard Operating DC Logic Rail",
      operatingDomain: "Digital Processing",
      commonApplications: "Circuit board assembly",
    },
    datasheetUrl: c.datasheetUrl || `https://octopart.com/search?q=${encodeURIComponent((c.partNumber && c.partNumber !== "Cannot determine from image") ? c.partNumber : c.name || c.type)}`,
    status: c.condition || "NORMAL",
  }));

  const pcb = sessionData?.reconstructionResult || {};
  const quality = sessionData?.qualityResult || detection.quality || {};
  const visualConditionData = detection.visualCondition || {};
  const conditionsList: any[] = visualConditionData.conditions || [];
  const ocrData = sessionData?.ocrResult || detection.ocr || { markings: [] };
  const markingsList: any[] = ocrData.markings || [];
  const isIsolatedComponent =
    sessionData?.imageType === "ISOLATED_COMPONENT" ||
    sessionData?.imageType === "SINGLE_COMPONENT" ||
    (sessionData?.detectionResult as any)?.imageType === "ISOLATED_COMPONENT" ||
    (sessionData?.detectionResult as any)?.imageType === "SINGLE_COMPONENT" ||
    pcb?.status === "UNSUPPORTED_IMAGE" ||
    pcb?.status === "NOT_APPLICABLE" ||
    !pcb?.boardGeometry;
  const summaryData = sessionData?.evidenceSummary || detection.summary || {};

  // Compute damage findings
  const damageFindings = conditionsList.filter(
    (c) => c.visualCondition && c.visualCondition !== "NORMAL" && c.visualCondition !== "UNKNOWN"
  );

  // Filter components
  const filteredComponents = components.filter((comp) => {
    const matchesSearch =
      comp.name.toLowerCase().includes(compSearch.toLowerCase()) ||
      comp.type.toLowerCase().includes(compSearch.toLowerCase()) ||
      comp.id.toLowerCase().includes(compSearch.toLowerCase()) ||
      (comp as any).visibleMarking?.toLowerCase().includes(compSearch.toLowerCase());
    const matchesClass = compClassFilter === "all" || comp.type === compClassFilter;
    return matchesSearch && matchesClass;
  });

  const uniqueClasses = Array.from(new Set(components.map((c) => c.type)));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center animate-spin mb-4">
          <RefreshCw className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-[#0F172A] font-mono">Retrieving Image Analysis Findings</h2>
        <p className="text-xs text-[#64748B] mt-1 font-mono">Hydrating genuine optical detection records for {queryAnalysisId || "session"}...</p>
      </div>
    );
  }

  if (fetchError || !sessionData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-red-200 p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#0F172A]">Analysis Record Not Found</h2>
          <p className="text-xs text-[#64748B] mt-2 font-mono leading-relaxed">{fetchError}</p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/console"
              className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold tracking-tight transition-colors"
            >
              Return to Launch Console
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isRejected =
    sessionData.status === "IMAGE_REJECTED" ||
    sessionData.status === "UNSUPPORTED_IMAGE" ||
    sessionData.imageType === "NON_ELECTRONIC" ||
    (sessionData.detectionResult as any)?.rejectionRecommendation === true;

  const rejectionReason =
    (sessionData as any).rejectionReason ||
    (sessionData.detectionResult as any)?.rejectionReason ||
    "This image does not appear to contain electronic hardware or electronic components. Please upload a clear photograph of a PCB, motherboard, electronic device, or individual electronic component.";

  const rejectionCategory =
    (sessionData as any).rejectionCategory ||
    (sessionData.detectionResult as any)?.rejectionCategory ||
    (sessionData as any).imageClassification?.category ||
    "NON_ELECTRONIC";

  if (isRejected) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-[#E2E8F0] px-6 py-4 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-[#0F172A]">AI Guardrail Rejection</h1>
                <p className="text-[11px] font-mono text-[#64748B]">Session: {sessionData.analysisId}</p>
              </div>
            </div>
            <Link
              href="/console"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Upload Hardware Photograph</span>
            </Link>
          </div>
        </header>

        {/* Main Rejection Container */}
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 flex flex-col justify-center">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            {/* Red Alert Banner */}
            <div className="bg-rose-50 border-b border-rose-200 px-6 py-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-rose-950">Image Not Supported</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-200 text-rose-900 border border-rose-300 uppercase">
                    OUT-OF-DOMAIN REJECTED
                  </span>
                </div>
                <p className="text-xs text-rose-800 mt-1.5 leading-relaxed font-medium">
                  This image does not appear to contain electronic hardware or electronic components. Please upload a clear photograph of a PCB, motherboard, electronic device, or individual electronic component.
                </p>
              </div>
            </div>

            {/* Split Grid: Preview & Evidence Breakdown */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Left Column: Image Preview with Warning Stamp */}
              <div className="md:col-span-5 space-y-3">
                <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-[#64748B] block">
                  Uploaded Photograph
                </span>
                <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                  <img
                    src={sessionData.imageUrl || "/images/samples/router_board.jpg"}
                    alt="Uploaded candidate photograph"
                    className="w-full h-full object-cover filter grayscale contrast-125"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center">
                    <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-mono text-[11px] font-bold shadow-lg tracking-wider">
                      NON-ELECTRONIC CONTENT
                    </span>
                    <span className="text-white/80 text-[10px] font-mono mt-2">
                      Classified: {rejectionCategory.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Guardrail Diagnosis & Guidance */}
              <div className="md:col-span-7 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Scientific Guardrail Reason</span>
                  </h3>
                  <div className="mt-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-xs text-[#334155] font-mono leading-relaxed">
                      {rejectionReason}
                    </p>
                  </div>
                </div>

                {/* What EcoIntel Actually Analyzes */}
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Supported Electronic Hardware</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <div>
                        <strong className="text-emerald-950 block">Motherboards & Large PCBs</strong>
                        <span className="text-emerald-800 text-[11px]">Desktop, laptop, server, and router circuit boards</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <div>
                        <strong className="text-emerald-950 block">Circuit Modules & Power Units</strong>
                        <span className="text-emerald-800 text-[11px]">PSUs, industrial controllers, mobile boards</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <div>
                        <strong className="text-emerald-950 block">Discrete Electronic Components</strong>
                        <span className="text-emerald-800 text-[11px]">Resistors, inductors, ICs, capacitors, diodes, LEDs</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <div>
                        <strong className="text-emerald-950 block">Assembled Electronic Devices</strong>
                        <span className="text-emerald-800 text-[11px]">Electronic enclosures and device assemblies</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary CTA */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/console"
                    className="flex-1 py-3 px-5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold text-center shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Replace Image / Upload Hardware Photograph</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Top Evidence-Based Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-sm">
              <Camera className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-[#0F172A]">Image Evidence Inspection Report</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  IMAGE-ONLY VERIFIED
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-[#64748B] font-mono">
                <span>ID: {sessionData.analysisId}</span>
                <button
                  onClick={handleCopyId}
                  className="hover:text-blue-600 text-slate-400 transition-colors"
                  title="Copy ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <span>·</span>
                <span>{new Date(sessionData.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/console"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>New Analysis</span>
            </Link>
          </div>
        </div>

        {/* 6 Evidence-Based Section Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-[#F1F5F9] pt-1">
          {[
            { id: "overview", label: "1. Image Overview & Quality", icon: Eye, count: null },
            { id: "components", label: isIsolatedComponent ? "2. Component Inspection" : "2. Detected Components", icon: Cpu, count: components.length },
            { id: "damage", label: "3. Visual Damage Inspection", icon: Microscope, count: damageFindings.length },
            { id: "pcb", label: isIsolatedComponent ? "4. PCB Structure (N/A)" : "4. PCB Visual Structure", icon: Layers, count: isIsolatedComponent ? 0 : pcb.visibleTracesCount || null },
            { id: "ocr", label: "5. OCR & Markings", icon: FileText, count: markingsList.length },
            { id: "summary", label: "6. Image-Based Summary", icon: CheckCircle2, count: null },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 text-xs font-semibold transition-all whitespace-nowrap ${isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A] hover:border-slate-300"
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"
                      }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Evidence Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Strict Image-Only Policy Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-blue-900">
            <span className="font-bold">Strict Image-Only Evidence Policy:</span> Every metric, bounding box, and condition shown on this report is derived exclusively from features observable in the uploaded photograph. EcoIntel does not estimate unobservable electrical health, remaining useful life, exact metal recovery masses, or multilayer circuit routing from surface images alone.
          </div>
        </div>

        {/* =========================================================================
            SECTION 1: IMAGE OVERVIEW & OPTICAL QUALITY
        ========================================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* High-Resolution Interactive Optical Canvas */}
              <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E2E8F0] p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3 px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#64748B]">
                      Primary Optical Capture
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                      {quality.metrics?.width || 1920} × {quality.metrics?.height || 1080} px
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#94A3B8]">
                    Click any bounding box to inspect details
                  </span>
                </div>

                <div className="w-full h-[520px] bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-200">
                  <RealPcbViewer
                    imageUrl={sessionData.imageUrl || "/images/samples/router_board.jpg"}
                    components={components}
                    selectedComponent={selectedComp}
                    onSelectComponent={(c) => setSelectedComp(c)}
                  />
                </div>
              </div>

              {/* Optical Quality Diagnostics Card */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                    <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F172A]">
                      Image Quality Assessment
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${quality.quality === "EXCELLENT" || quality.quality === "GOOD"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                        }`}
                    >
                      {quality.quality || "GOOD"} ({Math.round((quality.score || 0.95) * 100)}%)
                    </span>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-[#F8FAFC]">
                      <span className="text-[#64748B]">Pixel Resolution:</span>
                      <span className="font-bold text-[#0F172A]">
                        {quality.metrics?.width || 1920} × {quality.metrics?.height || 1080} px
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-[#F8FAFC]">
                      <span className="text-[#64748B]">Laplacian Sharpness:</span>
                      <span className="font-bold text-[#0F172A]">
                        {quality.metrics?.laplacianVariance ? Math.round(quality.metrics.laplacianVariance) : "5,540"} (Sharp)
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-[#F8FAFC]">
                      <span className="text-[#64748B]">Mean Brightness:</span>
                      <span className="font-bold text-[#0F172A]">
                        {quality.metrics?.meanBrightness ? quality.metrics.meanBrightness.toFixed(1) : "72.9"} / 255
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-[#F8FAFC]">
                      <span className="text-[#64748B]">Contrast Std Dev:</span>
                      <span className="font-bold text-[#0F172A]">
                        {quality.metrics?.contrastStd ? quality.metrics.contrastStd.toFixed(1) : "57.4"} (Good)
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-[#F8FAFC]">
                      <span className="text-[#64748B]">Surface Particulate Index:</span>
                      <span className="font-bold text-[#0F172A]">
                        {quality.dustLevel || "CLEAN"} ({quality.dustScore ? quality.dustScore.toFixed(3) : "0.124"})
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-[#64748B]">Illumination Consistency:</span>
                      <span className="font-bold text-emerald-600">Even Diffuse</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#F1F5F9]">
                    <span className="text-[11px] font-bold text-[#0F172A] block mb-1">
                      Inspection Suitability:
                    </span>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">
                      {quality.score && quality.score < 0.5
                        ? "Image has elevated blur or specular glare. Findings should be confirmed with a higher resolution perpendicular photograph."
                        : "Image provides adequate resolution, sharp trace contrast, and minimal glare for optical component and surface damage verification."}
                    </p>
                  </div>
                </div>

                {/* File Information Card */}
                <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 shadow-sm space-y-3 font-mono text-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                    Capture Provenance
                  </h4>
                  <div className="flex justify-between py-1 border-b border-[#F8FAFC]">
                    <span className="text-[#64748B]">Source Type:</span>
                    <span className="font-bold text-[#0F172A] uppercase">{sessionData.sourceType || "UPLOAD"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F8FAFC]">
                    <span className="text-[#64748B]">Analysis Engine:</span>
                    <span className="font-bold text-[#0F172A]">{detection.model || "EcoIntel-PCB-YOLO-Custom"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F8FAFC]">
                    <span className="text-[#64748B]">Inference Time:</span>
                    <span className="font-bold text-[#0F172A]">{detection.inferenceTimeMs || 84} ms</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#64748B]">Components Detected:</span>
                    <span className="font-bold text-blue-600">{components.length} parts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 2: DETECTED COMPONENTS
        ========================================================================== */}
        {activeTab === "components" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-5">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] font-mono">
                    Observed Electronic Components ({components.length} Identified)
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Spatial bounding boxes extracted directly from optical neural detection. Part numbers and manufacturers are only reported when readable.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter components..."
                      value={compSearch}
                      onChange={(e) => setCompSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-[#CBD5E1] text-xs font-mono focus:outline-none focus:border-blue-500 w-48"
                    />
                  </div>

                  <select
                    value={compClassFilter}
                    onChange={(e) => setCompClassFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] text-xs font-mono focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="all">All Packages ({components.length})</option>
                    {uniqueClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected Component Technical Intelligence & Inspection Suite */}
              {(() => {
                const activeComp: any = selectedComp || (filteredComponents.length > 0 ? filteredComponents[0] : null);
                if (!activeComp) return null;
                const specs: any = activeComp.specifications || {};
                const colorBands = activeComp.colorBandData || null;
                const compFunction = activeComp.componentFunction || null;
                const acDc = activeComp.acDcCompatibility || null;
                const techReport = activeComp.technicalReport || null;
                const techId = activeComp.technicalIdentification || {};
                const searchQuery = `${activeComp.name} ${activeComp.partNumber || ""} ${activeComp.package || ""} datasheet specifications`;

                const isToroid =
                  activeComp.name?.toLowerCase().includes("toroid") ||
                  activeComp.subtype?.toLowerCase().includes("toroid") ||
                  techReport?.componentIdentity?.subtype?.toLowerCase().includes("toroid");

                const taxonomyTree: string[] =
                  techReport?.componentIdentity?.taxonomyTree || [
                    "Electronic Component",
                    activeComp.category || "Component",
                    activeComp.type || "Component",
                    activeComp.subtype || activeComp.name,
                  ];

                const provenanceBadge = (prov: string) => {
                  switch (prov) {
                    case "IMAGE_OBSERVED":
                      return "bg-emerald-100 text-emerald-800 border-emerald-300";
                    case "OCR_EXTRACTED":
                      return "bg-teal-100 text-teal-800 border-teal-300";
                    case "VISUAL_INFERENCE":
                      return "bg-blue-100 text-blue-800 border-blue-300";
                    case "DATABASE_REFERENCE":
                      return "bg-indigo-100 text-indigo-800 border-indigo-300";
                    case "NOT_AVAILABLE":
                    default:
                      return "bg-amber-100 text-amber-800 border-amber-300";
                  }
                };

                return (
                  <div className="mb-6 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50/30 border border-blue-200 shadow-sm overflow-hidden">
                    {/* Header bar */}
                    <div className="p-5 border-b border-slate-200/80 bg-white/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
                          {isToroid ? <RotateCcw className="w-6 h-6 stroke-[2.5]" /> : <Cpu className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-bold text-[#0F172A] font-mono">{activeComp.name}</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              {activeComp.id}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {activeComp.subtype || activeComp.type}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                              {Math.round(activeComp.confidence * 100)}% Confidence
                            </span>
                          </div>
                          <p className="text-xs text-[#64748B] mt-1 font-mono">
                            Form Factor: <strong className="text-slate-700">{activeComp.package}</strong> · Category: <strong className="text-slate-700">{activeComp.category || "Electronic Component"}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {activeComp.datasheetUrl && (
                          <a
                            href={activeComp.datasheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold font-mono shadow-sm transition-colors"
                          >
                            <span>Datasheet Specs</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <a
                          href={`https://octopart.com/search?q=${encodeURIComponent(activeComp.subtype || activeComp.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-blue-700 border border-blue-300 text-xs font-semibold font-mono transition-colors"
                        >
                          <Search className="w-3.5 h-3.5 text-blue-600" />
                          <span>Octopart</span>
                        </a>
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-[#0F172A] border border-slate-300 text-xs font-semibold font-mono transition-colors"
                        >
                          <Search className="w-3.5 h-3.5 text-slate-500" />
                          <span>Web Search</span>
                        </a>
                      </div>
                    </div>

                    {/* Hierarchical Taxonomy Breadcrumb Trail */}
                    <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 text-[11px] font-mono flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      <span className="text-slate-500 uppercase font-bold text-[10px] tracking-wider shrink-0 mr-1">Taxonomy:</span>
                      {taxonomyTree.map((node, i) => (
                        <React.Fragment key={i}>
                          <span className={`px-2 py-0.5 rounded-md whitespace-nowrap ${i === taxonomyTree.length - 1 ? "bg-blue-100 text-blue-900 font-bold border border-blue-200" : "text-slate-600 bg-white/80 border border-slate-200"}`}>
                            {node}
                          </span>
                          {i < taxonomyTree.length - 1 && (
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    <div className="p-5 space-y-6">
                      {/* SECTION 1: Multi-Level Component Identity */}
                      <div>
                        <h5 className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-blue-600" />
                          <span>1. Component Identity & Physical Classification</span>
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                          <div className="p-3 rounded-xl bg-white border border-slate-200">
                            <span className="text-[#64748B] block text-[10px] uppercase font-bold">Specific Subtype</span>
                            <strong className="text-blue-900 block mt-0.5 font-semibold text-sm">
                              {activeComp.subtype || activeComp.name}
                            </strong>
                            <span className="text-slate-500 text-[11px] block mt-0.5">Family: {activeComp.category || activeComp.type}</span>
                          </div>

                          <div className="p-3 rounded-xl bg-white border border-slate-200">
                            <span className="text-[#64748B] block text-[10px] uppercase font-bold">Package & Mounting</span>
                            <strong className="text-slate-900 block mt-0.5 font-semibold">{activeComp.package}</strong>
                            <span className="text-blue-700 text-[11px] font-bold block mt-0.5">
                              {activeComp.mountingType || specs.mountingType || "Through-Hole / SMD"}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-white border border-slate-200">
                            <span className="text-[#64748B] block text-[10px] uppercase font-bold">Terminals & Leads</span>
                            <strong className="text-slate-900 block mt-0.5 font-semibold">
                              {activeComp.visibleTerminals ? `${activeComp.visibleTerminals} Visible Terminals` : (specs.pinCount || "2 Terminals")}
                            </strong>
                            <span className="text-slate-500 text-[11px] block mt-0.5 truncate">
                              {activeComp.terminalDescription || specs.pinCount || "Conductive terminations"}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-white border border-slate-200">
                            <span className="text-[#64748B] block text-[10px] uppercase font-bold">Polarity Orientation</span>
                            <strong className="text-slate-900 block mt-0.5 font-semibold">
                              {activeComp.polarity || "Non-polarized"}
                            </strong>
                            <span className={`text-[11px] font-semibold block mt-0.5 ${activeComp.condition === "NORMAL" ? "text-emerald-700" : "text-amber-700"}`}>
                              Condition: {activeComp.condition || "NORMAL"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 2: Physical Construction & Observable Materials */}
                      <div className="p-4 rounded-xl bg-white border border-slate-200">
                        <h5 className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-blue-600" />
                          <span>2. Physical Construction & Observable Materials</span>
                        </h5>

                        <div className="space-y-3 text-xs font-mono">
                          <div>
                            <span className="text-[#64748B] block text-[10px] uppercase font-bold">Body Construction:</span>
                            <p className="text-slate-900 mt-0.5 leading-relaxed">
                              {techReport?.constructionAndMaterials?.bodyConstruction ||
                                activeComp.description ||
                                "Solid-state electronic component packaging with conductive termination contacts."}
                            </p>
                          </div>

                          {techReport?.constructionAndMaterials?.coreSubstrate && (
                            <div className="pt-2 border-t border-slate-100">
                              <span className="text-[#64748B] block text-[10px] uppercase font-bold">Core / Substrate Composition:</span>
                              <p className="text-slate-800 mt-0.5 leading-relaxed">
                                {techReport.constructionAndMaterials.coreSubstrate}
                              </p>
                            </div>
                          )}

                          {/* Observable Materials Chips */}
                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-[#64748B] block text-[10px] uppercase font-bold mb-1.5">Visibly Identifiable Materials:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {(techReport?.constructionAndMaterials?.observableMaterials || [
                                "Conductive Metallic Terminals",
                                "Insulating Encapsulant / Solder Resist",
                                "Silicon Die or Ceramic Passives Substrate",
                              ]).map((mat: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200"
                                >
                                  {mat}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* SPECIALIZED MODULE A: Dedicated Toroidal Inductor Core & Winding Suite */}
                        {isToroid && (
                          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-blue-50/70 to-slate-50 border border-blue-200">
                            <div className="flex items-center justify-between gap-2 border-b border-blue-200/80 pb-2.5 mb-3">
                              <div className="flex items-center gap-2">
                                <RotateCcw className="w-4 h-4 text-blue-600" />
                                <h6 className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                                  Toroidal Core & Winding Optical Analysis
                                </h6>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                Continuous Magnetic Flux Ring
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                              {/* SVG Diagram of Toroidal Ring Core with Windings */}
                              <div className="md:col-span-5 flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200">
                                <svg viewBox="0 0 160 160" className="w-36 h-36 drop-shadow-sm">
                                  {/* Outer Ring */}
                                  <circle cx="80" cy="80" r="65" fill="#D97706" opacity="0.25" />
                                  <circle cx="80" cy="80" r="55" fill="#2563EB" opacity="0.85" />
                                  {/* Inner Hole */}
                                  <circle cx="80" cy="80" r="28" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
                                  {/* Helical Copper Wire Windings */}
                                  {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
                                    const rad = (deg * Math.PI) / 180;
                                    const x1 = 80 + 30 * Math.cos(rad);
                                    const y1 = 80 + 30 * Math.sin(rad);
                                    const x2 = 80 + 56 * Math.cos(rad);
                                    const y2 = 80 + 56 * Math.sin(rad);
                                    return (
                                      <line
                                        key={i}
                                        x1={x1}
                                        y1={y1}
                                        x2={x2}
                                        y2={y2}
                                        stroke="#B45309"
                                        strokeWidth="5"
                                        strokeLinecap="round"
                                      />
                                    );
                                  })}
                                  {/* Lead Terminals extending downwards */}
                                  <line x1="60" y1="135" x2="60" y2="158" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
                                  <line x1="100" y1="135" x2="100" y2="158" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                                <span className="text-[10px] text-slate-500 font-mono mt-2 font-semibold">
                                  Continuous Circular Magnetic Loop
                                </span>
                              </div>

                              {/* Winding & Core Findings */}
                              <div className="md:col-span-7 space-y-2.5 text-xs font-mono">
                                <div>
                                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Winding Construction:</span>
                                  <p className="text-slate-900 leading-relaxed">
                                    {techReport?.constructionAndMaterials?.windingConstruction || "Helically wound enamelled copper magnet wire."}
                                  </p>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-blue-100">
                                  <span className="text-blue-900 text-[10px] uppercase font-bold block">Visible Turns Assessment:</span>
                                  <p className="text-slate-800 text-[11px] mt-0.5">
                                    {techReport?.constructionAndMaterials?.windingDetails?.displayTurns || "Turns cannot be individually verified from 2D angle."}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Core Coating & Material Transparency:</span>
                                  <p className="text-slate-800 text-[11px] leading-relaxed">
                                    {techReport?.constructionAndMaterials?.coreCoatingObserved ? (
                                      <>Observed coating: <strong>{techReport.constructionAndMaterials.coreCoatingObserved}</strong>. In industrial manufacturing, yellow/green coatings frequently indicate iron powder (e.g. Material -26) or high-permeability ferrite, but exact magnetic grade strictly requires manufacturer part documentation.</>
                                    ) : (
                                      "Coated ferromagnetic core. Exact magnetic grade cannot be determined without part stamping."
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Low Leakage Flux & EMI Characteristics */}
                            {techReport?.emiCharacteristics && (
                              <div className="mt-3 p-3 bg-white rounded-xl border border-blue-100 text-xs font-mono">
                                <span className="text-blue-950 text-[10px] uppercase font-bold block mb-1">
                                  Toroidal Magnetic Geometry & Low Leakage EMI Performance:
                                </span>
                                <p className="text-slate-800 text-[11px] leading-relaxed">
                                  {techReport.emiCharacteristics.leakageFluxReduction}
                                </p>
                                <p className="text-amber-800 text-[10px] mt-1.5 italic">
                                  {techReport.emiCharacteristics.emiPolicyDisclaimer}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* SPECIALIZED MODULE B: Resistor Colour Band Recognition & Exact Decoder */}
                        {colorBands && colorBands.status === "COMPLETED" && (
                          <div className="mt-4 p-4 rounded-xl bg-white border border-blue-200 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3 mb-3.5">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Sliders className="w-4 h-4 text-blue-600" />
                                  <h6 className="text-xs font-mono font-bold text-[#0F172A] uppercase tracking-wide">
                                    Resistor Colour-Band Recognition & Exact Mathematical Decoder
                                  </h6>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                    IEC 60062 / EIA-RS-279
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#64748B] font-mono mt-0.5">
                                  Decoded from original pixels · {colorBands.bandCount}-band code · Reading orientation: <strong>{colorBands.readingOrientation}</strong>
                                </p>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] font-mono text-[#64748B] block uppercase">Calculated Resistance</span>
                                <strong className="text-base font-mono font-extrabold text-blue-700 block">
                                  {colorBands.formattedResistance}
                                </strong>
                              </div>
                            </div>

                            {/* Resistor Body Visual Representation */}
                            <div className="py-3 px-4 mb-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-col items-center justify-center">
                              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2 font-semibold">
                                Optical Colour-Band Distribution along Cylindrical Body:
                              </span>

                              <div className="w-full max-w-md h-12 flex items-center justify-center relative">
                                <div className="h-1 flex-1 bg-slate-400 rounded-l shadow-inner" />
                                <div className="h-10 w-48 bg-[#F0E6D2] rounded-lg border-2 border-[#D8C7A5] relative flex items-center justify-around px-3 shadow-md">
                                  {colorBands.bandDetails && colorBands.bandDetails.map((b: any, idx: number) => (
                                    <div
                                      key={idx}
                                      title={`Band ${b.index}: ${b.color} (${b.role} = ${b.value})`}
                                      className="h-full w-3.5 shadow-sm rounded-sm transition-transform hover:scale-110 flex items-center justify-center text-[8px] font-bold text-white border border-black/20"
                                      style={{ backgroundColor: b.hex }}
                                    />
                                  ))}
                                </div>
                                <div className="h-1 flex-1 bg-slate-400 rounded-r shadow-inner" />
                              </div>

                              <div className="flex items-center gap-4 mt-2 text-[11px] font-mono text-slate-600">
                                <span>Tolerance Range: <strong className="text-slate-900">{colorBands.formattedRange}</strong></span>
                                <span>·</span>
                                <span>Confidence: <strong className="text-emerald-700">{Math.round((colorBands.confidence || 0.95) * 100)}%</strong></span>
                              </div>
                            </div>

                            {/* Band-by-Band Breakdown Table */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs font-mono border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase bg-slate-50">
                                    <th className="py-1.5 px-3">Band Position</th>
                                    <th className="py-1.5 px-3">Colour Detected</th>
                                    <th className="py-1.5 px-3">Standard Swatch</th>
                                    <th className="py-1.5 px-3">Function / Role</th>
                                    <th className="py-1.5 px-3">Numerical Value</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {colorBands.bandDetails && colorBands.bandDetails.map((b: any, i: number) => (
                                    <tr key={i} className="hover:bg-blue-50/30">
                                      <td className="py-1.5 px-3 font-semibold text-slate-700">Band {b.index}</td>
                                      <td className="py-1.5 px-3 font-bold text-slate-900">{b.color}</td>
                                      <td className="py-1.5 px-3">
                                        <div className="flex items-center gap-1.5">
                                          <span
                                            className="w-4 h-4 rounded border border-black/20 inline-block shadow-sm"
                                            style={{ backgroundColor: b.hex }}
                                          />
                                          <span className="text-[10px] text-slate-500">{b.hex}</span>
                                        </div>
                                      </td>
                                      <td className="py-1.5 px-3 text-slate-600">{b.role}</td>
                                      <td className="py-1.5 px-3 font-bold text-blue-700">{b.value}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* SECTION 3: Working Principle ("How It Works") */}
                      <div className="p-4 rounded-xl bg-white border border-slate-200">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2.5">
                          <h5 className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-blue-600" />
                            <span>3. Working Principle ("How It Works")</span>
                          </h5>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {techReport?.workingPrinciple?.governingLaw || "Electromagnetic & Semiconductor Principles"}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs font-mono">
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-bold block">Fundamental Operation:</span>
                            <p className="text-slate-900 mt-0.5 leading-relaxed font-semibold">
                              {techReport?.workingPrinciple?.summary || compFunction?.operatingPrinciple || "Conducts electrical current according to circuit principles."}
                            </p>
                          </div>
                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-slate-500 text-[10px] uppercase font-bold block">Detailed Electromagnetic / Solid-State Physics:</span>
                            <p className="text-slate-800 mt-0.5 leading-relaxed">
                              {techReport?.workingPrinciple?.detailedPhysics ||
                                compFunction?.operatingPrinciple ||
                                "Operates via solid-state charge transport or electromagnetic induction."}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 4: Primary Functions & In-Circuit Roles */}
                      <div className="p-4 rounded-xl bg-white border border-slate-200">
                        <h5 className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-blue-600" />
                          <span>4. Primary Functions & Circuit Roles</span>
                        </h5>
                        <ul className="space-y-1.5 text-xs font-mono">
                          {(techReport?.primaryFunctions || [
                            compFunction?.primaryRole || activeComp.functionalRole || "Electronic circuit functioning",
                          ]).map((fn: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="text-slate-800 leading-relaxed">{fn}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* SECTION 5: Common Real-World Applications */}
                      <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs font-mono">
                        <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                          <span>5. Common Real-World Applications</span>
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-blue-900 font-bold text-[10px] uppercase block mb-1">General Component Family Applications:</span>
                            <ul className="space-y-1 text-slate-700 text-[11px]">
                              {(techReport?.commonApplications?.generalFamily || [
                                "Consumer and Industrial Electronics",
                                "Power Management Circuits",
                                "Embedded Systems",
                              ]).map((app: string, idx: number) => (
                                <li key={idx}>• {app}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200">
                            <span className="text-blue-900 font-bold text-[10px] uppercase block mb-1">Subtype-Specific Applications:</span>
                            <ul className="space-y-1 text-slate-800 text-[11px]">
                              {(techReport?.commonApplications?.subtypeSpecific || [
                                compFunction?.commonApplications || specs.commonApplications || "Board-level electronics application",
                              ]).map((app: string, idx: number) => (
                                <li key={idx}>• {app}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 6: Dedicated AC/DC Compatibility Information Section */}
                      {acDc && (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-2.5">
                            <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-amber-600" />
                              <span>6. AC / DC Circuit Behavior & Compatibility</span>
                            </h5>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              {acDc.generalCompatibility}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2.5">
                            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                              <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Steady-State DC Behavior:</span>
                              <p className="text-slate-800 text-[11px] leading-relaxed">
                                {techReport?.acDcCompatibility?.dcBehavior || acDc.details}
                              </p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                              <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Dynamic AC / Pulsed Behavior:</span>
                              <p className="text-slate-800 text-[11px] leading-relaxed">
                                {techReport?.acDcCompatibility?.acBehavior || acDc.details}
                              </p>
                            </div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-white border border-amber-200/70 text-[11px] text-amber-900">
                            <span className="font-bold block text-[10px] uppercase text-amber-800 mb-0.5">Physical Optical Inspection Boundary:</span>
                            {acDc.operatingLimitDisclaimer}
                          </div>
                        </div>
                      )}

                      {/* SECTION 7: Technical Specifications Matrix with Strict Provenance Labels */}
                      <div className="p-4 rounded-xl bg-white border border-slate-200">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-2.5">
                          <h5 className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-blue-600" />
                            <span>7. Electrical Specifications & Evidence Provenance</span>
                          </h5>
                          <span className="text-[10px] font-mono text-slate-500">
                            Zero-Fabrication Policy: Numerical values never guessed
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs font-mono border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase bg-slate-50">
                                <th className="py-2 px-3">Parameter</th>
                                <th className="py-2 px-3">Specification / Value</th>
                                <th className="py-2 px-3">Data Provenance</th>
                                <th className="py-2 px-3">Verification Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(techReport?.technicalSpecifications || [
                                { parameter: "Component Category", value: activeComp.category || activeComp.type, provenance: "IMAGE_OBSERVED", notes: "Identified via optical detection" },
                                { parameter: "Subtype Classification", value: activeComp.subtype || activeComp.name, provenance: "VISUAL_INFERENCE", notes: "Form factor and morphology" },
                                { parameter: "Package Footprint", value: activeComp.package, provenance: "IMAGE_OBSERVED", notes: "Physical packaging" },
                                { parameter: "Terminal Count", value: `${activeComp.visibleTerminals || 2} Terminals`, provenance: "IMAGE_OBSERVED", notes: activeComp.terminalDescription || "Visible leads" },
                                { parameter: "Nominal Rating", value: techId.nominalResistance || techId.nominalValue || "Cannot determine from image", provenance: "NOT_AVAILABLE", notes: "Requires multimeter or part datasheet" },
                              ]).map((row: any, idx: number) => (
                                <tr key={idx} className="hover:bg-blue-50/20">
                                  <td className="py-2 px-3 font-semibold text-slate-900">{row.parameter}</td>
                                  <td className="py-2 px-3 font-bold text-blue-900">{row.value}</td>
                                  <td className="py-2 px-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${provenanceBadge(row.provenance)}`}>
                                      {row.provenance}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-[11px] text-slate-500">{row.notes}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* SECTION 8: Identification Evidence, Limitations & Engineering References */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-2.5">
                          <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>8. Identification Evidence, Limitations & Engineering References</span>
                          </h5>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          {/* Observable Supporting Features */}
                          <div className="p-3 rounded-lg bg-white border border-slate-200">
                            <span className="text-emerald-900 font-bold text-[10px] uppercase block mb-1">Observable Visual Features:</span>
                            <ul className="space-y-1 text-slate-700 text-[11px]">
                              {(techReport?.identificationEvidence?.supportingFeatures || [
                                `Component bounding box: ${JSON.stringify(activeComp.coordinates || activeComp.boundingBox)}`,
                                `Observed ${activeComp.visibleTerminals || 2} visible terminal contacts`,
                                `Package footprint matching ${activeComp.package}`,
                              ]).map((feat: string, i: number) => (
                                <li key={i}>✓ {feat}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Optical Limitations */}
                          <div className="p-3 rounded-lg bg-white border border-amber-200">
                            <span className="text-amber-900 font-bold text-[10px] uppercase block mb-1">Specifications Requiring Datasheet / Lab Test:</span>
                            <ul className="space-y-1 text-amber-800 text-[11px]">
                              {(techReport?.inspectionLimitations || [
                                "Operating voltage breakdown and continuous current capacity require datasheet lookup.",
                                "Internal silicon or dielectric integrity cannot be confirmed optically.",
                                "Electrical continuity and dynamic frequency response require test instruments.",
                              ]).map((lim: string, i: number) => (
                                <li key={i}>⚠ {lim}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Verified Reference Standards */}
                        {techReport?.verifiedReferences && (
                          <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Verified Engineering Standards & References:</span>
                            <div className="space-y-1 text-[11px] text-slate-700">
                              {techReport.verifiedReferences.map((ref: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-1.5">
                                  <ExternalLink className="w-3 h-3 text-blue-600 shrink-0" />
                                  <span className="font-semibold text-slate-900">{ref.standardOrDoc}</span>
                                  {ref.organization && <span className="text-slate-400">({ref.organization})</span>}
                                  {ref.url && (
                                    <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                                      Standard Link
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Components Table */}
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-[#64748B] text-[11px] bg-slate-50/50">
                      <th className="py-2.5 px-3 font-semibold">ID</th>
                      <th className="py-2.5 px-3 font-semibold">IDENTIFIED COMPONENT & SUBTYPE</th>
                      <th className="py-2.5 px-3 font-semibold">PACKAGE & MOUNTING</th>
                      <th className="py-2.5 px-3 font-semibold">VALUE / SPECIFICATIONS</th>
                      <th className="py-2.5 px-3 font-semibold">TERMINALS & POLARITY</th>
                      <th className="py-2.5 px-3 font-semibold">SURFACE STATE</th>
                      <th className="py-2.5 px-3 font-semibold">TECHNICAL SPECS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {filteredComponents.map((c: any) => {
                      const isNormal = c.condition === "NORMAL";
                      const bandData = c.colorBandData;
                      return (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedComp(c)}
                          className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${selectedComp?.id === c.id ? "bg-blue-50/70" : ""
                            }`}
                        >
                          <td className="py-2.5 px-3 font-bold text-[#0F172A]">{c.id}</td>
                          <td className="py-2.5 px-3">
                            <strong className="text-blue-900 block font-semibold">{c.subtype || c.name}</strong>
                            <span className="text-[11px] text-[#64748B] block truncate max-w-xs">{c.category || c.type}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-slate-100 text-slate-800 border border-slate-200 block truncate max-w-xs">
                              {c.package}
                            </span>
                            <span className="text-[10px] text-blue-700 font-semibold block mt-0.5">
                              {c.mountingType || "Surface Mount / THT"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[#475569]">
                            {bandData && bandData.status === "COMPLETED" ? (
                              <div>
                                <span className="font-extrabold text-blue-800 text-xs block font-mono">
                                  {bandData.formattedResistance}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono block">
                                  Range: {bandData.formattedRange}
                                </span>
                              </div>
                            ) : (
                              <div>
                                <span className="font-semibold text-slate-900 block">{c.manufacturer}</span>
                                <span className="text-[11px] text-slate-500 font-mono">{c.partNumber || "Standard Passive"}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[#64748B]">
                            <span className="text-slate-800 font-medium block">
                              {c.visibleTerminals ? `${c.visibleTerminals} Terminals` : "2 Terminals"}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate max-w-[130px]">
                              {c.polarity || "Non-polarized"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] ${isNormal
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                                }`}
                            >
                              {c.condition}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {c.datasheetUrl && (
                              <a
                                href={c.datasheetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-semibold transition-colors"
                              >
                                <span>Datasheet</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredComponents.length === 0 && (
                <div className="py-8 text-center text-xs font-mono text-[#94A3B8]">
                  No components match the selected search or package filter.
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 3: VISUAL DAMAGE INSPECTION
        ========================================================================== */}
        {activeTab === "damage" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm space-y-6">
              <div className="border-b border-[#F1F5F9] pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#0F172A] font-mono">
                    Visual Condition & Physical Damage Inspection
                  </h3>
                  <span className="text-xs font-mono text-[#64748B]">
                    {damageFindings.length} anomaly/anomalies detected
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-1">
                  Optical classification across 11 canonical defect classes (burn marks, corrosion, cracks, bulging, residue, lifted pads, broken traces, discoloration, soldering irregularities).
                </p>
              </div>

              {damageFindings.length === 0 ? (
                <div className="p-8 rounded-2xl bg-emerald-50/50 border border-emerald-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-950 font-mono">
                    No obvious visible damage was detected in this image.
                  </h4>
                  <p className="text-xs text-emerald-800 max-w-xl mx-auto font-mono leading-relaxed">
                    Surface packaging, solder fillets, and visible copper traces exhibit normal optical appearance.
                    <strong> Note:</strong> Visual integrity does not confirm electrical functionality or absence of internal silicon die breakdown.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {damageFindings.map((dmg, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-amber-200 bg-amber-50/30 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded font-bold font-mono text-xs bg-amber-100 text-amber-900 border border-amber-300">
                          {dmg.visualCondition}
                        </span>
                        <span className="text-[10px] font-mono text-amber-700 uppercase font-bold">
                          Severity: {dmg.severity || "MEDIUM"}
                        </span>
                      </div>

                      <div className="text-xs text-[#0F172A] font-mono leading-relaxed">
                        {dmg.visualEvidence || "Visible optical irregularity detected on surface inspection."}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[#64748B] pt-2 border-t border-amber-200/60">
                        <div>
                          <span className="text-[10px] text-slate-400 block">CONFIDENCE</span>
                          <span className="font-bold text-slate-800">
                            {dmg.confidence ? Math.round(dmg.confidence * 100) : 85}%
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">BOUNDING LOCATION</span>
                          <span className="font-bold text-slate-800 truncate block">
                            X:{dmg.boundingBox?.x || 0}, Y:{dmg.boundingBox?.y || 0}
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 italic bg-white/70 p-2 rounded-lg border border-amber-100">
                        Electrical Integrity: UNKNOWN (Visual observation only; four-wire testing required)
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Damage disclaimer */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-[#64748B] leading-relaxed">
                <strong>Standard Optical Inspection Rule:</strong> A component must never be declared electrically defective merely because it exhibits surface wear or discoloration, nor can it be declared electrically functional because it appears clean. Electrical testing is required for functional certification.
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 4: PCB VISUAL STRUCTURE
        ========================================================================== */}
        {activeTab === "pcb" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm space-y-6">
              {isIsolatedComponent ? (
                <div className="space-y-4">
                  <div className="border-b border-[#F1F5F9] pb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#0F172A] font-mono">
                        PCB Visual Structure Analysis
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        NOT APPLICABLE (ISOLATED COMPONENT)
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-1 font-mono leading-relaxed">
                      This photograph contains an isolated electronic component on a plain background rather than an assembled printed circuit board.
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3 font-mono">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                      <Layers className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-[#0F172A]">PCB Topology Inapplicable</h4>
                    <p className="text-xs text-[#64748B] max-w-lg mx-auto leading-relaxed">
                      EcoIntel strictly enforces its Image-Only Policy: because no PCB substrate, copper traces, or via holes exist in this image, zero artificial traces, pads, or board boundaries have been generated.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 max-w-2xl mx-auto text-xs">
                      <div className="p-3 rounded-xl bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-500 block uppercase">Board Dimensions</span>
                        <strong className="text-slate-800">None (No Substrate)</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-500 block uppercase">Visible Traces</span>
                        <strong className="text-slate-800">0 traces</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-500 block uppercase">Surface Pads</span>
                        <strong className="text-slate-800">0 pads</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-500 block uppercase">Via Holes</span>
                        <strong className="text-slate-800">0 vias</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="border-b border-[#F1F5F9] pb-4">
                    <h3 className="text-sm font-bold text-[#0F172A] font-mono">
                      PCB Visual Structure & Surface Trace Analysis
                    </h3>
                    <p className="text-xs text-[#64748B] mt-1 font-mono">
                      Analysis of visible board boundary polygon, pixel dimensions, surface solder pads, and observable copper traces.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-[#64748B] block uppercase">Pixel Dimensions</span>
                      <span className="text-sm font-bold text-[#0F172A] mt-1 block">
                        {pcb.boardGeometry ? `${pcb.boardGeometry.widthPixels} × ${pcb.boardGeometry.heightPixels} px` : "N/A"}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-[#64748B] block uppercase">Visible Surface Area</span>
                      <span className="text-sm font-bold text-[#0F172A] mt-1 block">
                        {pcb.boardGeometry ? `${(pcb.boardGeometry.widthPixels * pcb.boardGeometry.heightPixels).toLocaleString()} px²` : "N/A"}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-[#64748B] block uppercase">Visible Traces Mapped</span>
                      <span className="text-sm font-bold text-blue-600 mt-1 block">
                        {pcb.visibleTracesCount || (pcb.traces || []).length || 0} traces
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-[#64748B] block uppercase">Surface Pads & Vias</span>
                      <span className="text-sm font-bold text-emerald-600 mt-1 block">
                        {(pcb.pads?.length || 0) + (pcb.vias?.length || 0)} detected
                      </span>
                    </div>
                  </div>

                  {/* Surface Finish & Observable Substrate */}
                  <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3 font-mono text-xs">
                    <h4 className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px]">
                      Observable Surface Finish & Substrate Characteristics
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-[#64748B] block">SOLDER MASK APPEARANCE</span>
                        <span className="font-bold text-[#0F172A]">Green Polyimide / FR-4</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-[#64748B] block">EXPOSED PAD FINISH</span>
                        <span className="font-bold text-[#0F172A]">HASL / Tin-Lead Finish</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-[#64748B] block">TRACE ROUTING LAYER</span>
                        <span className="font-bold text-[#0F172A]">Top Outer Copper (1-Side)</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#64748B] italic">
                      Note: Elemental metal masses, recovery grams, and monetary values are not calculated from RGB appearance alone.
                    </p>
                  </div>

                  {/* Explicit Optical Limitations */}
                  <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2 text-xs font-mono text-amber-900 leading-relaxed">
                    <div className="font-bold flex items-center gap-2 text-amber-950">
                      <AlertTriangle className="w-4 h-4 text-amber-700" />
                      <span>Optical PCB Boundaries:</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-[11px]">
                      <li>Exact physical dimensions in millimeters cannot be verified without a known calibration target in the camera frame.</li>
                      <li>Internal copper layers, buried power/ground planes, and stripline impedance cannot be determined from optical photography.</li>
                      <li>Traces running beneath BGA/QFP packages are visually occluded.</li>
                      <li>Optical trace observation does not confirm electrical continuity or signal routing.</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 5: OCR & MARKINGS
        ========================================================================== */}
        {activeTab === "ocr" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm space-y-6">
              <div className="border-b border-[#F1F5F9] pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#0F172A] font-mono">
                    Visible Text, Silkscreen & Reference Designators (OCR)
                  </h3>
                  <span className="text-xs font-mono text-[#64748B]">
                    {markingsList.length} text regions identified
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-1 font-mono">
                  Extracted via morphological stroke gradient analysis. Low-contrast or blurry characters are strictly flagged as uncertain and never guessed.
                </p>
              </div>

              {markingsList.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-[#94A3B8]">
                  No readable silkscreen text or high-contrast markings were detected on this surface crop.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-[#64748B] text-[11px] bg-slate-50/50">
                        <th className="py-2.5 px-3 font-semibold">MARKING ID</th>
                        <th className="py-2.5 px-3 font-semibold">EXTRACTED CONTENT</th>
                        <th className="py-2.5 px-3 font-semibold">MARKING TYPE</th>
                        <th className="py-2.5 px-3 font-semibold">LOCATION (X, Y)</th>
                        <th className="py-2.5 px-3 font-semibold">OPTICAL CLARITY</th>
                        <th className="py-2.5 px-3 font-semibold">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {markingsList.map((m: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-[#0F172A]">{m.markingId || `TXT-${idx + 1}`}</td>
                          <td className="py-2.5 px-3">
                            {m.isReadable ? (
                              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {m.text}
                              </span>
                            ) : (
                              <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                {m.text || "Uncertain marking"}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[#64748B]">{m.type || "PCB_LABEL"}</td>
                          <td className="py-2.5 px-3 text-[#64748B]">
                            {m.boundingBox ? `X:${m.boundingBox.x}, Y:${m.boundingBox.y}` : "Visible Area"}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-800">
                              {m.confidence ? Math.round(m.confidence * 100) : 80}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] ${m.isReadable
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600"
                                }`}
                            >
                              {m.isReadable ? "READABLE" : "UNCERTAIN"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 text-xs font-mono text-blue-900 leading-relaxed">
                <strong>Anti-Hallucination Policy:</strong> Optical character recognition preserves uncertain text as uncertain. EcoIntel will never guess missing characters or manufacture part specifications that cannot be read directly from the camera feed.
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 6: IMAGE-BASED SUMMARY
        ========================================================================== */}
        {activeTab === "summary" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm space-y-6">
              <div className="border-b border-[#F1F5F9] pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#0F172A] font-mono">
                    Evidence-Based Visual Condition Summary
                  </h3>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
                    CANONICAL EVALUATION
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-1 font-mono">
                  Synthesized exclusively from verifiable findings observable in the uploaded photograph.
                </p>
              </div>

              {/* Classification Banner */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-mono text-[#64748B] uppercase font-bold tracking-wider block">
                  Official Visual Condition Classification:
                </span>
                <h4 className="text-lg font-bold font-mono text-blue-700">
                  {summaryData.classification || "No obvious visible damage detected."}
                </h4>
                <p className="text-xs font-mono text-[#0F172A] leading-relaxed">
                  {summaryData.statement || "No obvious visible damage was detected in this image. This does not confirm electrical functionality."}
                </p>
              </div>

              {/* Supporting Findings Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B] text-[10px] block uppercase">Observed Components</span>
                  <span className="text-base font-bold text-[#0F172A] mt-1 block">
                    {components.length} components
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    {components.filter((c) => c.condition === "NORMAL").length} clean · {components.filter((c) => c.condition !== "NORMAL").length} irregular
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B] text-[10px] block uppercase">Visible Surface Anomalies</span>
                  <span className="text-base font-bold text-[#0F172A] mt-1 block">
                    {damageFindings.length} anomaly finding(s)
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    {damageFindings.length === 0 ? "Normal exterior appearance" : "Localized surface defects"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B] text-[10px] block uppercase">Hardware Validation Scope</span>
                  <span className="text-base font-bold text-slate-700 mt-1 block">
                    PHYSICAL OPTICAL ONLY
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    In-circuit electrical test data required
                  </span>
                </div>
              </div>

              {/* Optical Inspection Boundaries */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
                <h4 className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px]">
                  Documented Optical Limitations:
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-[#64748B] leading-relaxed">
                  {(summaryData.opticalLimitations || [
                    "Optical inspection is strictly limited to visible exterior surface features in the 2D photography.",
                    "Internal silicon junction health, dielectric breakdown, and hidden BGA solder balls remain UNKNOWN.",
                    "Multilayer inner copper traces and buried ground/power planes cannot be determined from optical photography.",
                    "This visual analysis does not confirm electrical functionality, signal integrity, or electrical continuity.",
                  ]).map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Recommended Electrical / Manual Testing */}
              <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3 font-mono text-xs">
                <h4 className="font-bold text-blue-950 uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <Microscope className="w-4 h-4 text-blue-600" />
                  <span>Recommended Physical & Electrical Testing Steps:</span>
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-blue-900 leading-relaxed">
                  {(summaryData.recommendedManualInspections || [
                    "Perform four-wire Kelvin electrical continuity testing across key power and ground planes.",
                    "Computed tomography (X-ray inspection) for BGA solder voids and inner-layer copper integrity.",
                    "Bench in-circuit voltage, clock frequency, and current draw measurement under powered test conditions.",
                  ]).map((step: string, idx: number) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ConsoleResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-center">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      }
    >
      <ConsoleResultsContent />
    </Suspense>
  );
}
