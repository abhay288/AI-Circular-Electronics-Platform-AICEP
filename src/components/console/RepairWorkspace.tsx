"use client";

import React, { useState, useEffect } from "react";
import {
  Wrench,
  Cpu,
  Layers,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  FileText,
  Sliders,
  Play,
  RotateCcw,
  Zap,
  Info,
  ChevronRight,
  Eye,
  Hammer,
} from "lucide-react";
import {
  IComponentRepairAssessment,
  IRepairRecommendation,
  ICircularityDecision,
  IDecisionMatrixOption,
  RecommendationStatus,
} from "@/lib/repair/repairTaxonomy";

export interface RepairWorkspaceProps {
  analysisId: string;
  initialSessionData?: any;
  onSelectComponent?: (comp: any) => void;
  selectedComponent?: any;
}

export default function RepairWorkspace({
  analysisId,
  initialSessionData,
  onSelectComponent,
  selectedComponent,
}: RepairWorkspaceProps) {
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedCompAssessment, setSelectedCompAssessment] =
    useState<IComponentRepairAssessment | null>(null);

  // Action Modals
  const [activeRecommendation, setActiveRecommendation] =
    useState<IRepairRecommendation | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);

  // Completion Form State
  const [technicianId, setTechnicianId] = useState("TECH-882");
  const [repairNotes, setRepairNotes] = useState("");
  const [replacementPart, setReplacementPart] = useState("");
  const [functionalTest, setFunctionalTest] = useState<"PASS" | "FAIL" | "NOT_PERFORMED">("PASS");
  const [afterHealthScore, setAfterHealthScore] = useState<number>(85);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Reject Form State
  const [rejectionReason, setRejectionReason] = useState("");

  // Simulation State
  const [simTargetCompId, setSimTargetCompId] = useState<string>("");
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Fetch Repair Assessment
  const fetchAssessment = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/repair/${analysisId}`);
      if (!res.ok) {
        throw new Error(`Failed to load repair assessment (HTTP ${res.status})`);
      }
      const data = await res.json();
      setAssessment(data.assessment);
      if (data.assessment?.componentAssessments?.length > 0 && !selectedCompAssessment) {
        setSelectedCompAssessment(data.assessment.componentAssessments[0]);
        setSimTargetCompId(data.assessment.componentAssessments[0].componentId);
      }
    } catch (err: any) {
      console.error("[RepairWorkspace] Fetch error:", err);
      setError(err.message || "Failed to load repair assessment data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (analysisId) {
      fetchAssessment();
    }
  }, [analysisId]);

  // Sync when selectedComponent from parent changes
  useEffect(() => {
    if (selectedComponent && assessment?.componentAssessments) {
      const match = assessment.componentAssessments.find(
        (c: any) =>
          c.componentId.toLowerCase() === (selectedComponent.id || "").toLowerCase() ||
          c.componentName.toLowerCase() === (selectedComponent.name || "").toLowerCase()
      );
      if (match) {
        setSelectedCompAssessment(match);
        setSimTargetCompId(match.componentId);
      }
    }
  }, [selectedComponent, assessment]);

  // Handle Approve
  const handleApprove = async (rec: IRepairRecommendation) => {
    try {
      setSubmittingAction(true);
      const res = await fetch(
        `/api/repair/${analysisId}/recommendations/${rec.recommendationId}/approve`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Approval failed");
      setActionSuccessMsg(`Recommendation ${rec.recommendationId} approved.`);
      await fetchAssessment();
    } catch (e: any) {
      alert(`Error approving recommendation: ${e.message}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Start
  const handleStart = async (rec: IRepairRecommendation) => {
    try {
      setSubmittingAction(true);
      const res = await fetch(
        `/api/repair/${analysisId}/recommendations/${rec.recommendationId}/start`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Start action failed");
      setActionSuccessMsg(`Repair ${rec.recommendationId} is now in progress.`);
      await fetchAssessment();
    } catch (e: any) {
      alert(`Error starting repair: ${e.message}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Complete Submission
  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecommendation) return;

    try {
      setSubmittingAction(true);
      const res = await fetch(
        `/api/repair/${analysisId}/recommendations/${activeRecommendation.recommendationId}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            technicianId,
            notes: repairNotes,
            replacementPartNumber: replacementPart || undefined,
            functionalTestResult: functionalTest,
            beforeHealth: selectedCompAssessment?.healthScore || 58,
            afterHealth: functionalTest === "PASS" ? afterHealthScore : undefined,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Completion failed");

      setActionSuccessMsg(
        functionalTest === "PASS"
          ? `Repair marked COMPLETED. Digital Product Passport updated with lifecycle event.`
          : `Functional test failed. Status updated to CANCELLED/FAILED without claiming improved health.`
      );
      setShowCompleteModal(false);
      setRepairNotes("");
      await fetchAssessment();
    } catch (err: any) {
      alert(`Failed to complete repair: ${err.message}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Reject Submission
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecommendation) return;

    try {
      setSubmittingAction(true);
      const res = await fetch(
        `/api/repair/${analysisId}/recommendations/${activeRecommendation.recommendationId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );
      if (!res.ok) throw new Error("Rejection failed");
      setActionSuccessMsg(`Recommendation ${activeRecommendation.recommendationId} rejected.`);
      setShowRejectModal(false);
      setRejectionReason("");
      await fetchAssessment();
    } catch (err: any) {
      alert(`Failed to reject recommendation: ${err.message}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Run What-If Simulation
  const handleRunSimulation = async () => {
    if (!simTargetCompId) return;
    try {
      setSimulating(true);
      const res = await fetch(`/api/repair/${analysisId}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentId: simTargetCompId,
          action: "REPLACE_COMPONENT",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Simulation failed");
      setSimResult(data);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-[#E2E8F0] space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-[#2563EB] mx-auto" />
        <p className="text-xs font-mono text-[#64748B]">
          Evaluating PCB repairability, circularity decision matrix & component degradation models...
        </p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="p-8 bg-red-50 rounded-3xl border border-red-200 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
        <h4 className="font-heading text-base font-bold text-red-900">
          Repair Assessment Unavailable
        </h4>
        <p className="text-xs text-red-700">{error || "No repair assessment found."}</p>
        <button
          onClick={fetchAssessment}
          className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-mono font-bold"
        >
          Retry Assessment
        </button>
      </div>
    );
  }

  const decision: ICircularityDecision = assessment.circularityDecision || {
    recommendedPath: assessment.overallRecommendation || "REPAIR",
    alternativePaths: ["REFURBISH", "REUSE"],
    decisionConfidence: 0.9,
    decisionScore: assessment.decisionScore || 85,
    decisionFactors: {
      repairability: 85,
      health: 80,
      rul: 75,
      damageSeverity: 20,
      componentAvailability: 90,
      materialRecoveryPotential: 70,
      reusability: 80,
    },
    reason: "Board-level anomalies appear localized and repairable.",
  };

  const recommendations: IRepairRecommendation[] = assessment.repairRecommendations || [];
  const components: IComponentRepairAssessment[] = assessment.componentAssessments || [];
  const matrix: IDecisionMatrixOption[] = assessment.decisionMatrix || [];

  const filteredRecommendations = recommendations.filter((r) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "CRITICAL") return r.priority === "CRITICAL" || r.priority === "HIGH";
    return r.status.toUpperCase() === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* ─── SUCCESS NOTIFICATION BANNER ────────────────────────── */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-mono text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── SCIENTIFIC DISCLAIMER BANNER ────────────────────────── */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold font-mono uppercase tracking-wider text-[10px] text-amber-700">
            SCIENTIFIC TRANSPARENCY NOTICE · DECISION SUPPORT SYSTEM
          </span>
          <p className="leading-relaxed">
            AI repair recommendations are decision-support outputs based on optical telemetry and
            parametric degradation models. The engine distinguishes <strong>OBSERVED</strong>{" "}
            anomalies from <strong>PREDICTED</strong> life metrics. Recommendations remain advisory
            until physical diagnostic measurements and functional testing are verified by a qualified
            technician.
          </p>
        </div>
      </div>

      {/* ─── TOP HEADER & ACTIONS ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]">
              {assessment.provider === "MOCK"
                ? "DEMO BENCHMARK DATASET"
                : "RULE-BASED CIRCULARITY ENGINE"}
            </span>
            <span className="text-[10px] font-mono text-[#64748B]">
              Model Version: {assessment.modelVersion || "1.0.0"}
            </span>
          </div>
          <h2 className="font-heading text-2xl font-extrabold text-[#0F172A] mt-1">
            AI Repair Intelligence & Circularity Decision Engine
          </h2>
          <p className="text-xs text-[#64748B]">
            Automated repairability classification, trace & component fault isolation, and life-extension routing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSimulateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>What-If Simulator</span>
          </button>
          <button
            onClick={fetchAssessment}
            className="p-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-xs font-mono transition-colors cursor-pointer"
            title="Refresh Assessment"
          >
            <RefreshCw className="w-4 h-4 text-[#64748B]" />
          </button>
        </div>
      </div>

      {/* ─── 1. OVERALL CIRCULARITY DECISION CARD ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#2563EB] uppercase tracking-wider">
                OVERALL ASSET RECOMMENDATION
              </span>
              <div className="flex items-center gap-3 mt-1">
                <span className="font-heading text-3xl font-extrabold text-[#0F172A]">
                  {decision.recommendedPath}
                </span>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  {Math.round((decision.decisionConfidence || 0.9) * 100)}% Decision Confidence
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-mono text-[#64748B] block">
                CIRCULARITY DECISION SCORE
              </span>
              <span className="font-heading text-3xl font-extrabold text-[#2563EB]">
                {assessment.decisionScore || 85}
                <span className="text-sm font-normal text-[#64748B]"> / 100</span>
              </span>
            </div>
          </div>

          <p className="text-xs text-[#334155] leading-relaxed">
            <strong>Diagnostic Rationale:</strong> {decision.reason}
          </p>

          {/* Decision Factors Multi-bar */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono font-bold text-[#0F172A] uppercase">
              Scoring Factors Breakdown (0–100 Scale)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[10px] text-[#64748B] block">Repairability</span>
                <strong className="text-[#0F172A]">{decision.decisionFactors?.repairability}%</strong>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[10px] text-[#64748B] block">Health Index</span>
                <strong className="text-[#16A34A]">{decision.decisionFactors?.health}%</strong>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[10px] text-[#64748B] block">Availability</span>
                <strong className="text-[#2563EB]">{decision.decisionFactors?.componentAvailability}%</strong>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[10px] text-[#64748B] block">Material Value</span>
                <strong className="text-[#B45309]">{decision.decisionFactors?.materialRecoveryPotential}%</strong>
              </div>
            </div>
          </div>

          {/* Technical & Environmental Context */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E2E8F0] text-xs">
            {decision.environmentalConsiderations && (
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1">
                <span className="font-bold text-emerald-800 font-mono text-[10px] uppercase">
                  Environmental Consideration
                </span>
                <p className="text-emerald-950 text-[11px]">{decision.environmentalConsiderations}</p>
              </div>
            )}
            {decision.technicalConsiderations && (
              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1">
                <span className="font-bold text-blue-800 font-mono text-[10px] uppercase">
                  Technical Feasibility
                </span>
                <p className="text-blue-950 text-[11px]">{decision.technicalConsiderations}</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── CIRCULARITY MATRIX SIDEBAR ────────────────────────── */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-wider">
              CIRCULARITY PATHS COMPARISON
            </span>
            <h4 className="font-heading text-base font-bold text-[#0F172A] mt-0.5">
              Decision Support Matrix
            </h4>
          </div>

          <div className="space-y-2">
            {matrix.map((opt, i) => {
              const isRecommended = opt.option === decision.recommendedPath;
              return (
                <div
                  key={i}
                  className={`p-3 rounded-2xl border text-xs transition-all ${
                    isRecommended
                      ? "bg-[#EFF6FF] border-[#BFDBFE] ring-1 ring-[#2563EB]/20"
                      : "bg-[#F8FAFC] border-[#E2E8F0]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold ${isRecommended ? "text-[#2563EB]" : "text-[#0F172A]"}`}>
                        {opt.option}
                      </span>
                      {isRecommended && (
                        <span className="text-[9px] font-mono px-2 py-0.2 rounded-full bg-[#2563EB] text-white font-bold">
                          PREFERRED
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-xs text-[#0F172A]">
                      {opt.score} pts
                    </span>
                  </div>
                  {opt.supportingFactors?.length > 0 && (
                    <p className="text-[11px] text-[#64748B] mt-1 line-clamp-1">
                      {opt.supportingFactors.join(" · ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── 2. REPAIR RECOMMENDATIONS TABLE ──────────────────────── */}
      <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div>
            <h3 className="font-heading text-lg font-bold text-[#0F172A]">
              Actionable Repair Recommendations ({recommendations.length})
            </h3>
            <p className="text-xs text-[#64748B]">
              Governed workflow: Recommended → Approved → In Progress → Verified Complete.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-mono">
            {["ALL", "CRITICAL", "RECOMMENDED", "APPROVED", "IN_PROGRESS", "COMPLETED"].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1 rounded-xl transition-colors cursor-pointer ${
                  statusFilter === f
                    ? "bg-[#0F172A] text-white font-bold"
                    : "bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filteredRecommendations.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-[#64748B]">
            No recommendations match filter &quot;{statusFilter}&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E2E8F0] text-[10px] font-mono text-[#64748B] uppercase">
                <tr>
                  <th className="py-3 px-3">Component</th>
                  <th className="py-3 px-3">Recommended Action</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Confidence</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Workflow Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] font-mono">
                {filteredRecommendations.map((rec) => {
                  const statusColors: Record<string, string> = {
                    RECOMMENDED: "bg-blue-50 text-blue-700 border-blue-200",
                    APPROVED: "bg-amber-50 text-amber-700 border-amber-200",
                    IN_PROGRESS: "bg-purple-50 text-purple-700 border-purple-200",
                    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    REJECTED: "bg-red-50 text-red-700 border-red-200",
                    CANCELLED: "bg-gray-50 text-gray-700 border-gray-200",
                  };

                  return (
                    <tr
                      key={rec.recommendationId}
                      className="hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                      onClick={() => {
                        const comp = components.find((c) => c.componentId === rec.componentId);
                        if (comp) {
                          setSelectedCompAssessment(comp);
                          setSimTargetCompId(comp.componentId);
                          if (onSelectComponent) onSelectComponent(comp);
                        }
                      }}
                    >
                      <td className="py-3 px-3 font-bold text-[#0F172A]">
                        {rec.componentId || "Board Assembly"}
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#2563EB]">
                        {rec.action}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rec.priority === "CRITICAL"
                              ? "bg-red-100 text-red-800"
                              : rec.priority === "HIGH"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {rec.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#16A34A] font-bold">
                        {Math.round(rec.confidence * 100)}%
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            statusColors[rec.status] || "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td
                        className="py-3 px-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          {rec.status === "RECOMMENDED" && (
                            <>
                              <button
                                onClick={() => handleApprove(rec)}
                                disabled={submittingAction}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setActiveRecommendation(rec);
                                  setShowRejectModal(true);
                                }}
                                disabled={submittingAction}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {rec.status === "APPROVED" && (
                            <button
                              onClick={() => handleStart(rec)}
                              disabled={submittingAction}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Start Repair
                            </button>
                          )}
                          {rec.status === "IN_PROGRESS" && (
                            <button
                              onClick={() => {
                                setActiveRecommendation(rec);
                                setShowCompleteModal(true);
                              }}
                              disabled={submittingAction}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Record Completion
                            </button>
                          )}
                          {rec.status === "COMPLETED" && (
                            <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-bold">
                              <Check className="w-3.5 h-3.5" /> Done
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── 3. COMPONENT DETAIL & EVIDENCE DRAWER ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Component Repair Telemetry */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div>
              <span className="text-[10px] font-mono text-[#2563EB] font-bold uppercase tracking-wider">
                COMPONENT INSPECTION TELEMETRY
              </span>
              <h4 className="font-heading text-lg font-bold text-[#0F172A] mt-0.5">
                {selectedCompAssessment?.componentId || "Select a Component"}
              </h4>
            </div>

            {selectedCompAssessment && (
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] font-bold border border-blue-200">
                {selectedCompAssessment.repairability}
              </span>
            )}
          </div>

          {selectedCompAssessment ? (
            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block">Health Status</span>
                  <strong className="text-[#16A34A]">{selectedCompAssessment.healthStatus} ({selectedCompAssessment.healthScore}%)</strong>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block">Damage Severity</span>
                  <strong className="text-[#D97706]">{selectedCompAssessment.damageSeverity}</strong>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block">Estimated RUL</span>
                  <strong className="text-[#2563EB]">{selectedCompAssessment.rulHours?.toLocaleString() || 35000} hrs</strong>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <span className="font-bold text-[#0F172A] text-[11px] block uppercase">
                  Evidence & Rationale:
                </span>
                <p className="text-[#334155] leading-relaxed">
                  {selectedCompAssessment.reasoning}
                </p>
                {selectedCompAssessment.evidence?.length > 0 && (
                  <ul className="list-disc pl-4 space-y-1 text-[#64748B] text-[11px]">
                    {selectedCompAssessment.evidence.map((ev, idx) => (
                      <li key={idx}>{ev}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#64748B]">
                  Recommended Rework: <strong className="text-[#0F172A]">{selectedCompAssessment.recommendedAction}</strong>
                </span>
                <button
                  onClick={() => {
                    setSimTargetCompId(selectedCompAssessment.componentId);
                    setShowSimulateModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Simulate Rework</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#64748B] py-6 text-center">
              Click a component from the table above or the 3D viewer to inspect diagnostic telemetry.
            </p>
          )}
        </div>

        {/* Diagnostic Limitations & Provenance */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-4 text-xs font-mono">
          <div className="border-b border-[#E2E8F0] pb-3">
            <span className="text-[10px] font-mono text-[#64748B] font-bold uppercase tracking-wider">
              DATA PROVENANCE & LIMITATIONS
            </span>
            <h4 className="font-heading text-base font-bold text-[#0F172A] mt-0.5">
              Diagnostic Confidence
            </h4>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[#64748B] text-[10px] block">ENGINE CLASSIFICATION:</span>
              <p className="text-[#0F172A] font-bold">
                Level 2 Diagnostic (RGB Optical + Topology Netlist + Degradation Physics)
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[#64748B] text-[10px] block">SYSTEM LIMITATIONS:</span>
              <ul className="list-disc pl-4 space-y-1 text-[#64748B] text-[11px]">
                {(assessment.limitations || [
                  "Normal RGB imagery cannot determine internal silicon gate oxide breakdown.",
                  "Trace continuity is visually inferred from top copper layer contrast.",
                  "Functional electrical bench test required prior to redeployment.",
                ]).map((lim: string, idx: number) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL 1: COMPLETE REPAIR MODAL ───────────────────────── */}
      {showCompleteModal && activeRecommendation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#2563EB] font-bold uppercase tracking-wider">
                  PHYSICAL EXECUTION CONFIRMATION
                </span>
                <h3 className="font-heading text-lg font-bold text-[#0F172A]">
                  Complete Repair: {activeRecommendation.action}
                </h3>
              </div>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="p-1 rounded-lg text-[#64748B] hover:bg-[#F1F5F9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#64748B] mb-1">Technician Identifier:</label>
                <input
                  type="text"
                  value={technicianId}
                  onChange={(e) => setTechnicianId(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[#64748B] mb-1">Functional Test Result:</label>
                <select
                  value={functionalTest}
                  onChange={(e) => setFunctionalTest(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  <option value="PASS">PASS (Verified with bench measurement)</option>
                  <option value="FAIL">FAIL (Component/board did not pass verification)</option>
                  <option value="NOT_PERFORMED">NOT_PERFORMED (Rework done without test)</option>
                </select>
                {functionalTest === "FAIL" && (
                  <p className="text-[10px] text-red-600 mt-1">
                    Warning: Marking FAIL will log a failed repair event and will NOT increment health score or certify passport.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[#64748B] mb-1">Replacement Part Number (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. TPS5430DDAR / 0805-10uF-50V"
                  value={replacementPart}
                  onChange={(e) => setReplacementPart(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              {functionalTest === "PASS" && (
                <div>
                  <label className="block text-[#64748B] mb-1">
                    Post-Repair Health Score Estimate (0–100):
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={afterHealthScore}
                    onChange={(e) => setAfterHealthScore(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[#64748B] mb-1">Technician Rework Notes:</label>
                <textarea
                  rows={3}
                  placeholder="Describe bench observations, solder reflow temperature profile, resistance checks..."
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold transition-colors cursor-pointer"
                >
                  {submittingAction ? "Recording..." : "Record & Update Passport"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: REJECT REPAIR MODAL ─────────────────────────── */}
      {showRejectModal && activeRecommendation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-heading text-lg font-bold text-[#0F172A]">
                Reject Recommendation
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-1 rounded-lg text-[#64748B] hover:bg-[#F1F5F9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#64748B] mb-1">Rejection Rationale:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Component obsolete, repair cost exceeds board value, replacement part unavailable..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: WHAT-IF SIMULATOR MODAL ─────────────────────── */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#38BDF8] font-bold uppercase tracking-wider">
                  DIGITAL TWIN SIMULATION
                </span>
                <h3 className="font-heading text-lg font-bold text-[#0F172A]">
                  What-If Repair Simulator
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowSimulateModal(false);
                  setSimResult(null);
                }}
                className="p-1 rounded-lg text-[#64748B] hover:bg-[#F1F5F9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 text-[11px]">
                Simulate the hypothetical effect of replacing or reflowing a degraded component on overall board health and RUL without modifying the active database.
              </div>

              <div>
                <label className="block text-[#64748B] mb-1">Target Component:</label>
                <select
                  value={simTargetCompId}
                  onChange={(e) => setSimTargetCompId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#0F172A]"
                >
                  {components.map((c) => (
                    <option key={c.componentId} value={c.componentId}>
                      {c.componentId} ({c.componentName || c.componentType}) · Current Health: {c.healthScore}%
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleRunSimulation}
                disabled={simulating}
                className="w-full py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {simulating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 text-[#38BDF8]" />
                )}
                <span>Run Simulation Model</span>
              </button>

              {simResult && (
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 pt-3">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                    <span className="font-bold text-[#0F172A] text-[11px]">
                      Simulated Replacement Outcome
                    </span>
                    <span className="text-[10px] font-bold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      +{simResult.target?.simulatedCondition?.improvementDelta}% Comp Delta
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 bg-white rounded-xl border border-[#E2E8F0]">
                      <span className="text-[#64748B] block text-[10px]">Board Health</span>
                      <strong className="text-[#0F172A]">
                        {simResult.boardImpact?.currentHealthScore}% →{" "}
                        <span className="text-[#16A34A]">
                          {simResult.boardImpact?.simulatedHealthScore}%
                        </span>
                      </strong>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-[#E2E8F0]">
                      <span className="text-[#64748B] block text-[10px]">Board RUL</span>
                      <strong className="text-[#0F172A]">
                        {simResult.boardImpact?.currentRulYears} yrs →{" "}
                        <span className="text-[#2563EB]">
                          {simResult.boardImpact?.simulatedRulYears} yrs
                        </span>
                      </strong>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#64748B]">
                    {simResult.feasibility?.safetyNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
