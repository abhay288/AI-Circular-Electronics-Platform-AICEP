"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  ShoppingCart,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Layers,
  Activity,
  Coins,
  Wrench,
  Leaf,
  Calendar,
  Building,
  Hash,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useAnalysisSession } from "@/lib/context/AnalysisSessionContext";

export default function CompleteReportPage() {
  const { session, openMarketplaceListing, resetSession } = useAnalysisSession();

  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(session, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `EcoIntel_Report_${session.sessionId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadCsv = () => {
    const components = session.detectionResult?.components || [];
    const headers = ["Component", "Type", "Manufacturer", "Package", "Confidence", "HealthScore", "RUL_Years", "Material"];
    const rows = components.map((c: any) => [
      `"${c.name}"`,
      `"${c.type}"`,
      `"${c.manufacturer}"`,
      `"${c.package}"`,
      c.confidence,
      c.health,
      c.remainingLifeYears,
      `"${c.material || "Silicon/Copper"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", `EcoIntel_Inventory_${session.sessionId}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 py-10 px-4 sm:px-8 max-w-5xl mx-auto w-full space-y-8">
      
      {/* ─── ACTION BAR (HIDDEN IN PRINT) ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
          <span className="text-xs font-mono font-bold text-[#0F172A]">
            Report ID: {session.reportId || `REP-${session.sessionId}`}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] uppercase">
            {session.dataClassification}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrintPdf}
            className="px-3.5 py-1.5 rounded-xl border border-[#CBD5E1] text-xs font-mono font-semibold text-[#0F172A] hover:bg-[#F1F5F9] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="px-3.5 py-1.5 rounded-xl border border-[#CBD5E1] text-xs font-mono font-semibold text-[#0F172A] hover:bg-[#F1F5F9] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Download JSON</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="px-3.5 py-1.5 rounded-xl border border-[#CBD5E1] text-xs font-mono font-semibold text-[#0F172A] hover:bg-[#F1F5F9] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={() => openMarketplaceListing()}
            className="px-4 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>List on Marketplace</span>
          </button>
        </div>
      </div>

      {/* ─── PRINTABLE HARDWARE INTELLIGENCE REPORT ──────────────── */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-8 sm:p-12 space-y-10 text-[#0F172A]">
        
        {/* Document Header */}
        <div className="border-b border-[#E2E8F0] pb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white font-bold">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="font-heading text-lg font-bold text-[#0F172A] block leading-tight">
                  EcoIntel
                </span>
                <span className="text-[10px] font-mono text-[#2563EB] uppercase font-bold tracking-wider">
                  CIRCULAR HARDWARE INTELLIGENCE REPORT
                </span>
              </div>
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0F172A] pt-2">
              Comprehensive Hardware Lifecycle Audit
            </h1>
            <p className="text-xs text-[#64748B] max-w-xl leading-relaxed">
              Automated optical inspection, physics-informed health prediction, precious metal recovery yield, and circular action recommendation.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono space-y-1.5 min-w-[220px]">
            <div>Session: <strong>#{session.sessionId}</strong></div>
            <div>Date: <strong>{new Date().toISOString().split("T")[0]}</strong></div>
            <div>Classification: <strong className="text-[#2563EB] capitalize">{session.dataClassification}</strong></div>
            <div>Facility: <strong>EcoIntel Lab 01</strong></div>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#2563EB]">SECTION 01</span>
            <h2 className="font-heading text-lg font-bold text-[#0F172A]">
              1. Executive Summary
            </h2>
          </div>
          <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-[#64748B] block">Overall Health:</span>
              <span className="font-heading text-2xl font-bold text-[#16A34A]">
                {session.rulResult?.overallHealthScore || 92}%
              </span>
            </div>
            <div>
              <span className="text-[#64748B] block">Projected Lifespan:</span>
              <span className="font-heading text-2xl font-bold text-[#2563EB]">
                {session.rulResult?.predictedYears || 6.4} Yrs
              </span>
            </div>
            <div>
              <span className="text-[#64748B] block">Market Recovery:</span>
              <span className="font-heading text-2xl font-bold text-[#0F172A]">
                ${session.metalResult?.totalEstimatedMarketValueUSD?.toFixed(2) || "18.70"}
              </span>
            </div>
            <div>
              <span className="text-[#64748B] block">Recommended Action:</span>
              <span className="font-heading text-xl font-bold text-[#2563EB] uppercase">
                {session.repairResult?.recommendedAction || "Refurbish"}
              </span>
            </div>
          </div>
          <p className="text-xs text-[#475569] leading-relaxed">
            The target electronic hardware assembly exhibits Grade A+ physical integrity with minimal substrate delamination. 
            Microcontroller and passive decoupling stages display solid health indices, allowing circular reuse and high metal recovery efficiency.
          </p>
        </div>

        {/* Section 2: Device Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#2563EB]">SECTION 02</span>
            <h2 className="font-heading text-lg font-bold text-[#0F172A]">
              2. Device Information
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[10px]">DEVICE MODEL</span>
              <span className="font-bold text-[#0F172A]">{session.deviceName}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[10px]">CATEGORY</span>
              <span className="font-bold text-[#0F172A]">{session.deviceType}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[10px]">INGEST SOURCE</span>
              <span className="font-bold text-[#2563EB] capitalize">{session.sourceType} Scan</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[10px]">OPTICAL RESOLUTION</span>
              <span className="font-bold text-[#0F172A]">{session.imageQuality?.resolution || "2400x1600"}</span>
            </div>
          </div>
        </div>

        {/* Section 3 & 4: Component Inventory & Health */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#2563EB]">SECTION 03 & 04</span>
            <h2 className="font-heading text-lg font-bold text-[#0F172A]">
              3. Component Inventory & Physical Health
            </h2>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] text-[#64748B]">
                <tr>
                  <th className="py-2.5 px-3">Component Identifier</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Manufacturer</th>
                  <th className="py-2.5 px-3">Package</th>
                  <th className="py-2.5 px-3">AI Confidence</th>
                  <th className="py-2.5 px-3">Health Score</th>
                  <th className="py-2.5 px-3">RUL (Yrs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {(session.detectionResult?.components || []).slice(0, 8).map((comp: any) => (
                  <tr key={comp.id}>
                    <td className="py-2.5 px-3 font-bold text-[#0F172A]">{comp.name}</td>
                    <td className="py-2.5 px-3 text-[#475569]">{comp.type}</td>
                    <td className="py-2.5 px-3 text-[#64748B]">{comp.manufacturer}</td>
                    <td className="py-2.5 px-3 text-[#64748B]">{comp.package}</td>
                    <td className="py-2.5 px-3 text-[#16A34A]">{comp.confidence}%</td>
                    <td className="py-2.5 px-3 font-bold">{comp.health}%</td>
                    <td className="py-2.5 px-3 text-[#2563EB]">{comp.remainingLifeYears} Yrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5 & 6: PCB Analysis & Reconstruction */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#2563EB]">SECTION 05 & 06</span>
            <h2 className="font-heading text-lg font-bold text-[#0F172A]">
              5. PCB Topology & Generative CAD Reconstruction
            </h2>
          </div>
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div>Layer Count: <strong>{session.reconstructionResult?.layerCount || 8} Layers</strong></div>
            <div>Trace Integrity: <strong className="text-[#16A34A]">{session.reconstructionResult?.traceIntegrityPercent || 96.8}%</strong></div>
            <div>Repaired Traces: <strong>{session.reconstructionResult?.severedTracesRepaired || 3}</strong></div>
            <div>Model: <strong>GGNT-v1.0 Synthesis</strong></div>
          </div>
        </div>

        {/* Section 7: Remaining Useful Life (RUL) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#2563EB]">SECTION 07</span>
            <h2 className="font-heading text-lg font-bold text-[#0F172A]">
              7. Remaining Useful Life (RUL) Modeling
            </h2>
          </div>
          <p className="text-xs text-[#475569] leading-relaxed">
            Physics-informed mathematical projections based on an operating temperature envelope of {session.rulResult?.parameters?.operatingTempCelsius || 48}°C and {session.rulResult?.parameters?.operatingCycles || 3400} thermal cycles predict approximately <strong>{session.rulResult?.predictedYears || 6.4} operational years</strong> ({session.rulResult?.predictedHours?.toLocaleString() || "56,000"} hours) with a failure probability of {((session.rulResult?.failureProbability || 0.08) * 100).toFixed(1)}%.
          </p>
        </div>

        {/* Section 8: Precious Metal Estimation */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#2563EB]">SECTION 08</span>
            <h2 className="font-heading text-lg font-bold text-[#0F172A]">
              8. Precious Metal Yield & Urban Mining Valuation
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            {(session.metalResult?.yields || []).map((m: any) => (
              <div key={m.symbol} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px]">{m.metal}</span>
                <span className="font-bold text-[#0F172A] block">{m.yieldGrams} grams</span>
                <span className="text-[10px] text-[#16A34A]">${m.estimatedValueUSD.toFixed(2)} USD</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 9: Repair Recommendations */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#2563EB]">SECTION 09</span>
            <h2 className="font-heading text-lg font-bold text-[#0F172A]">
              9. Diagnostic Repair Recommendations
            </h2>
          </div>
          <div className="space-y-2">
            {(session.repairResult?.issues || []).map((issue: any, i: number) => (
              <div key={i} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="font-bold text-[#0F172A]">{issue.component}:</span>
                  <span className="text-[#64748B] ml-2">{issue.issue}</span>
                </div>
                <span className="px-3 py-1 rounded bg-white border border-[#CBD5E1] text-[#2563EB] font-bold">
                  {issue.recommendation}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 10: Digital Product Passport */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#2563EB]">SECTION 10</span>
            <h2 className="font-heading text-lg font-bold text-[#0F172A]">
              10. Digital Product Passport Integration
            </h2>
          </div>
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono">
            <div>
              <p>Passport Identifier: <strong>{session.passportId || "ECO-PASSPORT-2026-8941"}</strong></p>
              <p className="text-[#64748B] mt-0.5">Network: Polygon POS · Contract ERC-721</p>
            </div>
            <Link
              href="/console/passport"
              className="px-4 py-2 rounded-xl bg-[#0F172A] text-white font-semibold flex items-center gap-1.5 self-start sm:self-auto"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Inspect On-Chain Credentials</span>
            </Link>
          </div>
        </div>

        {/* Section 11: Carbon Impact */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#2563EB]">SECTION 11</span>
            <h2 className="font-heading text-lg font-bold text-[#0F172A]">
              11. Scope 3 Carbon & Resource Conservation
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7]">
              <span className="text-[#16A34A] block text-[10px]">CO₂ PREVENTED</span>
              <span className="font-bold text-[#16A34A] text-base">{session.carbonResult?.co2AvoidedKg || 34.6} kg</span>
            </div>
            <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]">
              <span className="text-[#2563EB] block text-[10px]">ENERGY SAVED</span>
              <span className="font-bold text-[#2563EB] text-base">{session.carbonResult?.energySavedKWh || 82.4} kWh</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block text-[10px]">WATER SAVED</span>
              <span className="font-bold text-[#0F172A] text-base">{session.carbonResult?.waterSavedLiters || 320} L</span>
            </div>
            <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE047]">
              <span className="text-[#B88900] block text-[10px]">LANDFILL DIVERTED</span>
              <span className="font-bold text-[#B88900] text-base">{session.carbonResult?.eWasteDivertedKg || 0.28} kg</span>
            </div>
          </div>
        </div>

        {/* Section 12: Circular Recommendation */}
        <div className="p-6 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[#2563EB] uppercase">
              SECTION 12 · FINAL CIRCULAR DETERMINATION
            </span>
            <span className="px-3 py-1 rounded-full bg-[#2563EB] text-white font-mono text-xs font-bold uppercase">
              Recommended: {session.repairResult?.recommendedAction || "Refurbish & Reuse"}
            </span>
          </div>
          <p className="text-xs text-[#0F172A] font-medium leading-relaxed">
            {session.executiveSummary?.recommendedAction ||
              "Refurbish VRM phase stages and redeploy into secondary computing fleet or list components on the EcoIntel circular marketplace."}
          </p>
        </div>

      </div>

      {/* ─── BOTTOM REPORT NAVIGATION ACTIONS ───────────────────── */}
      <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <Link
          href="/console/results"
          className="px-5 py-2.5 rounded-full border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-colors"
        >
          ← Return to 3D Results
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              resetSession();
              window.location.href = "/console";
            }}
            className="px-5 py-2.5 rounded-full border border-[#CBD5E1] text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9] flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start New Analysis</span>
          </button>

          <Link
            href="/console/passport"
            className="px-6 py-2.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-colors flex items-center gap-2"
          >
            <span>View Digital Passport</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

    </div>
  );
}
