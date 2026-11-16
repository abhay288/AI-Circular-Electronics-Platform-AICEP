"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Share2,
  Archive,
  RefreshCw,
  Plus,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
  Search,
  Filter,
} from "lucide-react";

export default function ReportsCatalogPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [generating, setGenerating] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState("");
  const [selectedReportType, setSelectedReportType] = useState("ASSET");
  const [selectedFormat, setSelectedFormat] = useState("PDF");
  const [shareSuccessUrl, setShareSuccessUrl] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?reportType=${filterType}`);
      const json = await res.json();
      if (json.success) {
        setReports(json.data.reports || []);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filterType]);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: selectedAnalysisId || undefined,
          reportType: selectedReportType,
          format: selectedFormat,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowGenModal(false);
        fetchReports();
      } else {
        alert(json.error?.message || "Failed to generate report");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleShareReport = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresInDays: 7 }),
      });
      const json = await res.json();
      if (json.success) {
        const fullUrl = `${window.location.origin}${json.data.shareUrl}`;
        setShareSuccessUrl(fullUrl);
        navigator.clipboard.writeText(fullUrl);
      }
    } catch (err: any) {
      alert("Share error: " + err.message);
    }
  };

  const handleArchiveReport = async (reportId: string) => {
    if (!confirm("Are you sure you want to archive this report?")) return;
    try {
      const res = await fetch(`/api/reports/${reportId}/archive`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        fetchReports();
      }
    } catch (err: any) {
      alert("Archive error: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Enterprise Audit & Dossiers
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
              Enterprise Reports Catalog
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Multi-dimensional technical, circularity, carbon, and executive dossiers with cryptographic provenance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowGenModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Generate Report
            </button>
            <button
              onClick={fetchReports}
              disabled={loading}
              className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-xl p-2 text-xs">
          <span className="text-slate-400 font-medium px-2 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Filter by Type:
          </span>
          {[
            { label: "All Dossiers", val: "all" },
            { label: "Asset Dossiers", val: "ASSET" },
            { label: "Technical PCB", val: "TECHNICAL" },
            { label: "Circularity & Repair", val: "CIRCULARITY" },
            { label: "Avoided Carbon / ESG", val: "ENVIRONMENTAL" },
            { label: "Executive Briefings", val: "EXECUTIVE" },
          ].map((f) => (
            <button
              key={f.val}
              onClick={() => setFilterType(f.val)}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                filterType === f.val
                  ? "bg-emerald-500 text-slate-950 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Share Link Banner */}
        {shareSuccessUrl && (
          <div className="bg-emerald-950/60 border border-emerald-800/80 rounded-xl p-4 flex items-center justify-between text-xs text-emerald-200">
            <div>
              <span className="font-semibold text-white">Secure Share Link Created & Copied:</span>{" "}
              <span className="font-mono text-emerald-300">{shareSuccessUrl}</span>
            </div>
            <button
              onClick={() => setShareSuccessUrl(null)}
              className="text-xs text-slate-400 hover:text-white underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Reports Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
            Loading enterprise report dossiers...
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-sm">
            No reports found matching this filter. Click &ldquo;Generate Report&rdquo; to create your first dossier.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div
                key={report.reportId}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                      {report.reportType} · v{report.version}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      report.status === "READY"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : report.status === "ARCHIVED"
                        ? "bg-slate-800 text-slate-500"
                        : "bg-amber-500/20 text-amber-400"
                    }`}>
                      {report.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white line-clamp-1">{report.title}</h3>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">ID: {report.reportId}</div>

                  {report.analysisId && (
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Analysis: <span className="font-mono text-slate-400">{report.analysisId}</span>
                    </div>
                  )}

                  {/* Completeness bar */}
                  {report.completeness && (
                    <div className="mt-4 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Audit Completeness Index</span>
                        <span className="font-semibold text-white">{report.completeness.overallPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full"
                          style={{ width: `${report.completeness.overallPercent}%` }}
                        ></div>
                      </div>
                      {report.completeness.missingSections?.length > 0 && (
                        <div className="text-[10px] text-amber-400 mt-1.5 line-clamp-1">
                          Missing: {report.completeness.missingSections.join(", ")}
                        </div>
                      )}
                    </div>
                  )}

                  {report.isDemo && (
                    <div className="mt-2 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                      DEMO DATASET — BENCHMARK SPECIFICATION
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`/api/reports/${report.reportId}/download?format=PDF`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-medium inline-flex items-center gap-1 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      PDF
                    </a>
                    <a
                      href={`/api/reports/${report.reportId}/download?format=JSON`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium inline-flex items-center gap-1 transition-colors"
                      title="Download JSON"
                    >
                      JSON
                    </a>
                    <a
                      href={`/api/reports/${report.reportId}/download?format=CSV`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium inline-flex items-center gap-1 transition-colors"
                      title="Download CSV"
                    >
                      CSV
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleShareReport(report.reportId)}
                      className="p-1.5 text-slate-400 hover:text-white transition-colors"
                      title="Create Share Link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    {report.status !== "ARCHIVED" && (
                      <button
                        onClick={() => handleArchiveReport(report.reportId)}
                        className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                        title="Archive Report"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Generate Modal */}
        {showGenModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-100 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Generate Enterprise Dossier
                </h3>
                <button
                  onClick={() => setShowGenModal(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleGenerateReport} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Report Type</label>
                  <select
                    value={selectedReportType}
                    onChange={(e) => setSelectedReportType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                  >
                    <option value="ASSET">Comprehensive Asset Intelligence Dossier</option>
                    <option value="TECHNICAL">Technical PCB Topology & Detection Report</option>
                    <option value="CIRCULARITY">Repair & Circularity Decision Dossier</option>
                    <option value="ENVIRONMENTAL">Avoided Scope 3 Carbon & ESG Report</option>
                    <option value="EXECUTIVE">Executive Enterprise Briefing</option>
                  </select>
                </div>

                {selectedReportType !== "EXECUTIVE" && (
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Analysis ID Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. analysis-dell-optiplex-3080 or leave blank for sample"
                      value={selectedAnalysisId}
                      onChange={(e) => setSelectedAnalysisId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Target Export Format</label>
                  <div className="flex gap-4">
                    {["PDF", "JSON", "CSV"].map((fmt) => (
                      <label key={fmt} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="format"
                          value={fmt}
                          checked={selectedFormat === fmt}
                          onChange={(e) => setSelectedFormat(e.target.value)}
                          className="accent-emerald-500"
                        />
                        <span className="text-slate-300 font-medium">{fmt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowGenModal(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Compiling Dossier...
                      </>
                    ) : (
                      "Generate Dossier"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
