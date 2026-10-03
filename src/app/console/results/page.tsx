"use client";

import React, { useState, Suspense } from "react";
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
  Maximize2,
  Sliders,
  DollarSign,
  TrendingDown,
  Info,
  Clock,
  ArrowRight,
  ExternalLink,
  Search,
  Filter,
  Flame,
} from "lucide-react";
import { useAnalysisSession } from "@/lib/context/AnalysisSessionContext";

const ProcessingPcb3D = dynamic(
  () => import("@/components/3d/ProcessingPcb3D"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 flex items-center justify-center bg-[#F1F5F9] rounded-2xl">
        <Cpu className="w-8 h-8 text-[#2563EB] animate-pulse" />
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
  const initialTab = searchParams.get("tab") || "inventory";

  const {
    session,
    resultsTab,
    setResultsTab,
    selectedComponent,
    setSelectedComponent,
    updateRulSimulation,
    openMarketplaceListing,
    setActiveStep,
  } = useAnalysisSession();

  const [activeTab, setActiveInternalTab] = useState(initialTab);
  const [componentSearch, setComponentSearch] = useState("");
  const [componentFilter, setComponentFilter] = useState("all");
  const [isExploded, setIsExploded] = useState(false);
  const [showTraces, setShowTraces] = useState(true);
  const [showBoxes, setShowBoxes] = useState(true);

  // RUL Simulation Interactive Parameters
  const [simTemp, setSimTemp] = useState(
    session.rulResult?.parameters?.operatingTempCelsius || 48
  );
  const [simVoltage, setSimVoltage] = useState(
    session.rulResult?.parameters?.inputVoltageVolts || 3.3
  );
  const [simCycles, setSimCycles] = useState(
    session.rulResult?.parameters?.operatingCycles || 3400
  );
  const [simAge, setSimAge] = useState(
    session.rulResult?.parameters?.ageYears || 2.1
  );

  const handleTabChange = (tabId: string) => {
    setActiveInternalTab(tabId);
    setResultsTab(tabId);
  };

  const handleApplyRulSimulation = () => {
    updateRulSimulation({
      temp: simTemp,
      voltage: simVoltage,
      cycles: simCycles,
      age: simAge,
    });
  };

  const componentsList = session.detectionResult?.components || [];

  const filteredComponents = componentsList.filter((comp: any) => {
    const matchesSearch =
      comp.name.toLowerCase().includes(componentSearch.toLowerCase()) ||
      comp.type.toLowerCase().includes(componentSearch.toLowerCase()) ||
      comp.manufacturer.toLowerCase().includes(componentSearch.toLowerCase());
    if (componentFilter === "all") return matchesSearch;
    if (componentFilter === "reusable")
      return matchesSearch && comp.health >= 90;
    if (componentFilter === "swap")
      return matchesSearch && comp.health < 85;
    return matchesSearch;
  });

  const tabs = [
    { id: "inventory", name: "Component Inventory & 3D Inspector", icon: Cpu },
    { id: "pcb", name: "PCB Intelligence & Topology", icon: Layers },
    { id: "rul", name: "Remaining Useful Life (RUL)", icon: Activity },
    { id: "metals", name: "Precious Metal Recovery", icon: Coins },
    { id: "repair", name: "AI Repair Assessment", icon: Wrench },
    { id: "carbon", name: "Circular Impact", icon: Leaf },
  ];

  return (
    <div className="flex-1 py-8 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-8">
      
      {/* ─── HEADER & METADATA BAR ──────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-xs font-mono font-bold text-[#16A34A] mb-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>EcoIntel Analysis Complete</span>
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Hardware Intelligence Overview
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Comprehensive lifecycle analysis for <strong>{session.deviceName}</strong> ({session.deviceType}).
          </p>
        </div>

        {/* Top Actions: Passport, Report, Marketplace */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => openMarketplaceListing(selectedComponent)}
            className="px-4 py-2 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>List Recovered Components</span>
          </button>

          <Link
            href="/console/passport"
            onClick={() => setActiveStep(7)}
            className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Digital Passport</span>
          </Link>

          <Link
            href="/console/report"
            onClick={() => setActiveStep(8)}
            className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-blue-500/25 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Full Report</span>
          </Link>
        </div>
      </div>

      {/* ─── EXECUTIVE RESULT SUMMARY CARD ──────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm grid grid-cols-2 md:grid-cols-5 gap-6 items-center">
        
        {/* Health */}
        <div className="space-y-1">
          <span className="text-xs font-mono text-[#64748B]">Hardware Health</span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-3xl sm:text-4xl font-extrabold text-[#16A34A]">
              {session.rulResult?.overallHealthScore || 92}%
            </span>
            <span className="text-[10px] font-mono font-bold text-[#16A34A]">Grade A+</span>
          </div>
          <span className="text-[10px] font-mono text-[#64748B] block">
            Confidence: 94% · IPC Spec
          </span>
        </div>

        {/* Classification */}
        <div className="space-y-1">
          <span className="text-xs font-mono text-[#64748B]">Classification</span>
          <div className="font-heading text-2xl sm:text-3xl font-bold text-[#0F172A]">
            {session.executiveSummary?.classification || "Reusable"}
          </div>
          <span className="text-[10px] font-mono text-[#2563EB] block">
            Circular Redistribution
          </span>
        </div>

        {/* Potential Recovery Value */}
        <div className="space-y-1">
          <span className="text-xs font-mono text-[#64748B]">Recoverable Value</span>
          <div className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
            ${session.executiveSummary?.potentialValueUSD?.toFixed(2) || "18.70"}
          </div>
          <span className="text-[10px] font-mono text-[#B88900] block">
            Metals + Reusable ICs
          </span>
        </div>

        {/* Remaining Useful Life */}
        <div className="space-y-1">
          <span className="text-xs font-mono text-[#64748B]">Est. Remaining Life</span>
          <div className="font-heading text-2xl sm:text-3xl font-extrabold text-[#2563EB]">
            {session.rulResult?.predictedYears || 6.4} Yrs
          </div>
          <span className="text-[10px] font-mono text-[#64748B] block">
            ~{session.rulResult?.predictedHours?.toLocaleString() || "56,000"} Hours
          </span>
        </div>

        {/* Components Detected */}
        <div className="space-y-1 col-span-2 md:col-span-1">
          <span className="text-xs font-mono text-[#64748B]">Components Detected</span>
          <div className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
            {session.detectionResult?.componentsCount || componentsList.length || 48}
          </div>
          <span className="text-[10px] font-mono text-[#16A34A] block">
            100% Neural Coverage
          </span>
        </div>

      </div>

      {/* ─── WORKSPACE SUB-NAVIGATION TABS ───────────────────────── */}
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
                  ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/20"
                  : "bg-white text-[#475569] hover:bg-[#F1F5F9] border border-[#E2E8F0]"
              }`}
            >
              <IconComp className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: COMPONENT INVENTORY & 3D INSPECTOR ──────────── */}
      {activeTab === "inventory" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Table (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-base font-bold text-[#0F172A]">
                  Detected Component Inventory
                </h3>
                <p className="text-xs text-[#64748B]">
                  Click any row to inspect in the interactive 3D spatial viewer.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search IC, capacitor..."
                    value={componentSearch}
                    onChange={(e) => setComponentSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-mono focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
                <select
                  value={componentFilter}
                  onChange={(e) => setComponentFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-mono bg-white focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="all">All Packages</option>
                  <option value="reusable">Reusable (90%+)</option>
                  <option value="swap">Needs Swap</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] font-mono text-[11px] text-[#64748B]">
                  <tr>
                    <th className="py-2.5 px-3">Component</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Package</th>
                    <th className="py-2.5 px-3">Confidence</th>
                    <th className="py-2.5 px-3">Health</th>
                    <th className="py-2.5 px-3">RUL</th>
                    <th className="py-2.5 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] font-mono">
                  {filteredComponents.map((comp: any) => {
                    const isSelected = selectedComponent?.id === comp.id;
                    return (
                      <tr
                        key={comp.id}
                        onClick={() => setSelectedComponent(comp)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[#EFF6FF] border-l-4 border-l-[#2563EB]"
                            : "hover:bg-[#F8FAFC]"
                        }`}
                      >
                        <td className="py-3 px-3">
                          <p className="font-bold text-[#0F172A] font-sans">
                            {comp.name}
                          </p>
                          <p className="text-[10px] text-[#64748B]">
                            {comp.manufacturer}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-[#475569]">{comp.type}</td>
                        <td className="py-3 px-3 text-[#64748B]">{comp.package}</td>
                        <td className="py-3 px-3">
                          <span className="text-[#16A34A] font-bold">
                            {comp.confidence}%
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              comp.health >= 90
                                ? "bg-[#DCFCE7] text-[#16A34A]"
                                : "bg-[#FEF3C7] text-[#D97706]"
                            }`}
                          >
                            {comp.health}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#2563EB] font-bold">
                          {comp.remainingLifeYears} Yrs
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openMarketplaceListing(comp);
                            }}
                            className="px-2 py-1 rounded bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[10px] font-bold text-[#2563EB]"
                          >
                            List
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right 3D Component Inspector (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#2563EB] font-bold uppercase tracking-wider">
                  3D HARDWARE INSPECTOR
                </span>
                <h3 className="font-heading text-base font-bold text-[#0F172A]">
                  Selected Node Telemetry
                </h3>
              </div>

              {/* Explode / Traces toggle */}
              <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-0.5 text-[10px] font-mono">
                <button
                  onClick={() => setIsExploded(!isExploded)}
                  className={`px-2 py-1 rounded ${
                    isExploded ? "bg-[#2563EB] text-white" : "text-[#64748B]"
                  }`}
                >
                  Explode
                </button>
                <button
                  onClick={() => setShowTraces(!showTraces)}
                  className={`px-2 py-1 rounded ${
                    showTraces ? "bg-[#EFF6FF] text-[#2563EB]" : "text-[#94A3B8]"
                  }`}
                >
                  Traces
                </button>
              </div>
            </div>

            {/* 3D Model Window */}
            <div className="h-64 w-full bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] overflow-hidden relative">
              <ProcessingPcb3D
                isScanning={false}
                exploded={isExploded}
                showTraces={showTraces}
                showBoxes={showBoxes}
              />
              <div className="absolute bottom-2 left-3 text-[10px] font-mono text-[#64748B]">
                Interactive CAD Mesh · Drag to rotate
              </div>
            </div>

            {/* Selected Component Data Card */}
            {selectedComponent ? (
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#0F172A]">
                    {selectedComponent.name}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] font-mono text-[10px] font-bold">
                    Health {selectedComponent.health}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>Package: <strong>{selectedComponent.package}</strong></div>
                  <div>Confidence: <strong>{selectedComponent.confidence}%</strong></div>
                  <div>Lifespan: <strong>{selectedComponent.remainingLifeYears} Yrs</strong></div>
                  <div>Hours: <strong>{selectedComponent.remainingLifeHours?.toLocaleString()} Hrs</strong></div>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0] space-y-1 text-[11px]">
                  <p className="text-[#64748B]">
                    <strong>Materials:</strong> {selectedComponent.material || "Silicon, Copper, Tin"}
                  </p>
                  <p className="text-[#2563EB]">
                    <strong>Recommendation:</strong> {selectedComponent.repairRecommendation || "Ready for direct PCB assembly reuse."}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#16A34A] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Passport Linked
                  </span>
                  <button
                    onClick={() => openMarketplaceListing(selectedComponent)}
                    className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8]"
                  >
                    List this Component
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#F8FAFC] text-center text-xs text-[#64748B]">
                Select a component from the inventory to view details.
              </div>
            )}

          </div>

        </div>
      )}

      {/* ─── TAB 2: PCB INTELLIGENCE ────────────────────────────── */}
      {activeTab === "pcb" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* 3D Visualizer (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-base font-bold text-[#0F172A]">
                    Reconstructed PCB Topology & Netlist
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Generative Graph Neural Topology (GGNT) synthesized Gerber traces.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-[#16A34A] px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0]">
                  {session.reconstructionResult?.traceIntegrityPercent || 96.8}% Trace Integrity
                </span>
              </div>

              <div className="h-80 w-full bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] overflow-hidden">
                <ProcessingPcb3D
                  isScanning={false}
                  exploded={false}
                  showTraces={true}
                  showBoxes={true}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-mono text-[#64748B]">
                  <span>Model: {session.reconstructionResult?.boardModel || "Enterprise PCB Rev 4.2"}</span>
                  <span>·</span>
                  <span>{session.reconstructionResult?.layerCount || 8} Layers</span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={session.reconstructionResult?.schematics?.kicadFileUrl || "#"}
                    className="px-3 py-1.5 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-xs font-mono font-semibold text-[#0F172A] flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download KiCad PCB</span>
                  </a>
                  <a
                    href={session.reconstructionResult?.schematics?.gerberZipUrl || "#"}
                    className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-mono font-semibold text-white flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Gerber Netlist</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Telemetry Details (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
              <h3 className="font-heading text-sm font-bold text-[#0F172A] uppercase tracking-wider">
                Continuity & Layer Diagnostics
              </h3>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs font-mono">
                  <span className="text-[#64748B]">Severed Traces Repaired:</span>
                  <span className="font-bold text-[#16A34A]">
                    {session.reconstructionResult?.severedTracesRepaired || 3} Traces
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs font-mono">
                  <span className="text-[#64748B]">Reconstruction Confidence:</span>
                  <span className="font-bold text-[#2563EB]">
                    {((session.reconstructionResult?.reconstructionConfidence || 0.985) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs font-mono">
                  <span className="text-[#64748B]">Copper Substrate Plane:</span>
                  <span className="font-bold text-[#0F172A]">FR-4 High-Tg (170°C)</span>
                </div>
              </div>

              {/* Netlist Preview Snippet */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-[#64748B] font-semibold">
                  Synthesized Netlist Preview:
                </span>
                <pre className="p-3 rounded-xl bg-[#0F172A] text-[#38BDF8] text-[10px] font-mono overflow-x-auto leading-relaxed max-h-36">
                  {session.reconstructionResult?.schematics?.netlistRaw ||
                    "NET 'VCC_3V3' COMP 'LM358':1 COMP 'MCU':4;\nNET 'GND' COMP 'GND_PLANE':1;\nNET 'DDR5_CLK' COMP 'RAM':14;"}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#2563EB] flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Traces and schematics are inferred by GGNT neural models based on industrial Gerber topologies.
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── TAB 3: HEALTH & REMAINING USEFUL LIFE (RUL) ────────── */}
      {activeTab === "rul" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Health Gauge & Degradation Curve (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-base font-bold text-[#0F172A]">
                  Remaining Useful Life Projection
                </h3>
                <p className="text-xs text-[#64748B]">
                  Arrhenius thermal wear + voltage stress degradation models.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full">
                Confidence: {((session.rulResult?.confidence || 0.94) * 100).toFixed(0)}%
              </span>
            </div>

            {/* Health Score Gauge */}
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <span className="text-xs font-mono text-[#64748B]">Projected Health Score</span>
                <div className="font-heading text-5xl font-extrabold text-[#16A34A] mt-1">
                  {session.rulResult?.overallHealthScore || 92}%
                </div>
                <p className="text-xs text-[#475569] mt-1">
                  Failure Probability: <strong>{((session.rulResult?.failureProbability || 0.08) * 100).toFixed(1)}%</strong>
                </p>
              </div>

              <div className="h-16 w-px bg-[#E2E8F0] hidden sm:block" />

              <div className="text-center sm:text-right">
                <span className="text-xs font-mono text-[#64748B]">Estimated Remaining Life</span>
                <div className="font-heading text-4xl font-extrabold text-[#2563EB] mt-1">
                  {session.rulResult?.predictedYears || 6.4} Years
                </div>
                <p className="text-xs text-[#475569] mt-1 font-mono">
                  ~{session.rulResult?.predictedHours?.toLocaleString() || "56,000"} Operating Hours
                </p>
              </div>
            </div>

            {/* Visual Degradation Graph */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-[#64748B] font-semibold">
                Simulated Lifecycle Decay Curve (Years vs Health)
              </span>
              <div className="h-44 w-full bg-[#0F172A] rounded-2xl p-4 flex items-end justify-between gap-2 border border-slate-800">
                {[
                  { yr: "0Y", val: 100 },
                  { yr: "2Y", val: 93 },
                  { yr: "4Y", val: 84 },
                  { yr: "6Y", val: 72 },
                  { yr: "8Y", val: 56 },
                  { yr: "10Y", val: 38 },
                  { yr: "12Y", val: 18 },
                ].map((pt) => (
                  <div key={pt.yr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[9px] font-mono text-[#38BDF8]">{pt.val}%</span>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-[#2563EB] to-[#38BDF8] transition-all"
                      style={{ height: `${pt.val * 0.75}%` }}
                    />
                    <span className="text-[9px] font-mono text-slate-400">{pt.yr}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Interactive Stress Simulation Sliders (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 space-y-5">
            <div>
              <span className="text-[10px] font-mono text-[#2563EB] font-bold uppercase tracking-wider">
                PHYSICS-INFORMED STRESS ENGINE
              </span>
              <h3 className="font-heading text-base font-bold text-[#0F172A]">
                Operational Simulation
              </h3>
              <p className="text-xs text-[#64748B]">
                Modify operating envelope variables to dynamically simulate wear curves.
              </p>
            </div>

            {/* Sliders */}
            <div className="space-y-4 text-xs font-mono">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#0F172A] font-semibold">Operating Temperature:</span>
                  <span className="text-[#2563EB] font-bold">{simTemp}°C</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="105"
                  value={simTemp}
                  onChange={(e) => setSimTemp(parseInt(e.target.value))}
                  className="w-full accent-[#2563EB]"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#0F172A] font-semibold">Bus Supply Voltage:</span>
                  <span className="text-[#2563EB] font-bold">{simVoltage.toFixed(1)}V</span>
                </div>
                <input
                  type="range"
                  min="2.5"
                  max="24.0"
                  step="0.5"
                  value={simVoltage}
                  onChange={(e) => setSimVoltage(parseFloat(e.target.value))}
                  className="w-full accent-[#2563EB]"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#0F172A] font-semibold">Thermal Cycles:</span>
                  <span className="text-[#2563EB] font-bold">{simCycles.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="25000"
                  step="500"
                  value={simCycles}
                  onChange={(e) => setSimCycles(parseInt(e.target.value))}
                  className="w-full accent-[#2563EB]"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#0F172A] font-semibold">Observed Hardware Age:</span>
                  <span className="text-[#2563EB] font-bold">{simAge.toFixed(1)} Yrs</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10.0"
                  step="0.5"
                  value={simAge}
                  onChange={(e) => setSimAge(parseFloat(e.target.value))}
                  className="w-full accent-[#2563EB]"
                />
              </div>
            </div>

            <button
              onClick={handleApplyRulSimulation}
              className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Re-Calculate Degradation Prediction
            </button>
          </div>

        </div>
      )}

      {/* ─── TAB 4: PRECIOUS METAL RECOVERY ─────────────────────── */}
      {activeTab === "metals" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* 3D Realistic Metals (6 Cols) */}
            <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-base font-bold text-[#0F172A]">
                    Material Recovery Potential
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Gold (Au), Silver (Ag), Copper (Cu), Palladium (Pd) Yields.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-[#B88900] bg-[#FFFBEB] px-3 py-1 rounded-full border border-[#FDE047]">
                  ${session.metalResult?.totalEstimatedMarketValueUSD?.toFixed(2) || "18.70"} Total Yield
                </span>
              </div>

              <div className="h-72 w-full bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] overflow-hidden">
                <PreciousMetals3D />
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-[#64748B] pt-1">
                <span>PCB Weight: {session.metalResult?.pcbWeightKg || 0.28} kg</span>
                <span className="text-[#16A34A] font-bold">
                  {session.metalResult?.recoveryEfficiencyPercent || 98.6}% Recovery Efficiency
                </span>
              </div>
            </div>

            {/* Metals Yield Cards (6 Cols) */}
            <div className="lg:col-span-6 space-y-3">
              {(session.metalResult?.yields || []).map((metal: any) => (
                <div
                  key={metal.symbol}
                  className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-between hover:border-[#2563EB]/40 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-extrabold text-base border shadow-sm"
                      style={{
                        backgroundColor: metal.symbol === "Au" ? "#FEF9C3" : metal.symbol === "Cu" ? "#FFF7ED" : "#EFF6FF",
                        color: metal.color || "#0F172A",
                        borderColor: metal.symbol === "Au" ? "#FDE047" : "#BFDBFE",
                      }}
                    >
                      {metal.symbol}
                    </div>
                    <div>
                      <h4 className="font-heading text-sm font-bold text-[#0F172A]">
                        {metal.metal}
                      </h4>
                      <p className="text-xs font-mono text-[#64748B]">
                        Yield: <strong>{metal.yieldGrams} g</strong> @ ${metal.marketRateUSD}/g
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-heading text-base font-bold text-[#0F172A] block">
                      ${metal.estimatedValueUSD.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-mono text-[#16A34A]">Estimated</span>
                  </div>
                </div>
              ))}

              <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE047] text-xs text-[#B88900] leading-relaxed">
                <strong>Scientific Disclaimer:</strong> Metal quantities represent non-destructive spectrometry predictions based on standardized PCB surface finishes (ENIG, HASL, immersion silver) and component package leadframes.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── TAB 5: AI REPAIR ASSESSMENT ────────────────────────── */}
      {activeTab === "repair" && (
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
            <div>
              <span className="text-[10px] font-mono text-[#2563EB] font-bold uppercase tracking-wider">
                DIAGNOSTIC FAULT MATRIX
              </span>
              <h3 className="font-heading text-xl font-bold text-[#0F172A]">
                AI Repair & Refurbishment Intelligence
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Pinpoint failure analysis with circular action recommendations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#475569]">Recommended Path:</span>
              <span className="px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-mono font-bold text-[#2563EB] uppercase">
                {session.repairResult?.recommendedAction || "Refurbish"}
              </span>
            </div>
          </div>

          {/* Fault Issues List */}
          <div className="space-y-3">
            {(session.repairResult?.issues || []).map((issue: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        issue.severity === "high" || issue.severity === "critical"
                          ? "bg-[#FEE2E2] text-[#DC2626]"
                          : issue.severity === "medium"
                          ? "bg-[#FEF3C7] text-[#D97706]"
                          : "bg-[#EFF6FF] text-[#2563EB]"
                      }`}
                    >
                      {issue.severity} Severity
                    </span>
                    <span className="font-bold text-xs text-[#0F172A]">
                      {issue.component}
                    </span>
                  </div>
                  <p className="text-xs text-[#475569]">{issue.issue}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-[11px] font-mono text-[#2563EB] font-bold block">
                      {issue.action}
                    </span>
                    <span className="text-[10px] text-[#64748B]">Action</span>
                  </div>

                  <span className="px-4 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-bold text-[#0F172A]">
                    {issue.recommendation}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
              <span className="text-xs font-mono text-[#64748B]">Estimated Repair Cost</span>
              <p className="font-heading text-2xl font-bold text-[#0F172A] mt-1">
                ${session.repairResult?.estimatedRepairCostUSD?.toFixed(2) || "14.50"}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
              <span className="text-xs font-mono text-[#64748B]">Lifecycle CO₂ Savings</span>
              <p className="font-heading text-2xl font-bold text-[#16A34A] mt-1">
                {session.repairResult?.estimatedCO2SavingsKg || 28.4} kg
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
              <span className="text-xs font-mono text-[#64748B]">Feasibility Index</span>
              <p className="font-heading text-2xl font-bold text-[#2563EB] mt-1">
                {session.repairResult?.feasibilityIndexPercent || 92}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 6: CIRCULAR IMPACT ─────────────────────────────── */}
      {activeTab === "carbon" && (
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <span className="text-[10px] font-mono text-[#16A34A] font-bold uppercase tracking-wider">
              SCOPE 3 ESG ACCOUNTING
            </span>
            <h3 className="font-heading text-xl font-bold text-[#0F172A]">
              Circular Environmental Impact
            </h3>
            <p className="text-xs text-[#64748B]">
              Resource conservation enabled by diverting this hardware from e-waste landfills.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] space-y-1">
              <span className="text-xs font-mono text-[#16A34A]">CO₂ Avoided</span>
              <div className="font-heading text-3xl font-extrabold text-[#16A34A]">
                {session.carbonResult?.co2AvoidedKg || 34.6} kg
              </div>
              <span className="text-[10px] text-[#64748B]">Direct Scope 3 Savings</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] space-y-1">
              <span className="text-xs font-mono text-[#2563EB]">Energy Conserved</span>
              <div className="font-heading text-3xl font-extrabold text-[#2563EB]">
                {session.carbonResult?.energySavedKWh || 82.4} kWh
              </div>
              <span className="text-[10px] text-[#64748B]">Manufacturing avoided</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-xs font-mono text-[#0F172A]">Water Saved</span>
              <div className="font-heading text-3xl font-extrabold text-[#0F172A]">
                {session.carbonResult?.waterSavedLiters || 320} L
              </div>
              <span className="text-[10px] text-[#64748B]">Semiconductor fab water</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#FFFBEB] border border-[#FDE047] space-y-1">
              <span className="text-xs font-mono text-[#B88900]">E-Waste Diverted</span>
              <div className="font-heading text-3xl font-extrabold text-[#B88900]">
                {session.carbonResult?.eWasteDivertedKg || 0.28} kg
              </div>
              <span className="text-[10px] text-[#64748B]">Zero-Landfill Diverted</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── BOTTOM WORKSPACE ACTION FOOTER ─────────────────────── */}
      <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-[#64748B]">Session Status:</span>
          <span className="text-xs font-bold text-[#16A34A] ml-1.5">
            Analysis Completed · Certified Ready
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/console"
            className="px-5 py-2.5 rounded-full border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-colors"
          >
            Start New Analysis
          </Link>

          <Link
            href="/console/passport"
            onClick={() => setActiveStep(7)}
            className="px-5 py-2.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold transition-colors flex items-center gap-2"
          >
            <span>View Digital Passport</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/console/report"
            onClick={() => setActiveStep(8)}
            className="px-6 py-2.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-colors flex items-center gap-2"
          >
            <span>Complete Intelligence Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
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

