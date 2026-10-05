"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Cpu,
  Layers,
  Activity,
  Coins,
  Wrench,
  ShieldCheck,
  Leaf,
  FileText,
  ShoppingCart,
  Download,
  RotateCcw,
  Sparkles,
  Sliders,
  DollarSign,
  Info,
  Clock,
  ArrowRight,
  ExternalLink,
  Search,
  Filter,
  Check,
  AlertTriangle,
  Play,
  Share2,
  Box,
  Eye,
  Radio,
  Camera,
  Image as ImageIcon,
  LayoutGrid,
} from "lucide-react";
import { useAnalysisSession } from "@/lib/context/AnalysisSessionContext";
import { DetectedComponent } from "@/lib/types/analysis";
import RealPcbViewer from "@/components/console/RealPcbViewer";

const ProcessingPcb3D = dynamic(
  () => import("@/components/3d/ProcessingPcb3D"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 flex flex-col items-center justify-center bg-[#F1F5F9] rounded-2xl">
        <Cpu className="w-8 h-8 text-[#2563EB] animate-pulse mb-2" />
        <span className="font-mono text-xs text-[#64748B]">Synthesizing 3D PCB Mesh...</span>
      </div>
    ),
  }
);

const PreciousMetals3D = dynamic(
  () => import("@/components/3d/PreciousMetals3D"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 flex items-center justify-center bg-[#F1F5F9] rounded-2xl">
        <Coins className="w-8 h-8 text-[#B88900] animate-pulse" />
      </div>
    ),
  }
);

function ConsoleResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab") || "overview";
  // Normalize legacy tab query parameter mappings
  const normalizedTab =
    rawTab === "inventory" ? "components" : rawTab === "carbon" ? "impact" : rawTab;

  const {
    session,
    selectedComponent,
    setSelectedComponent,
    updateRulSimulation,
    openMarketplaceListing,
    setActiveStep,
    loadSessionById,
  } = useAnalysisSession();

  const queryAnalysisId = searchParams.get("analysisId") || searchParams.get("sessionId");
  const effectiveAnalysisId = queryAnalysisId || session?.id || "ECI-2026-7740";

  // Sync session with URL analysisId if provided
  useEffect(() => {
    if (queryAnalysisId && queryAnalysisId !== session.id) {
      loadSessionById(queryAnalysisId);
    }
  }, [queryAnalysisId, session.id, loadSessionById]);

  const detailsRef = useRef<HTMLDivElement>(null);

  // Tab & Filter states
  const [activeTab, setActiveTab] = useState<string>(normalizedTab);
  const [componentSearch, setComponentSearch] = useState("");
  const [componentFilter, setComponentFilter] = useState("all");

  // Inspector Viewport Display Modes: "optical" (Real Hardware Scan) | "3d" (3D Digital Twin) | "split"
  const [viewportMode, setViewportMode] = useState<"optical" | "3d" | "split">("optical");
  const [showLabels, setShowLabels] = useState(true);

  // 3D Inspector Display Toggles
  const [show3DComponents, setShow3DComponents] = useState(true);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showTraces, setShowTraces] = useState(true);
  const [showLayers, setShowLayers] = useState(false);
  const [showHealthOverlay, setShowHealthOverlay] = useState(false);
  const [showRulOverlay, setShowRulOverlay] = useState(false);

  // PCB Topology & Reconstruction View Modes
  const [pcbViewMode, setPcbViewMode] = useState<"original" | "detected" | "reconstructed" | "topology">("reconstructed");

  // RUL Simulation Interactive Parameters
  const [simTemp, setSimTemp] = useState(session.rulPrediction?.parameters?.operatingTempCelsius || 46);
  const [simVoltage, setSimVoltage] = useState(session.rulPrediction?.parameters?.inputVoltageVolts || 12.0);
  const [simCycles, setSimCycles] = useState(session.rulPrediction?.parameters?.operatingCycles || 1900);
  const [simAge, setSimAge] = useState(session.rulPrediction?.parameters?.ageYears || 2.0);
  const [simWear, setSimWear] = useState(session.rulPrediction?.parameters?.wearFactor || 12);
  const [isSimulated, setIsSimulated] = useState(false);

  // Keep state synced with URL searchParams
  useEffect(() => {
    if (normalizedTab !== activeTab) {
      setActiveTab(normalizedTab);
    }
  }, [normalizedTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const sessionParam = effectiveAnalysisId ? `analysisId=${encodeURIComponent(effectiveAnalysisId)}&` : "";
    router.push(`/console/results?${sessionParam}tab=${tabId}`);
  };

  const handleApplyRulSimulation = () => {
    setIsSimulated(true);
    updateRulSimulation({
      temp: simTemp,
      voltage: simVoltage,
      cycles: simCycles,
      age: simAge,
      wear: simWear,
    });
  };

  const handleResetRulSimulation = () => {
    setIsSimulated(false);
    setSimTemp(46);
    setSimVoltage(12.0);
    setSimCycles(1900);
    setSimAge(2.0);
    setSimWear(12);
    updateRulSimulation({
      temp: 46,
      voltage: 12.0,
      cycles: 1900,
      age: 2.0,
      wear: 12,
    });
  };

  const scrollToTabs = () => {
    detailsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Components data
  const componentsList: DetectedComponent[] = session.detection?.components || [];

  const filteredComponents = componentsList.filter((comp) => {
    const matchesSearch =
      comp.name.toLowerCase().includes(componentSearch.toLowerCase()) ||
      comp.type.toLowerCase().includes(componentSearch.toLowerCase()) ||
      comp.manufacturer.toLowerCase().includes(componentSearch.toLowerCase());
    if (componentFilter === "all") return matchesSearch;
    if (componentFilter === "reusable") return matchesSearch && comp.health >= 90;
    if (componentFilter === "swap") return matchesSearch && comp.health < 85;
    return matchesSearch;
  });

  const sessionIdParam = `?analysisId=${encodeURIComponent(effectiveAnalysisId)}`;

  // The 7 Real Result Tabs
  const tabs = [
    { id: "overview", name: "Overview", icon: Sparkles },
    { id: "components", name: "Components", icon: Cpu },
    { id: "pcb", name: "PCB Intelligence", icon: Layers },
    { id: "rul", name: "Health & RUL", icon: Activity },
    { id: "metals", name: "Material Recovery", icon: Coins },
    { id: "repair", name: "Repair Assessment", icon: Wrench },
    { id: "impact", name: "Circular Impact", icon: Leaf },
  ];

  return (
    <div className="flex-1 py-6 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-8 text-[#0F172A]">
      
      {/* ─── TOP HEADER & ACTIONS ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-xs font-mono font-bold text-[#16A34A]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {session.status === "COMPLETED" ? "EcoIntel Analysis Complete" : "Analysis In Progress"}
              </span>
            </div>

            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                session.detection?.provider === "YOLO" || session.detection?.model?.includes("YOLO")
                  ? "bg-blue-500/10 text-[#2563EB] border-blue-200"
                  : "bg-amber-500/10 text-amber-700 border-amber-200"
              }`}
            >
              {session.detection?.provider === "YOLO" || session.detection?.model?.includes("YOLO")
                ? "AI INFERENCE"
                : "DEMO DATASET"}
            </span>
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Hardware Intelligence Overview
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Comprehensive lifecycle analysis for:{" "}
            <strong className="text-[#0F172A]">{session.deviceName}</strong> ({session.deviceType}).
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/marketplace/create${sessionIdParam}`}
            className="px-4 py-2 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>List Recovered Components</span>
          </Link>

          <Link
            href={`/console/passport${sessionIdParam}`}
            onClick={() => setActiveStep(7)}
            className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Digital Passport</span>
          </Link>

          <Link
            href={`/console/report${sessionIdParam}`}
            onClick={() => setActiveStep(8)}
            className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-blue-500/25 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Full Report</span>
          </Link>
        </div>
      </div>

      {/* ─── MAIN VISUAL: 3D PCB VIEWER (LEFT) + SUMMARY (RIGHT) ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left: Large 3D Hardware PCB Viewer (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-4 flex flex-col justify-between relative overflow-hidden min-h-[460px]">
          
          {/* Top 3D Bar */}
          <div className="flex items-center justify-between z-10 px-2 pt-1 border-b border-[#F1F5F9] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" />
              <span className="font-mono text-xs font-bold text-[#0F172A]">
                Interactive 3D PCB CAD Model
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                Demonstration CAD Mesh
              </span>
            </div>

            {/* Display Toggles */}
            <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-1 text-[11px] font-mono">
              <button
                onClick={() => setShowBoxes(!showBoxes)}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  showBoxes ? "bg-[#EFF6FF] text-[#2563EB] font-bold" : "text-[#94A3B8]"
                }`}
                title="Toggle AI Detection Bounding Boxes"
              >
                Boxes
              </button>
              <button
                onClick={() => setShowTraces(!showTraces)}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  showTraces ? "bg-[#EFF6FF] text-[#2563EB] font-bold" : "text-[#94A3B8]"
                }`}
                title="Toggle Circuit Traces"
              >
                Traces
              </button>
              <button
                onClick={() => setShowLayers(!showLayers)}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  showLayers ? "bg-[#2563EB] text-white font-bold" : "text-[#64748B]"
                }`}
                title="Explode Multi-Layer Substrate"
              >
                Layers
              </button>
              <button
                onClick={() => {
                  setShowHealthOverlay(!showHealthOverlay);
                  setShowRulOverlay(false);
                }}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  showHealthOverlay ? "bg-[#16A34A] text-white font-bold" : "text-[#64748B]"
                }`}
                title="Component Health Heatmap"
              >
                Health
              </button>
            </div>
          </div>

          {/* Interactive 3D Canvas */}
          <div className="flex-1 w-full flex items-center justify-center my-2 min-h-[340px]">
            <ProcessingPcb3D
              imageUrl={session.imageUrl}
              isScanning={false}
              highlightComponentId={selectedComponent?.id}
              exploded={showLayers}
              showComponents={show3DComponents}
              showTraces={showTraces}
              showBoxes={showBoxes}
              showLayers={showLayers}
              showHealthOverlay={showHealthOverlay}
              showRulOverlay={showRulOverlay}
              detectedComponents={componentsList}
              onSelectComponent={(compName, compData) => {
                const match = componentsList.find(
                  (c) =>
                    c.name.toLowerCase().includes(compName.toLowerCase()) ||
                    c.id === compData?.id ||
                    (compData && c.type.toLowerCase().includes(compData.type.toLowerCase()))
                );
                if (match) {
                  setSelectedComponent(match);
                }
              }}
            />
          </div>

          {/* Bottom Telemetry Bar */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-2.5 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-[#64748B]">
              <RotateCcw className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Rotate: Drag · Zoom: Scroll · Pan: Controls</span>
            </div>
            <div className="text-[#2563EB] font-bold">
              {componentsList.length} Components Isolated
            </div>
          </div>
        </div>

        {/* Right: Hardware Intelligence Summary (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 sm:p-7 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono text-[#2563EB] uppercase font-bold tracking-wider">
                  HARDWARE PROFILE
                </span>
                <h2 className="font-heading text-xl font-extrabold text-[#0F172A]">
                  {session.deviceName}
                </h2>
                <p className="text-xs text-[#64748B]">{session.deviceType}</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-[#64748B] block">ID</span>
                <span className="font-mono text-xs font-bold text-[#0F172A]">#{session.id}</span>
              </div>
            </div>

            {/* 4 Core Pillars */}
            <div className="grid grid-cols-2 gap-4">
              {/* Overall Health */}
              <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] space-y-1">
                <span className="text-xs font-mono text-[#16A34A] block">Hardware Health</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-3xl font-extrabold text-[#16A34A]">
                    {session.rulPrediction?.overallHealthScore || 93}%
                  </span>
                  <span className="text-[10px] font-mono text-[#16A34A] font-bold">Grade A+</span>
                </div>
                <span className="text-[10px] text-[#64748B] block">IPC-A-610 Class 3</span>
              </div>

              {/* Components */}
              <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] space-y-1">
                <span className="text-xs font-mono text-[#2563EB] block">Components Detected</span>
                <div className="font-heading text-3xl font-extrabold text-[#2563EB]">
                  {session.detection?.componentsCount || componentsList.length || 38}
                </div>
                <span className="text-[10px] text-[#64748B] block">100% Neural Coverage</span>
              </div>

              {/* Estimated RUL */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-xs font-mono text-[#475569] block">Estimated RUL</span>
                <div className="font-heading text-3xl font-extrabold text-[#0F172A]">
                  {session.rulPrediction?.predictedYears || 7.2} Yrs
                </div>
                <span className="text-[10px] text-[#64748B] block">
                  ~{session.rulPrediction?.predictedHours?.toLocaleString() || "63,000"} Hours
                </span>
              </div>

              {/* Recovery Value */}
              <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] space-y-1">
                <span className="text-xs font-mono text-[#B88900] block">Estimated Recovery</span>
                <div className="font-heading text-3xl font-extrabold text-[#B88900]">
                  ${session.materialRecovery?.totalEstimatedMarketValueUSD?.toFixed(2) || "9.80"}
                </div>
                <span className="text-[10px] text-[#64748B] block">Metals + Reusable ICs</span>
              </div>
            </div>

            {/* Classification & Metadata List */}
            <div className="mt-5 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Classification:</span>
                <span className="font-bold text-[#16A34A]">{session.executiveSummary?.classification || "Reusable"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Analysis Confidence:</span>
                <span className="font-bold text-[#2563EB]">{session.executiveSummary?.confidencePercent || 95}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Analysis Date:</span>
                <span className="text-[#0F172A]">{session.createdAt?.split("T")[0] || "2026-10-03"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Ingest Source:</span>
                <span className="capitalize text-[#0F172A]">{session.sourceType} ({session.dataClassification})</span>
              </div>
            </div>
          </div>

          {/* Quick jump to detailed analysis */}
          <button
            onClick={scrollToTabs}
            className="w-full py-3 px-4 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <span>View Detailed Analysis Modules</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* ─── MODULE TABS BAR ─────────────────────────────────────── */}
      <div ref={detailsRef} className="pt-4">
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[#E2E8F0] pb-2 scrollbar-none">
          {tabs.map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/20 font-bold"
                    : "bg-white text-[#475569] hover:bg-[#F1F5F9] border border-[#E2E8F0]"
                }`}
              >
                <IconComp className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── TAB 0: OVERVIEW CONTENT ──────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-lg font-bold text-[#0F172A]">
                Comprehensive Module Telemetry
              </h3>
              <p className="text-xs text-[#64748B]">
                Interactive status summary for all six hardware circularity engines.
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]">
              Session #{session.id}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1: Component Intelligence */}
            <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] font-bold">
                    Completed
                  </span>
                </div>
                <div>
                  <h4 className="font-heading text-base font-bold text-[#0F172A]">
                    Component Intelligence
                  </h4>
                  <p className="text-xs text-[#64748B] mt-1">
                    50-micron spectro-spatial SMD segmentation and classification.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Detected:</span>
                    <strong className="text-[#0F172A]">{session.detection?.componentsCount || 38} ICs</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Avg Confidence:</span>
                    <strong className="text-[#16A34A]">{session.detection?.confidenceAvg || 97.8}%</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleTabChange("components")}
                className="w-full py-2 px-3 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF6FF] text-[#2563EB] text-xs font-mono font-bold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 2: PCB Intelligence */}
            <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] font-bold">
                    Completed
                  </span>
                </div>
                <div>
                  <h4 className="font-heading text-base font-bold text-[#0F172A]">
                    PCB Intelligence
                  </h4>
                  <p className="text-xs text-[#64748B] mt-1">
                    Trace topology, substrate layer stacks, and KiCad netlist synthesis.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Trace Integrity:</span>
                    <strong className="text-[#16A34A]">{session.pcbAnalysis?.traceIntegrityPercent || 98.9}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Layers:</span>
                    <strong className="text-[#0F172A]">{session.pcbAnalysis?.layerCount || 4} Copper Planes</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleTabChange("pcb")}
                className="w-full py-2 px-3 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF6FF] text-[#2563EB] text-xs font-mono font-bold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 3: Lifecycle & RUL */}
            <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] font-bold">
                    Completed
                  </span>
                </div>
                <div>
                  <h4 className="font-heading text-base font-bold text-[#0F172A]">
                    Lifecycle Intelligence
                  </h4>
                  <p className="text-xs text-[#64748B] mt-1">
                    Physics-informed degradation curves and Arrhenius stress modeling.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Remaining Lifespan:</span>
                    <strong className="text-[#2563EB]">{session.rulPrediction?.predictedYears || 7.2} Years</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Failure Probability:</span>
                    <strong className="text-[#0F172A]">{((session.rulPrediction?.failureProbability || 0.07) * 100).toFixed(0)}%</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleTabChange("rul")}
                className="w-full py-2 px-3 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF6FF] text-[#2563EB] text-xs font-mono font-bold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 4: Material Recovery */}
            <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#B88900] flex items-center justify-center">
                    <Coins className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] font-bold">
                    Completed
                  </span>
                </div>
                <div>
                  <h4 className="font-heading text-base font-bold text-[#0F172A]">
                    Material Recovery
                  </h4>
                  <p className="text-xs text-[#64748B] mt-1">
                    Precious metal yields for Gold, Silver, Copper, and Palladium.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Estimated Value:</span>
                    <strong className="text-[#B88900]">₹{Math.round((session.materialRecovery?.totalEstimatedMarketValueUSD || 18.70) * 86.5).toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Recovery Yield:</span>
                    <strong className="text-[#16A34A]">{session.materialRecovery?.recoveryEfficiencyPercent || 98.0}% Efficiency</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleTabChange("metals")}
                className="w-full py-2 px-3 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF6FF] text-[#2563EB] text-xs font-mono font-bold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 5: Repair Intelligence */}
            <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] font-bold">
                    Completed
                  </span>
                </div>
                <div>
                  <h4 className="font-heading text-base font-bold text-[#0F172A]">
                    Repair Intelligence
                  </h4>
                  <p className="text-xs text-[#64748B] mt-1">
                    Diagnostic fault isolation and circular action recommendations.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Action:</span>
                    <strong className="text-[#2563EB] uppercase">{session.repairAssessment?.recommendedAction || "Reuse"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Feasibility Index:</span>
                    <strong className="text-[#16A34A]">{session.repairAssessment?.feasibilityIndexPercent || 97}%</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleTabChange("repair")}
                className="w-full py-2 px-3 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF6FF] text-[#2563EB] text-xs font-mono font-bold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 6: Circular Impact */}
            <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] font-bold">
                    Completed
                  </span>
                </div>
                <div>
                  <h4 className="font-heading text-base font-bold text-[#0F172A]">
                    Circular Impact
                  </h4>
                  <p className="text-xs text-[#64748B] mt-1">
                    Scope 3 GHG carbon avoidance, energy conservation, and water savings.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">CO₂ Avoided:</span>
                    <strong className="text-[#16A34A]">{session.carbonImpact?.co2AvoidedKg || 22.1} kg</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Energy Conserved:</span>
                    <strong className="text-[#2563EB]">{session.carbonImpact?.energySavedKWh || 54} kWh</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleTabChange("impact")}
                className="w-full py-2 px-3 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF6FF] text-[#2563EB] text-xs font-mono font-bold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── TAB 1: COMPONENT INVENTORY & 3D INSPECTOR ──────────── */}
      {activeTab === "components" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-extrabold text-[#0F172A]">
                Component Inventory & 3D Inspector
              </h2>
              <p className="text-xs text-[#64748B]">
                Click any component row in the table below to spotlight and inspect its physical node in 3D.
              </p>
            </div>

            {/* Filters & Search */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter ICs, magnetics..."
                  value={componentSearch}
                  onChange={(e) => setComponentSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-mono focus:outline-none focus:border-[#2563EB] bg-white"
                />
              </div>
              <select
                value={componentFilter}
                onChange={(e) => setComponentFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-mono bg-white focus:outline-none focus:border-[#2563EB]"
              >
                <option value="all">All Packages ({componentsList.length})</option>
                <option value="reusable">Reusable Only</option>
                <option value="swap">Needs Swap</option>
              </select>
            </div>
          </div>

          {/* Top Split: 3D Inspector (Left) + Selected Component Info Panel (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Active Inspection Viewport - Real Optical Scan & 3D Digital Twin (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-4 sm:p-5 space-y-4">
              
              {/* Header Mode Switcher & Overlays */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#CBD5E1] p-1 rounded-xl text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setViewportMode("optical")}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                      viewportMode === "optical"
                        ? "bg-[#2563EB] text-white shadow-xs"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Real Optical Scan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewportMode("3d")}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                      viewportMode === "3d"
                        ? "bg-[#0F172A] text-white shadow-xs"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>3D Digital Twin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewportMode("split")}
                    className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                      viewportMode === "split"
                        ? "bg-[#0F172A] text-white shadow-xs"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                    title="Side-by-Side Split View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Split View</span>
                  </button>
                </div>

                {/* Overlays / Toggles for Optical or 3D */}
                <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-1 text-[10px] font-mono">
                  <button
                    onClick={() => setShowBoxes(!showBoxes)}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      showBoxes ? "bg-[#EFF6FF] text-[#2563EB] font-bold" : "text-[#94A3B8]"
                    }`}
                  >
                    Boxes
                  </button>
                  {viewportMode === "optical" ? (
                    <button
                      onClick={() => setShowLabels(!showLabels)}
                      className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                        showLabels ? "bg-[#EFF6FF] text-[#2563EB] font-bold" : "text-[#94A3B8]"
                      }`}
                    >
                      Labels
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setShow3DComponents(!show3DComponents)}
                        className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          show3DComponents ? "bg-[#EFF6FF] text-[#2563EB] font-bold" : "text-[#94A3B8]"
                        }`}
                      >
                        IC Nodes
                      </button>
                      <button
                        onClick={() => setShowTraces(!showTraces)}
                        className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          showTraces ? "bg-[#EFF6FF] text-[#2563EB] font-bold" : "text-[#94A3B8]"
                        }`}
                      >
                        Traces
                      </button>
                      <button
                        onClick={() => setShowLayers(!showLayers)}
                        className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          showLayers ? "bg-[#2563EB] text-white font-bold" : "text-[#64748B]"
                        }`}
                      >
                        Layers
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Viewport Content */}
              {viewportMode === "optical" ? (
                <RealPcbViewer
                  imageUrl={session.imageUrl || session.image || "/images/samples/router_board.jpg"}
                  components={componentsList}
                  selectedComponent={selectedComponent}
                  onSelectComponent={(comp) => setSelectedComponent(comp)}
                  showBoxes={showBoxes}
                  showLabels={showLabels}
                />
              ) : viewportMode === "3d" ? (
                <div className="h-80 sm:h-96 w-full bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] overflow-hidden relative">
                  <ProcessingPcb3D
                    imageUrl={session.imageUrl || session.image || "/images/samples/router_board.jpg"}
                    isScanning={false}
                    highlightComponentId={selectedComponent?.id}
                    exploded={showLayers}
                    showComponents={show3DComponents}
                    showTraces={showTraces}
                    showBoxes={showBoxes}
                    showLayers={showLayers}
                    showHealthOverlay={showHealthOverlay}
                    showRulOverlay={showRulOverlay}
                    detectedComponents={componentsList}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RealPcbViewer
                    imageUrl={session.imageUrl || session.image || "/images/samples/router_board.jpg"}
                    components={componentsList}
                    selectedComponent={selectedComponent}
                    onSelectComponent={(comp) => setSelectedComponent(comp)}
                    showBoxes={showBoxes}
                    showLabels={showLabels}
                  />
                  <div className="h-80 sm:h-96 w-full bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] overflow-hidden relative">
                    <ProcessingPcb3D
                      imageUrl={session.imageUrl || session.image || "/images/samples/router_board.jpg"}
                      isScanning={false}
                      highlightComponentId={selectedComponent?.id}
                      exploded={showLayers}
                      showComponents={show3DComponents}
                      showTraces={showTraces}
                      showBoxes={showBoxes}
                      showLayers={showLayers}
                      showHealthOverlay={showHealthOverlay}
                      showRulOverlay={showRulOverlay}
                      detectedComponents={componentsList}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right: Selected Component Details (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
              <div className="border-b border-[#E2E8F0] pb-3">
                <span className="text-[10px] font-mono text-[#2563EB] uppercase font-bold tracking-wider">
                  SELECTED COMPONENT TELEMETRY
                </span>
                <h3 className="font-heading text-lg font-bold text-[#0F172A]">
                  {selectedComponent?.name || "Select a Component"}
                </h3>
                <p className="text-xs text-[#64748B]">{selectedComponent?.type} · {selectedComponent?.manufacturer}</p>
              </div>

              {selectedComponent ? (
                <div className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                      <span className="text-[10px] text-[#64748B] block">PACKAGE</span>
                      <strong className="text-[#0F172A]">{selectedComponent.package}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                      <span className="text-[10px] text-[#64748B] block">AI CONFIDENCE</span>
                      <strong className="text-[#16A34A]">{selectedComponent.confidence}%</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7]">
                      <span className="text-[10px] text-[#16A34A] block">HEALTH SCORE</span>
                      <strong className="font-heading text-lg text-[#16A34A]">{selectedComponent.health}%</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]">
                      <span className="text-[10px] text-[#2563EB] block">REMAINING LIFE</span>
                      <strong className="font-heading text-lg text-[#2563EB]">{selectedComponent.remainingLifeYears} Yrs</strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Material Composition:</span>
                      <span className="text-[#0F172A] font-semibold">{selectedComponent.material}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Detection Status:</span>
                      <span className="text-[#16A34A] font-semibold">{selectedComponent.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Digital Passport:</span>
                      <span className="text-[#2563EB] font-bold">{selectedComponent.passportId}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/marketplace/create?analysisId=${encodeURIComponent(effectiveAnalysisId)}&componentId=${encodeURIComponent(selectedComponent.id)}`}
                      className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>List this Component on Marketplace</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[#94A3B8]">
                  Select a component from the table to view real-time diagnostics.
                </div>
              )}
            </div>

          </div>

          {/* Component Inventory Table */}
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <span className="font-heading text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                Isolated Component Roster ({filteredComponents.length})
              </span>
              <span className="text-xs font-mono text-[#64748B]">
                Click row to inspect
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] text-[#64748B]">
                  <tr>
                    <th className="py-3 px-4">Component</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Confidence</th>
                    <th className="py-3 px-4">Health</th>
                    <th className="py-3 px-4">RUL</th>
                    <th className="py-3 px-4">Material</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredComponents.map((comp) => {
                    const isSelected = selectedComponent?.id === comp.id;
                    return (
                      <tr
                        key={comp.id}
                        onClick={() => setSelectedComponent(comp)}
                        className={`transition-colors cursor-pointer ${
                          isSelected ? "bg-[#EFF6FF] border-l-4 border-l-[#2563EB]" : "hover:bg-[#F8FAFC]"
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-[#0F172A] font-sans">{comp.name}</p>
                          <p className="text-[10px] text-[#64748B]">{comp.manufacturer} · {comp.package}</p>
                        </td>
                        <td className="py-3.5 px-4 text-[#475569]">{comp.type}</td>
                        <td className="py-3.5 px-4 font-bold text-[#16A34A]">{comp.confidence}%</td>
                        <td className="py-3.5 px-4">
                          {comp.health && comp.health > 0 ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                comp.health >= 90 ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-[#FEF3C7] text-[#D97706]"
                              }`}
                            >
                              {comp.health}%
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200">
                              Pending RUL
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-[#2563EB] font-bold">
                          {comp.remainingLifeYears && comp.remainingLifeYears > 0
                            ? `${comp.remainingLifeYears} Yrs`
                            : "Pending Analysis"}
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B] max-w-[140px] truncate" title={comp.material}>
                          {comp.material}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-[#F1F5F9] text-[#0F172A] text-[10px] font-semibold">
                            {comp.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/marketplace/create?analysisId=${encodeURIComponent(effectiveAnalysisId)}&componentId=${encodeURIComponent(comp.id)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#EFF6FF] text-[#2563EB] border border-[#CBD5E1] text-[11px] font-bold transition-colors cursor-pointer inline-block"
                          >
                            List
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ─── TAB 2: PCB INTELLIGENCE & TOPOLOGY ─────────────────── */}
      {activeTab === "pcb" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-extrabold text-[#0F172A]">
                PCB Intelligence & Topology
              </h2>
              <p className="text-xs text-[#64748B]">
                Circuit substrate reconstruction, copper layer continuity, and netlist extraction.
              </p>
            </div>

            {/* View Mode Controls */}
            <div className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] rounded-xl p-1 text-xs font-mono">
              <button
                onClick={() => setPcbViewMode("original")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  pcbViewMode === "original" ? "bg-[#0F172A] text-white font-bold" : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Original
              </button>
              <button
                onClick={() => setPcbViewMode("detected")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  pcbViewMode === "detected" ? "bg-[#2563EB] text-white font-bold" : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Detected
              </button>
              <button
                onClick={() => setPcbViewMode("reconstructed")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  pcbViewMode === "reconstructed" ? "bg-[#16A34A] text-white font-bold" : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Reconstructed
              </button>
              <button
                onClick={() => setPcbViewMode("topology")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  pcbViewMode === "topology" ? "bg-[#8B5CF6] text-white font-bold" : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Topology
              </button>
            </div>
          </div>

          {/* Honest Transparency Alert */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Reconstruction estimate:</strong> Circuit schematic recovery uses generative topological netlist heuristics. Do not treat demonstration netlists as exact factory schematics without full vector impedance verification.
            </div>
          </div>

          {/* Main PCB Stage Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: PCB Visualizer Screen (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <span className="font-mono text-xs font-bold text-[#0F172A] capitalize">
                  {pcbViewMode} Hardware View
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F8FAFC] text-[#2563EB] font-bold border border-[#BFDBFE]">
                  Substrate ID: {session.pcbAnalysis?.pcbId || "PCB-REC-NET-7740"}
                </span>
              </div>

              {pcbViewMode === "original" ? (
                <div className="h-80 w-full rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center relative">
                  <img
                    src={session.imageUrl || session.image || "/images/samples/router_board.jpg"}
                    alt="Original PCB"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/75 text-white font-mono text-[10px]">
                    Raw High-Resolution Ingest
                  </div>
                </div>
              ) : pcbViewMode === "topology" ? (
                <div className="h-80 w-full rounded-2xl bg-[#0F172A] p-4 text-white font-mono text-xs overflow-y-auto space-y-2 border border-slate-800">
                  <div className="text-[#38BDF8] font-bold pb-1 border-b border-slate-800">
                    // Extracted Netlist Topology Graph (IEEE 1481 / KiCad Format)
                  </div>
                  <pre className="text-[11px] text-slate-300 leading-relaxed font-mono">
                    {session.pcbAnalysis?.schematics?.netlistRaw ||
`NET 'VCC_3V3' COMP 'MT7622':VCC COMP 'REG_3V3':OUT COMP 'CAP_C12':1;
NET 'GND' COMP 'MT7622':GND COMP 'SWITCH_PHY':GND COMP 'RJ45_MAG':SHIELD;
NET 'RGMII_RXD0' COMP 'MT7622':B08 COMP 'SWITCH_PHY':C12;
NET 'RGMII_TXD0' COMP 'MT7622':D12 COMP 'SWITCH_PHY':A04;
NET 'ETH_12V_IN' COMP 'DC_JACK':1 COMP 'BUCK_STEPDOWN':VIN;`}
                  </pre>
                </div>
              ) : (
                <div className="h-80 w-full bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] overflow-hidden relative">
                  <ProcessingPcb3D
                    isScanning={false}
                    exploded={pcbViewMode === "reconstructed"}
                    showTraces={true}
                    showBoxes={pcbViewMode === "detected"}
                  />
                  <div className="absolute bottom-2 left-3 text-[10px] font-mono text-[#64748B]">
                    {pcbViewMode === "detected" ? "YOLOv11 Bounding Boxes Active" : "Traces & Reconstructed Substrate"}
                  </div>
                </div>
              )}

              {/* Before ↓ After Reconstruction Comparison Bar */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono">
                  <span className="text-[#64748B] block text-[10px]">BEFORE SCAN</span>
                  <strong className="text-[#0F172A]">Raw Unindexed Hardware</strong>
                  <span className="text-[10px] text-[#64748B] block mt-0.5">Unknown component health & traces</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] text-xs font-mono">
                  <span className="text-[#16A34A] block text-[10px]">AFTER RECONSTRUCTION</span>
                  <strong className="text-[#16A34A]">Mapped Digital Netlist</strong>
                  <span className="text-[10px] text-[#16A34A] block mt-0.5">99.3% Reconstruction Confidence</span>
                </div>
              </div>
            </div>

            {/* Right: Board Integrity & Metrics (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
              <div className="border-b border-[#E2E8F0] pb-3">
                <span className="text-[10px] font-mono text-[#2563EB] uppercase font-bold tracking-wider">
                  SUBSTRATE METRICS
                </span>
                <h3 className="font-heading text-lg font-bold text-[#0F172A]">
                  Board Integrity & Continuity
                </h3>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-between">
                  <div>
                    <span className="text-[#16A34A] text-[10px] block">BOARD INTEGRITY</span>
                    <span className="font-heading text-2xl font-bold text-[#16A34A]">
                      {session.pcbAnalysis?.traceIntegrityPercent || 98.9}%
                    </span>
                  </div>
                  <span className="text-xs text-[#16A34A] font-bold">Grade A+ Intact</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[#64748B] block text-[10px]">LAYER COUNT</span>
                    <strong className="text-[#0F172A]">{session.pcbAnalysis?.layerCount || 4} Copper Planes</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[#64748B] block text-[10px]">SEVERED TRACES</span>
                    <strong className="text-[#16A34A]">{session.pcbAnalysis?.severedTracesRepaired || 0} Damaged</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[#64748B] block text-[10px]">CONFIDENCE</span>
                    <strong className="text-[#2563EB]">{((session.pcbAnalysis?.reconstructionConfidence || 0.993) * 100).toFixed(1)}%</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[#64748B] block text-[10px]">SUBSTRATE</span>
                    <strong className="text-[#0F172A]">FR-4 Low-Loss</strong>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <a
                    href={session.pcbAnalysis?.schematics?.gerberZipUrl || "#"}
                    onClick={(e) => {
                      if (!session.pcbAnalysis?.schematics?.gerberZipUrl) {
                        e.preventDefault();
                        alert("Exporting KiCad Netlist package...");
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export KiCad / Gerber Package</span>
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── TAB 3: HEALTH & RUL ─────────────────────────────────── */}
      {activeTab === "rul" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-extrabold text-[#0F172A]">
                Remaining Useful Life (RUL) Modeling
              </h2>
              <p className="text-xs text-[#64748B]">
                Physics-informed lifespan prediction based on thermal stress, input voltage, and operational cycles.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-white border border-[#E2E8F0] font-bold text-[#0F172A]">
                Source: {isSimulated ? "Simulation Model" : "Measured + Estimated"}
              </span>
            </div>
          </div>

          {/* Large Health Visualization Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            <div className="space-y-1">
              <span className="text-xs font-mono text-[#64748B]">Hardware Health</span>
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-4xl sm:text-5xl font-extrabold text-[#16A34A]">
                  {session.rulPrediction?.overallHealthScore || 93}%
                </span>
                <span className="text-xs font-mono font-bold text-[#16A34A]">Grade A+</span>
              </div>
              <span className="text-[10px] font-mono text-[#64748B] block">
                Calculated with Arrhenius Degradation Model
              </span>
            </div>

            <div className="space-y-1 sm:border-l sm:border-r border-[#E2E8F0] sm:px-6">
              <span className="text-xs font-mono text-[#64748B]">Estimated Remaining Life</span>
              <div className="font-heading text-4xl sm:text-5xl font-extrabold text-[#2563EB]">
                {session.rulPrediction?.predictedYears || 7.2} Yrs
              </div>
              <span className="text-[10px] font-mono text-[#64748B] block">
                ~{session.rulPrediction?.predictedHours?.toLocaleString() || "63,000"} Operating Hours
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono text-[#64748B]">Prediction Confidence</span>
              <div className="font-heading text-4xl sm:text-5xl font-extrabold text-[#0F172A]">
                {((session.rulPrediction?.confidence || 0.95) * 100).toFixed(0)}%
              </div>
              <span className="text-[10px] font-mono text-[#16A34A] block">
                Verified with IPC-9701 Thermal Fatigue
              </span>
            </div>
          </div>

          {/* Degradation Curve & Simulation Controls Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Degradation Curve with Confidence Envelope (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div>
                  <span className="text-[10px] font-mono text-[#2563EB] font-bold uppercase tracking-wider">
                    DEGRADATION TRAJECTORY
                  </span>
                  <h3 className="font-heading text-base font-bold text-[#0F172A]">
                    Health vs. Operating Time
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-[#64748B]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-1 bg-[#2563EB] rounded-full" />
                    <span>Mean Prediction</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2 bg-blue-100 rounded border border-blue-300" />
                    <span>Confidence Interval</span>
                  </div>
                </div>
              </div>

              {/* SVG Degradation Curve */}
              <div className="w-full h-64 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] p-4 flex flex-col justify-between relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 180">
                  {/* Grid Lines */}
                  <line x1="40" y1="20" x2="380" y2="20" stroke="#E2E8F0" strokeDasharray="3 3" />
                  <line x1="40" y1="60" x2="380" y2="60" stroke="#E2E8F0" strokeDasharray="3 3" />
                  <line x1="40" y1="100" x2="380" y2="100" stroke="#E2E8F0" strokeDasharray="3 3" />
                  <line x1="40" y1="140" x2="380" y2="140" stroke="#E2E8F0" strokeDasharray="3 3" />

                  {/* Axes */}
                  <line x1="40" y1="160" x2="380" y2="160" stroke="#94A3B8" strokeWidth="1.5" />
                  <line x1="40" y1="10" x2="40" y2="160" stroke="#94A3B8" strokeWidth="1.5" />

                  {/* Confidence Envelope (Polygon) */}
                  <polygon
                    points="40,25 100,32 180,50 260,82 340,125 380,152 380,165 340,145 260,105 180,68 100,45 40,35"
                    fill="#3B82F6"
                    opacity="0.12"
                  />

                  {/* Upper Bound */}
                  <path
                    d="M 40 25 Q 180 48 380 152"
                    fill="none"
                    stroke="#93C5FD"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />

                  {/* Mean Degradation Curve */}
                  <path
                    d="M 40 30 Q 180 58 380 158"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="3"
                  />

                  {/* Lower Bound */}
                  <path
                    d="M 40 35 Q 180 68 380 165"
                    fill="none"
                    stroke="#93C5FD"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />

                  {/* Current Operating Point Pin */}
                  <circle cx="120" cy="46" r="5" fill="#16A34A" stroke="#FFFFFF" strokeWidth="2" />
                  <text x="130" y="44" fill="#16A34A" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    Now ({session.rulPrediction?.overallHealthScore || 93}%)
                  </text>
                </svg>

                <div className="flex justify-between text-[10px] font-mono text-[#64748B] px-8">
                  <span>Year 0 (Mfg)</span>
                  <span>Year 2.5 (Current)</span>
                  <span>Year 5.0</span>
                  <span>Year 7.5</span>
                  <span>Year 10.0 (End of Life)</span>
                </div>
              </div>
            </div>

            {/* Right: Simulation Controls (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div>
                  <span className="text-[10px] font-mono text-[#2563EB] font-bold uppercase tracking-wider">
                    SIMULATION LABORATORY
                  </span>
                  <h3 className="font-heading text-base font-bold text-[#0F172A]">
                    Stress Parameters
                  </h3>
                </div>
                {isSimulated && (
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-mono font-bold">
                    Simulated
                  </span>
                )}
              </div>

              <div className="space-y-3.5 text-xs font-mono">
                {/* Temp */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[#64748B]">Operating Temperature:</span>
                    <strong className="text-[#0F172A]">{simTemp}°C</strong>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="95"
                    value={simTemp}
                    onChange={(e) => setSimTemp(+e.target.value)}
                    className="w-full accent-[#2563EB] cursor-pointer"
                  />
                </div>

                {/* Voltage */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[#64748B]">Input Voltage:</span>
                    <strong className="text-[#0F172A]">{simVoltage.toFixed(1)}V</strong>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="18"
                    step="0.1"
                    value={simVoltage}
                    onChange={(e) => setSimVoltage(+e.target.value)}
                    className="w-full accent-[#2563EB] cursor-pointer"
                  />
                </div>

                {/* Operating Cycles */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[#64748B]">Power Cycles:</span>
                    <strong className="text-[#0F172A]">{simCycles.toLocaleString()}</strong>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="15000"
                    step="100"
                    value={simCycles}
                    onChange={(e) => setSimCycles(+e.target.value)}
                    className="w-full accent-[#2563EB] cursor-pointer"
                  />
                </div>

                {/* Board Age */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[#64748B]">Board Age:</span>
                    <strong className="text-[#0F172A]">{simAge.toFixed(1)} Years</strong>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="8"
                    step="0.5"
                    value={simAge}
                    onChange={(e) => setSimAge(+e.target.value)}
                    className="w-full accent-[#2563EB] cursor-pointer"
                  />
                </div>

                {/* Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={handleApplyRulSimulation}
                    className="flex-1 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold transition-colors cursor-pointer text-center"
                  >
                    Run Simulation
                  </button>
                  <button
                    onClick={handleResetRulSimulation}
                    className="px-3 py-2.5 rounded-xl border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                    title="Reset to Measured Values"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── TAB 4: MATERIAL RECOVERY INTELLIGENCE ──────────────── */}
      {activeTab === "metals" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-extrabold text-[#0F172A]">
                Material Recovery Intelligence
              </h2>
              <p className="text-xs text-[#64748B]">
                Spectrometric precious metal yield estimation for urban mining and hydrometallurgical recycling.
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono text-[#64748B] block">Total Recovery Yield</span>
              <span className="font-heading text-2xl font-bold text-[#B88900]">
                ₹{Math.round((session.materialRecovery?.totalEstimatedMarketValueUSD || 18.70) * 86.5).toLocaleString("en-IN")} INR
              </span>
            </div>
          </div>

          {/* Realistic 3D Precious Metals Canvas */}
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <span className="font-mono text-xs font-bold text-[#0F172A]">
                3D Precious Ingot Spectrometry Display
              </span>
              <span className="text-[10px] font-mono text-[#64748B]">
                Live Commodity Rates · London Metal Exchange (LME)
              </span>
            </div>

            <div className="h-64 w-full bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] overflow-hidden">
              <PreciousMetals3D />
            </div>
          </div>

          {/* Metal Cards Grid: Gold, Silver, Copper, Palladium, Tin, Aluminum */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(session.materialRecovery?.yields || []).map((metal) => (
              <div
                key={metal.symbol}
                className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm"
                      style={{ backgroundColor: metal.color || "#2563EB" }}
                    >
                      {metal.symbol}
                    </div>
                    <div>
                      <h4 className="font-heading text-sm font-bold text-[#0F172A]">{metal.metal}</h4>
                      <span className="text-[10px] font-mono text-[#64748B]">
                        Rate: ₹{Math.round(metal.marketRateUSD * 86.5).toLocaleString("en-IN")}/g
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                    {metal.sourceType || "Estimated"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[10px] text-[#64748B] block">EST. QUANTITY</span>
                    <strong className="text-base text-[#0F172A]">{metal.yieldGrams} g</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[10px] text-[#64748B] block">EST. VALUE</span>
                    <strong className="text-base text-[#B88900]">₹{Math.round(metal.estimatedValueUSD * 86.5).toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[10px] text-[#64748B] block">CONFIDENCE</span>
                    <strong className="text-[#16A34A]">{metal.confidencePercent || 94}%</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[10px] text-[#64748B] block">RECOVERY POTENTIAL</span>
                    <strong className="text-[#2563EB]">{metal.recoveryPotentialPercent || 96}%</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Methodology Transparency Statement */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono text-[#64748B] leading-relaxed">
            <strong>Calculation Basis:</strong> {session.materialRecovery?.calculationBasis} Laboratory spectrometry quantities are estimates extrapolated from standard layer counts, package pins, and PCB surface finish standards (ENIG/HASL).
          </div>
        </div>
      )}

      {/* ─── TAB 5: REPAIR ASSESSMENT ────────────────────────────── */}
      {activeTab === "repair" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-extrabold text-[#0F172A]">
                AI Repair Assessment & Diagnostics
              </h2>
              <p className="text-xs text-[#64748B]">
                Component-level anomaly isolation, feasibility analysis, and refurbishment routing.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]">
                Recommended Action: {(session.repairAssessment?.recommendedAction || "REUSE").toUpperCase()}
              </span>
            </div>
          </div>

          {/* Fault Isolation Cards Grid */}
          <div className="space-y-4">
            {(session.repairAssessment?.issues || []).map((issue, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] text-[10px] font-mono font-bold">
                      {issue.action} Recommended
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-mono font-bold">
                      Severity: {issue.severity.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono text-[#16A34A] font-bold">
                      {issue.confidence}% Confidence
                    </span>
                  </div>

                  <h4 className="font-heading text-base font-bold text-[#0F172A]">
                    {issue.component}
                  </h4>
                  <p className="text-xs text-[#475569]">
                    <strong>Detected Condition:</strong> {issue.condition || issue.issue}
                  </p>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    <strong>Diagnostic Rationale:</strong> {issue.rationale}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={() => openMarketplaceListing(selectedComponent)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    Execute {issue.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 6: CIRCULAR IMPACT ──────────────────────────────── */}
      {activeTab === "impact" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-mono text-[#16A34A] font-bold uppercase tracking-wider mb-1">
                SCOPE 3 LIFE-CYCLE METHODOLOGY
              </div>
              <h2 className="font-heading text-xl font-extrabold text-[#0F172A]">
                Circular Environmental Impact
              </h2>
              <p className="text-xs text-[#64748B]">
                Calculated resource avoidance by diverting this electronic assembly from landfill or shredding.
              </p>
            </div>

            <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              Status: ESG Reporting Estimate
            </span>
          </div>

          {/* 6 Key Impact Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-[#F0FDF4] border border-[#DCFCE7] space-y-1">
              <span className="text-xs font-mono text-[#16A34A]">CO₂ Avoided</span>
              <div className="font-heading text-3xl sm:text-4xl font-extrabold text-[#16A34A]">
                {session.carbonImpact?.co2AvoidedKg || 22.1} kg
              </div>
              <span className="text-[10px] text-[#64748B] block">Emissions from fab avoided</span>
            </div>

            <div className="p-6 rounded-3xl bg-[#EFF6FF] border border-[#BFDBFE] space-y-1">
              <span className="text-xs font-mono text-[#2563EB]">Energy Conserved</span>
              <div className="font-heading text-3xl sm:text-4xl font-extrabold text-[#2563EB]">
                {session.carbonImpact?.energySavedKWh || 54} kWh
              </div>
              <span className="text-[10px] text-[#64748B] block">Silicon crystallization energy</span>
            </div>

            <div className="p-6 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-xs font-mono text-[#0F172A]">Water Saved</span>
              <div className="font-heading text-3xl sm:text-4xl font-extrabold text-[#0F172A]">
                {session.carbonImpact?.waterSavedLiters || 180} L
              </div>
              <span className="text-[10px] text-[#64748B] block">Semiconductor ultrapure rinse</span>
            </div>

            <div className="p-6 rounded-3xl bg-[#FFFBEB] border border-[#FDE68A] space-y-1">
              <span className="text-xs font-mono text-[#B88900]">E-Waste Diverted</span>
              <div className="font-heading text-3xl sm:text-4xl font-extrabold text-[#B88900]">
                {session.carbonImpact?.eWasteDivertedKg || 0.22} kg
              </div>
              <span className="text-[10px] text-[#64748B] block">Landfill toxicity prevention</span>
            </div>

            <div className="p-6 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-xs font-mono text-[#475569]">Material Recovered</span>
              <div className="font-heading text-3xl sm:text-4xl font-extrabold text-[#0F172A]">
                {session.materialRecovery?.recoveryEfficiencyPercent || 98.0}%
              </div>
              <span className="text-[10px] text-[#64748B] block">Hydrometallurgical yield</span>
            </div>

            <div className="p-6 rounded-3xl bg-[#EFF6FF] border border-[#BFDBFE] space-y-1">
              <span className="text-xs font-mono text-[#2563EB]">Components Reused</span>
              <div className="font-heading text-3xl sm:text-4xl font-extrabold text-[#2563EB]">
                {session.detection?.componentsCount || 38} ICs
              </div>
              <span className="text-[10px] text-[#64748B] block">Ready for redistribution</span>
            </div>
          </div>

          {/* Methodology Transparency Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-2 text-xs font-mono text-[#475569] leading-relaxed">
            <h4 className="font-bold text-[#0F172A]">Calculation Methodology & Basis:</h4>
            <p>
              Environmental calculations follow the Greenhouse Gas Protocol (GHG Protocol Scope 3 Technical Guidance). Baseline comparison models emissions associated with virgin silicon ingot smelting, gold leaching, and multi-layer FR-4 epoxy lamination against secondary redistribution and testing overhead.
            </p>
            <p className="text-[11px] text-[#64748B] pt-1">
              Notice: All values are categorized as <strong>Calculated Estimates</strong> for internal ESG reporting and do not constitute independent ISO 14040/44 third-party certification.
            </p>
          </div>
        </div>
      )}

      {/* ─── RECOMMENDATION & NEXT ACTIONS ────────────────────────── */}
      <div className="p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-6">
        <div>
          <span className="text-[10px] font-mono text-[#2563EB] font-bold uppercase tracking-wider">
            RECOMMENDED CIRCULAR PROTOCOL
          </span>
          <h3 className="font-heading text-lg font-bold text-[#0F172A] mt-0.5">
            {session.executiveSummary?.recommendedAction || "Direct redeployment with open-source firmware for rural or community connectivity."}
          </h3>
          <p className="text-xs text-[#64748B] mt-1">
            Grade A+ assembly with zero critical thermal fatigue. Recommended for digital passport minting and verified marketplace redistribution.
          </p>
        </div>

        <div className="border-t border-[#E2E8F0] pt-6">
          <p className="text-xs font-mono font-bold text-[#0F172A] mb-4">
            What would you like to do next?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              href={`/console/passport${sessionIdParam}`}
              onClick={() => setActiveStep(7)}
              className="p-4 rounded-2xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center justify-between transition-colors shadow-sm"
            >
              <span>Generate Digital Passport</span>
              <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
            </Link>

            <Link
              href={`/marketplace/create${sessionIdParam}`}
              className="p-4 rounded-2xl bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE] text-xs font-semibold flex items-center justify-between transition-colors"
            >
              <span>List Recovered Components</span>
              <ShoppingCart className="w-4 h-4 text-[#2563EB]" />
            </Link>

            <Link
              href={`/console/report${sessionIdParam}`}
              onClick={() => setActiveStep(8)}
              className="p-4 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center justify-between transition-colors shadow-sm shadow-blue-500/25"
            >
              <span>Download Full Report</span>
              <FileText className="w-4 h-4 text-white" />
            </Link>

            <Link
              href="/console"
              onClick={() => setActiveStep(1)}
              className="p-4 rounded-2xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] hover:text-[#0F172A] border border-[#E2E8F0] text-xs font-semibold flex items-center justify-between transition-colors"
            >
              <span>Start New Analysis</span>
              <RotateCcw className="w-4 h-4 text-[#64748B]" />
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function ConsoleResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 py-16 flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin mb-3" />
          <span className="font-mono text-xs font-bold text-[#0F172A]">Loading Analysis Results...</span>
        </div>
      }
    >
      <ConsoleResultsContent />
    </Suspense>
  );
}
