"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Coins,
  Cpu,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Info,
  RotateCcw,
  Sliders,
  Search,
  Filter,
  Download,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Percent,
  Scale,
  FlaskConical,
  Database,
  FileText,
  Flame,
  Check,
  X,
} from "lucide-react";

export interface MaterialRecoveryWorkspaceProps {
  analysisId: string;
  initialSessionData?: any;
  onSelectComponent?: (comp: any) => void;
  selectedComponent?: any;
}

export default function MaterialRecoveryWorkspace({
  analysisId,
  initialSessionData,
  onSelectComponent,
  selectedComponent,
}: MaterialRecoveryWorkspaceProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [materialData, setMaterialData] = useState<any>(null);

  // Active scenario: conservative | typical | optimistic
  const [activeScenario, setActiveScenario] = useState<"conservative" | "typical" | "optimistic">("typical");

  // Component search and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [componentFilter, setComponentFilter] = useState<"all" | "high" | "precious" | "base">("all");

  // Selected component drawer state
  const [activeComponentDetail, setActiveComponentDetail] = useState<any>(null);

  // Load Material Recovery Data
  const loadMaterialData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await fetch(`/api/materials/${analysisId}`);
      const data = await res.json();

      if (data.success && data.materialRecovery) {
        setMaterialData(data.materialRecovery);
      } else if (data.error?.code === "NOT_ANALYZED") {
        // Trigger auto-analysis if not yet analyzed
        const analyzeRes = await fetch(`/api/materials/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analysisId }),
        });
        const analyzeData = await analyzeRes.json();
        if (analyzeData.success && analyzeData.materialRecovery) {
          setMaterialData(analyzeData.materialRecovery);
        } else {
          setError(analyzeData.error?.message || "Failed to trigger material analysis.");
        }
      } else {
        setError(data.error?.message || "Failed to load material recovery data.");
      }
    } catch (err: any) {
      console.error("[MaterialRecoveryWorkspace] Error loading data:", err);
      setError(err.message || "Network error loading material data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (analysisId) {
      loadMaterialData();
    }
  }, [analysisId]);

  // Sync external component selection from 3D viewer
  useEffect(() => {
    if (selectedComponent && materialData?.componentContributions) {
      const match = materialData.componentContributions.find(
        (c: any) =>
          c.componentId === selectedComponent.serialNumber ||
          c.componentId === selectedComponent.name ||
          c.componentId === selectedComponent.id
      );
      if (match) {
        setActiveComponentDetail(match);
      }
    }
  }, [selectedComponent, materialData]);

  // Active Scenario Numbers
  const scenarioData = useMemo(() => {
    if (!materialData?.recoveryScenarios) return null;
    return materialData.recoveryScenarios[activeScenario];
  }, [materialData, activeScenario]);

  // Filtered Components List
  const filteredComponents = useMemo(() => {
    if (!materialData?.componentContributions) return [];
    let list = materialData.componentContributions;

    if (componentFilter === "high") {
      list = list.filter((c: any) => c.recoveryPriority === "HIGH");
    } else if (componentFilter === "precious") {
      list = list.filter((c: any) =>
        (c.materials || []).some((m: any) => m.category === "PRECIOUS_METAL")
      );
    } else if (componentFilter === "base") {
      list = list.filter((c: any) =>
        (c.materials || []).some((m: any) => m.category === "BASE_METAL")
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c: any) =>
          (c.componentId || "").toLowerCase().includes(q) ||
          (c.componentType || "").toLowerCase().includes(q) ||
          (c.packageName || "").toLowerCase().includes(q) ||
          (c.primaryRecoverableMetal || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [materialData, componentFilter, searchQuery]);

  // CSV Export Handler
  const exportCSV = () => {
    if (!materialData) return;
    const rows = [
      ["Material", "Category", "Estimated Mass (g)", "Recoverable Mass (g)", "Confidence", "Evidence Level"],
      ...(materialData.materialSummary || []).map((m: any) => [
        m.material,
        m.category,
        m.estimatedMassGrams,
        m.recoverableMassGrams,
        m.confidence,
        m.evidenceLevel,
      ]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `material-recovery-${analysisId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Export Handler
  const exportJSON = () => {
    if (!materialData) return;
    const blob = new Blob([JSON.stringify(materialData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `material-recovery-${analysisId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-3xl border border-[#E2E8F0] p-12 space-y-4">
        <Coins className="w-10 h-10 text-[#B88900] animate-bounce" />
        <h3 className="font-heading text-lg font-bold text-[#0F172A]">
          Synthesizing Material Recovery Intelligence...
        </h3>
        <p className="text-xs text-[#64748B] font-mono max-w-md text-center">
          Loading component detections, FR-4 substrate geometry, and literature composition ranges.
        </p>
      </div>
    );
  }

  if (error || !materialData) {
    return (
      <div className="w-full min-h-[300px] flex flex-col items-center justify-center bg-white rounded-3xl border border-[#FCA5A5] p-8 space-y-4">
        <AlertTriangle className="w-10 h-10 text-[#DC2626]" />
        <h3 className="font-heading text-lg font-bold text-[#0F172A]">Material Intelligence Unavailable</h3>
        <p className="text-xs text-[#64748B] font-mono text-center max-w-md">
          {error || "Could not retrieve material recovery data."}
        </p>
        <button
          onClick={loadMaterialData}
          className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  const isDemo = materialData.provider === "mock" || materialData.source === "DEMO";

  return (
    <div className="space-y-6">
      {/* ─── HEADER BAR ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-heading text-xl font-extrabold text-[#0F172A]">
              Material Recovery Intelligence
            </h2>
            {isDemo && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                DEMO DATASET
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
              {materialData.provider === "database" ? "COMPOSITION DB v1.0" : "BENCHMARK MODEL"}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Component-derived material composition ranges, multi-scenario recovery yields, and circular mining priorities.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-mono font-semibold text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#64748B]" />
            CSV
          </button>
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-mono font-semibold text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
            title="Export JSON"
          >
            <FileText className="w-3.5 h-3.5 text-[#64748B]" />
            JSON
          </button>
          <button
            onClick={loadMaterialData}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-mono font-semibold text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-[#64748B] ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ─── SCIENTIFIC CREDIBILITY NOTICE ─────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-start gap-3 text-xs text-[#1E40AF]">
        <Info className="w-5 h-5 flex-shrink-0 text-[#2563EB] mt-0.5" />
        <div className="space-y-1">
          <strong className="font-semibold block">Scientific Integrity Constraint:</strong>
          <p className="leading-relaxed text-[11px] text-[#1E3A8A]">
            RGB computer vision detects component packages, connectors, and board geometry. Physical material quantities
            are statistical estimates cross-referenced with peer-reviewed literature and JEDEC/IPC databases.
            They are not physical chemical assays (XRF / ICP-OES).
          </p>
        </div>
      </div>

      {/* ─── 1. MATERIAL OVERVIEW HERO CARDS ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Board Mass */}
        <div className="p-5 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-mono font-semibold uppercase">Total Material Mass</span>
            <Scale className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-2xl font-extrabold text-[#0F172A]">
              ~{materialData.totalEstimatedMaterialMassGrams} g
            </span>
            <span className="text-[10px] font-mono text-[#64748B]">
              (Board: ~{materialData.boardMass?.massValue || 0}g)
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <span className="px-2 py-0.5 rounded bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
              Basis: {materialData.boardMass?.massSource || "ESTIMATED"}
            </span>
          </div>
        </div>

        {/* Card 2: Estimated Recoverable Mass */}
        <div className="p-5 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-mono font-semibold uppercase">Est. Recoverable Mass</span>
            <TrendingUp className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-2xl font-extrabold text-[#16A34A]">
              ~{scenarioData?.recoverableTotalMassGrams || materialData.totalRecoverableMaterialMassGrams} g
            </span>
            <span className="text-[10px] font-mono text-[#64748B]">
              ({Math.round((scenarioData?.averageRecoveryEfficiency || 0.85) * 100)}% Yield)
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <span className="px-2 py-0.5 rounded bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] uppercase font-semibold">
              Scenario: {activeScenario}
            </span>
          </div>
        </div>

        {/* Card 3: Data Completeness */}
        <div className="p-5 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-mono font-semibold uppercase">Data Completeness</span>
            <Percent className="w-4 h-4 text-[#B88900]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-2xl font-extrabold text-[#0F172A]">
              {materialData.dataCompleteness?.percentage || 68}%
            </span>
            <span className="text-[10px] font-mono text-[#64748B]">
              ({materialData.dataCompleteness?.availableInputs?.length || 3} inputs available)
            </span>
          </div>
          <div className="w-full bg-[#F1F5F9] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#B88900] h-1.5 rounded-full"
              style={{ width: `${materialData.dataCompleteness?.percentage || 68}%` }}
            />
          </div>
        </div>

        {/* Card 4: Confidence Level */}
        <div className="p-5 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-mono font-semibold uppercase">Confidence Level</span>
            <Sparkles className="w-4 h-4 text-[#7C3AED]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`font-heading text-2xl font-extrabold ${
                materialData.confidence?.level === "HIGH"
                  ? "text-[#16A34A]"
                  : materialData.confidence?.level === "LOW"
                  ? "text-[#DC2626]"
                  : "text-[#B88900]"
              }`}
            >
              {materialData.confidence?.level || "MEDIUM"}
            </span>
            <span className="text-[10px] font-mono text-[#64748B]">
              Score: {Math.round((materialData.confidence?.score || 0.8) * 100)}%
            </span>
          </div>
          <div className="text-[10px] font-mono text-[#64748B]">
            Components: {Math.round((materialData.confidence?.factors?.componentDetectionConfidence || 0.85) * 100)}% · DB: 88%
          </div>
        </div>
      </div>

      {/* ─── 2. RECOVERY SCENARIO SELECTOR ─────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
          <div>
            <h3 className="font-heading text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#2563EB]" />
              Industrial Recovery Scenarios
            </h3>
            <span className="text-[11px] text-[#64748B]">
              Select processing route to inspect estimated chemical recovery yields.
            </span>
          </div>

          <div className="flex items-center p-1 bg-[#F1F5F9] rounded-2xl border border-[#E2E8F0]">
            {(["conservative", "typical", "optimistic"] as const).map((sc) => (
              <button
                key={sc}
                onClick={() => setActiveScenario(sc)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold capitalize transition-all ${
                  activeScenario === sc
                    ? "bg-white text-[#0F172A] shadow-sm font-bold"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {sc}
              </button>
            ))}
          </div>
        </div>

        {scenarioData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[10px] font-mono text-[#64748B] uppercase block">Process Assumption</span>
              <p className="text-[#0F172A] font-medium leading-relaxed">{scenarioData.description}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[10px] font-mono text-[#64748B] uppercase block">Operational Parameter</span>
              <p className="text-[#0F172A] font-medium leading-relaxed">{scenarioData.assumption}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[10px] font-mono text-[#64748B] uppercase block">Precious Recovery (Scenario)</span>
              <div className="text-[11px] font-mono text-[#0F172A] space-y-0.5">
                <div>Au: <strong className="text-[#B88900]">{scenarioData.recoverablePreciousMetalsMg.gold} mg</strong></div>
                <div>Ag: <strong className="text-[#64748B]">{scenarioData.recoverablePreciousMetalsMg.silver} mg</strong></div>
                <div>Pd: <strong className="text-[#2563EB]">{scenarioData.recoverablePreciousMetalsMg.palladium} mg</strong></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 3. DEDICATED PRECIOUS METALS TABLE ─────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden space-y-0">
        <div className="p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-heading text-base font-bold text-[#0F172A] flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#B88900]" />
              Precious Metal Presence & Yield Breakdown
            </h3>
            <p className="text-xs text-[#64748B]">
              Physical estimation in milligrams (mg). All figures represent database-derived ranges.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#64748B] self-start sm:self-auto">
            London Bullion Market (LBMA) Reference Rates
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-6">Metal</th>
                <th className="py-3.5 px-4">Presence Status</th>
                <th className="py-3.5 px-4">Estimated Range</th>
                <th className="py-3.5 px-4">Recoverable ({activeScenario})</th>
                <th className="py-3.5 px-4">Contributing Sources</th>
                <th className="py-3.5 px-4">Confidence</th>
                <th className="py-3.5 px-6 text-right">Indicative Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {(materialData.preciousMetals || []).map((pm: any) => {
                const isDetected = pm.presence === "DETECTED_ESTIMATED" || pm.presence === "PROBABLE";
                return (
                  <tr key={pm.symbol} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-4 px-6 font-bold text-[#0F172A]">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            pm.symbol === "Au"
                              ? "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                              : pm.symbol === "Ag"
                              ? "bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]"
                              : pm.symbol === "Pd"
                              ? "bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]"
                              : "bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF]"
                          }`}
                        >
                          {pm.symbol}
                        </div>
                        <div>
                          <div className="font-heading text-sm font-bold">{pm.metal}</div>
                          <span className="text-[10px] text-[#64748B]">Atomic #{pm.symbol === "Au" ? 79 : pm.symbol === "Ag" ? 47 : pm.symbol === "Pd" ? 46 : 78}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {isDetected ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                          <CheckCircle2 className="w-3 h-3" />
                          Detected / Estimated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                          Insufficient Evidence
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      {isDetected ? (
                        <div>
                          <strong className="text-[#0F172A] text-sm">~{pm.estimatedMassMg} mg</strong>
                          <span className="text-[10px] text-[#64748B] block">[{pm.minMassMg} - {pm.maxMassMg} mg]</span>
                        </div>
                      ) : (
                        <span className="text-[#64748B]">—</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      {isDetected ? (
                        <div>
                          <strong className="text-[#16A34A] text-sm">
                            ~{activeScenario === "conservative"
                              ? scenarioData?.recoverablePreciousMetalsMg?.[pm.metal.toLowerCase()] || pm.recoverableMassMg
                              : activeScenario === "optimistic"
                              ? scenarioData?.recoverablePreciousMetalsMg?.[pm.metal.toLowerCase()] || pm.recoverableMassMg
                              : pm.recoverableMassMg} mg
                          </strong>
                          <span className="text-[10px] text-[#64748B] block">
                            @{Math.round((pm.typicalRecoveryRate || 0.85) * 100)}% recovery
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#64748B]">—</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-[11px] text-[#475569] max-w-xs">
                      {pm.contributingComponentCount > 0 ? (
                        <span>{pm.contributingComponentCount} components (Connectors / ICs)</span>
                      ) : (
                        <span>No visual candidates</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <span className="text-[#0F172A] font-semibold">{Math.round((pm.confidence || 0.8) * 100)}%</span>
                      <span className="text-[10px] text-[#64748B] block">{pm.evidenceLevel || "DATABASE_DERIVED"}</span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      {pm.indicativeEstimatedValueUSD ? (
                        <div>
                          <strong className="text-[#B88900] text-sm">
                            ₹{Math.round(pm.indicativeEstimatedValueUSD * 86.5).toLocaleString("en-IN")}
                          </strong>
                          <span className="text-[10px] text-[#64748B] block">
                            ~${pm.indicativeEstimatedValueUSD} USD (Indicative)
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#64748B]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 4. BASE METALS & CRITICAL MATERIALS ───────────────────── */}
      <div className="space-y-4">
        <h3 className="font-heading text-base font-bold text-[#0F172A] flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#2563EB]" />
          Base Metals & Critical Materials
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(materialData.baseMetals || []).concat(materialData.criticalMaterials || []).map((m: any) => (
            <div
              key={m.material}
              className="p-5 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                    {m.symbol}
                  </div>
                  <div>
                    <h4 className="font-heading text-sm font-bold text-[#0F172A]">{m.material}</h4>
                    <span className="text-[10px] font-mono text-[#64748B]">
                      {m.category === "CRITICAL_MATERIAL" ? "Critical Raw Material (CRM)" : "Base Engineering Metal"}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                  {m.evidenceLevel || "DATABASE_DERIVED"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block">EST. PRESENT</span>
                  <strong className="text-sm text-[#0F172A]">~{m.estimatedMassGrams} g</strong>
                  <span className="text-[9px] text-[#64748B] block">[{m.minMassGrams} - {m.maxMassGrams}g]</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block">RECOVERABLE</span>
                  <strong className="text-sm text-[#16A34A]">~{m.recoverableMassGrams} g</strong>
                  <span className="text-[9px] text-[#64748B] block">Confidence: {Math.round((m.confidence || 0.85) * 100)}%</span>
                </div>
              </div>

              {m.primarySources && m.primarySources.length > 0 && (
                <div className="text-[10px] font-mono text-[#64748B] pt-1">
                  <strong>Sources:</strong> {m.primarySources.slice(0, 2).join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── 5. COMPONENT CONTRIBUTION & CIRCULAR PRIORITIZATION ───── */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden space-y-0">
        <div className="p-6 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-heading text-base font-bold text-[#0F172A] flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#7C3AED]" />
              Component Material Contribution & Recovery Priority
            </h3>
            <p className="text-xs text-[#64748B]">
              Identify high-value electronic components for selective disassembly or hydrometallurgical harvesting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search components..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-[#E2E8F0] text-xs font-mono focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="flex items-center p-1 bg-[#F1F5F9] rounded-2xl border border-[#E2E8F0] text-xs font-mono">
              <button
                onClick={() => setComponentFilter("all")}
                className={`px-2.5 py-1 rounded-xl capitalize font-semibold transition-all ${
                  componentFilter === "all" ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setComponentFilter("high")}
                className={`px-2.5 py-1 rounded-xl capitalize font-semibold transition-all ${
                  componentFilter === "high" ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]"
                }`}
              >
                High Priority
              </button>
              <button
                onClick={() => setComponentFilter("precious")}
                className={`px-2.5 py-1 rounded-xl capitalize font-semibold transition-all ${
                  componentFilter === "precious" ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]"
                }`}
              >
                Precious
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px] sticky top-0 z-10">
              <tr>
                <th className="py-3 px-6">Component ID</th>
                <th className="py-3 px-4">Component Type</th>
                <th className="py-3 px-4">Est. Mass</th>
                <th className="py-3 px-4">Primary Recoverable</th>
                <th className="py-3 px-4">Recovery Priority</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredComponents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#64748B]">
                    No matching component contributions found.
                  </td>
                </tr>
              ) : (
                filteredComponents.map((comp: any) => (
                  <tr
                    key={comp.componentId}
                    onClick={() => {
                      setActiveComponentDetail(comp);
                      if (onSelectComponent) onSelectComponent(comp);
                    }}
                    className={`hover:bg-[#F1F5F9] cursor-pointer transition-colors ${
                      activeComponentDetail?.componentId === comp.componentId ? "bg-[#EFF6FF]" : ""
                    }`}
                  >
                    <td className="py-3.5 px-6 font-bold text-[#0F172A]">
                      {comp.componentId}
                    </td>
                    <td className="py-3.5 px-4 text-[#475569]">
                      <div>{comp.componentType}</div>
                      <span className="text-[10px] text-[#94A3B8]">{comp.packageName || "SMD"}</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#0F172A]">
                      ~{comp.estimatedMassGrams} g
                    </td>
                    <td className="py-3.5 px-4 text-[#0F172A]">
                      {comp.primaryRecoverableMetal || "Copper"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          comp.recoveryPriority === "HIGH"
                            ? "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                            : comp.recoveryPriority === "MEDIUM"
                            ? "bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]"
                            : "bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]"
                        }`}
                      >
                        {comp.recoveryPriority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#475569]">
                      {Math.round((comp.confidence || 0.85) * 100)}%
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveComponentDetail(comp);
                          if (onSelectComponent) onSelectComponent(comp);
                        }}
                        className="text-[#2563EB] hover:underline font-semibold text-[11px]"
                      >
                        View &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 6. COMPONENT DETAIL MODAL / DRAWER ─────────────────────── */}
      {activeComponentDetail && (
        <div className="p-6 rounded-3xl bg-white border-2 border-[#2563EB] shadow-lg space-y-4 transition-all">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-heading text-base font-bold text-[#0F172A]">
                  Component Material Intelligence: {activeComponentDetail.componentId}
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EFF6FF] text-[#2563EB]">
                  {activeComponentDetail.recoveryPriority} PRIORITY
                </span>
              </div>
              <span className="text-xs text-[#64748B]">
                {activeComponentDetail.componentType} · Package: {activeComponentDetail.packageName || "SMD"}
              </span>
            </div>

            <button
              onClick={() => setActiveComponentDetail(null)}
              className="p-1 rounded-xl text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] block">ESTIMATED MASS</span>
              <strong className="text-[#0F172A] text-sm">~{activeComponentDetail.estimatedMassGrams} g</strong>
            </div>
            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] block">PRIMARY METAL</span>
              <strong className="text-[#2563EB] text-sm">{activeComponentDetail.primaryRecoverableMetal || "Copper"}</strong>
            </div>
            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] block">CONFIDENCE</span>
              <strong className="text-[#16A34A] text-sm">{Math.round((activeComponentDetail.confidence || 0.85) * 100)}%</strong>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold text-[#0F172A] uppercase block">
              Estimated Elemental Fractions:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {(activeComponentDetail.materials || []).map((m: any) => (
                <div key={m.material} className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono">
                  <div className="flex items-center justify-between text-[#0F172A] font-bold">
                    <span>{m.material} ({m.symbol})</span>
                    <span className="text-[10px] text-[#64748B]">{Math.round(m.massFractionTypical * 1000) / 10}%</span>
                  </div>
                  <div className="text-[10px] text-[#64748B] mt-1">
                    Mass: ~{m.estimatedMassGrams}g · Rec: ~{m.recoverableMassGrams}g
                  </div>
                </div>
              ))}
            </div>
          </div>

          {activeComponentDetail.notes && (
            <div className="text-xs text-[#64748B] font-mono bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
              <strong>Recycling Directive:</strong> {activeComponentDetail.notes}
            </div>
          )}
        </div>
      )}

      {/* ─── 7. DATA QUALITY & TRANSPARENCY PANEL ──────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Available Inputs vs Missing Inputs */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 space-y-3">
          <h4 className="font-heading text-sm font-bold text-[#0F172A] flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-[#2563EB]" />
            Data Quality & Provenance Meter
          </h4>
          <p className="text-xs text-[#64748B]">
            Transparent audit of available hardware evidence vs data gaps.
          </p>

          <div className="space-y-3 text-xs font-mono pt-2">
            <div>
              <span className="text-[10px] text-[#16A34A] uppercase font-bold block mb-1">
                &check; Available Inputs:
              </span>
              <ul className="space-y-1">
                {(materialData.dataCompleteness?.availableInputs || []).map((input: string) => (
                  <li key={input} className="flex items-center gap-1.5 text-[#334155]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                    {input}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="text-[10px] text-[#DC2626] uppercase font-bold block mb-1">
                &times; Missing / Unconfirmed Inputs:
              </span>
              <ul className="space-y-1">
                {(materialData.dataCompleteness?.missingInputs || []).map((missing: string) => (
                  <li key={missing} className="flex items-center gap-1.5 text-[#64748B]">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center text-[10px] font-bold">
                      !
                    </span>
                    {missing}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Scientific Limitations & Literature Attributions */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 space-y-3">
          <h4 className="font-heading text-sm font-bold text-[#0F172A] flex items-center gap-2">
            <Database className="w-4 h-4 text-[#7C3AED]" />
            Evidence Sources & Methodological Limitations
          </h4>
          <p className="text-xs text-[#64748B]">
            All estimations are benchmarked against documented metallurgical literature.
          </p>

          <div className="space-y-2 text-xs font-mono pt-2">
            <span className="text-[10px] text-[#64748B] uppercase font-bold block">
              Peer-Reviewed Literature References:
            </span>
            <ul className="space-y-1.5 text-[11px] text-[#475569]">
              {(materialData.materialSources || []).slice(0, 3).map((src: any) => (
                <li key={src.material} className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <strong className="text-[#0F172A]">{src.material}:</strong> {src.reference}
                </li>
              ))}
            </ul>

            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[10px] text-[#991B1B] leading-relaxed mt-2">
              <strong>Limitations:</strong> {materialData.limitations?.[0] || "No direct physical assay was performed on this specific PCB."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
