"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  FileText,
  Download,
  ShieldCheck,
  AlertCircle,
  Clock,
  Layers,
  ExternalLink,
} from "lucide-react";

export default function SharedReportPage() {
  const params = useParams();
  const token = params?.token as string;
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const fetchShared = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports/shared/${token}`);
        const json = await res.json();
        if (json.success) {
          setReport(json.data.report);
        } else {
          setError(json.error?.message || "Invalid or expired share link.");
        }
      } catch (err: any) {
        setError("Network error: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchShared();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Verifying secure token and decrypting report dossier...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Access Denied or Link Expired</h2>
          <p className="text-xs text-slate-400">{error || "This shared report link is no longer valid."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verifiable Enterprise Dossier
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">{report.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2 font-mono">
              <span>Report ID: {report.reportId}</span>
              <span>·</span>
              <span>Type: {report.reportType}</span>
              <span>·</span>
              <span>v{report.version}</span>
            </div>
          </div>

          <a
            href={`/api/reports/${report.reportId}/download?format=PDF`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-2 transition-colors self-start md:self-center"
          >
            <Download className="w-4 h-4" />
            Download Signed PDF
          </a>
        </div>

        {/* Completeness & Disclaimers */}
        {report.isDemo && (
          <div className="bg-amber-950/60 border border-amber-800/80 rounded-xl p-4 text-xs text-amber-300">
            <span className="font-bold">DEMO BENCHMARK DATASET:</span> This dossier was generated using verified benchmark reference hardware and does not constitute a regulatory compliance filing.
          </div>
        )}

        {/* Sections Display */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Intelligence Sections</h2>
          {report.sections?.map((sec: any) => (
            <div key={sec.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-white">{sec.title}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700">
                  {sec.evidenceLevel || "ESTIMATED"}
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1">
                {typeof sec.content === "object" ? (
                  <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                    {JSON.stringify(sec.content, null, 2)}
                  </pre>
                ) : (
                  <p>{String(sec.content)}</p>
                )}
              </div>

              {sec.source && (
                <div className="text-[10px] text-slate-500">
                  Source: <span className="text-slate-400">{sec.source}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
