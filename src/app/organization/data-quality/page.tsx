"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Database,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  FileQuestion,
} from "lucide-react";

export default function DataQualityCenterPage() {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalAudited: 0,
    missingManufacturer: 0,
    missingMass: 0,
    missingRUL: 0,
    missingPassport: 0,
  });

  const fetchQualityAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/portfolio?limit=50");
      const json = await res.json();
      if (json.success) {
        const items = json.data.items || [];
        setAssets(items);

        let noMfr = 0;
        let noMass = 0;
        let noRul = 0;
        let noPass = 0;

        for (const item of items) {
          if (!item.deviceName || item.deviceName === "Unspecified") noMfr++;
          if (!item.recoverableUSD || item.recoverableUSD === 0) noMass++;
          if (item.healthScore === null || item.predictedRULYears === null) noRul++;
          if (!item.passportId) noPass++;
        }

        setStats({
          totalAudited: items.length,
          missingManufacturer: noMfr,
          missingMass: noMass,
          missingRUL: noRul,
          missingPassport: noPass,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQualityAudit();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              Telemetry Integrity & Governance
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">Data Quality Center</h1>
            <p className="text-xs text-slate-400 mt-1">
              Audit data completeness, missing equipment specifications, and gaps in circular evidence.
            </p>
          </div>

          <button
            onClick={fetchQualityAudit}
            disabled={loading}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Quality KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400">Total Audited Assets</span>
            <div className="text-2xl font-bold text-white mt-1">{stats.totalAudited}</div>
            <span className="text-[10px] text-slate-500">Active portfolio sample</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400">Missing Manufacturer/Spec</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">{stats.missingManufacturer}</div>
            <span className="text-[10px] text-slate-500">Needs intake enrichment</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400">Missing RUL Assessment</span>
            <div className="text-2xl font-bold text-red-400 mt-1">{stats.missingRUL}</div>
            <span className="text-[10px] text-slate-500">Degradation unexecuted</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400">Missing Digital Passport</span>
            <div className="text-2xl font-bold text-sky-400 mt-1">{stats.missingPassport}</div>
            <span className="text-[10px] text-slate-500">Unminted DPP assets</span>
          </div>
        </div>

        {/* Quality Audit Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <FileQuestion className="w-4 h-4 text-amber-400" />
            Asset Telemetry Completeness Audit
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Asset ID</th>
                  <th className="py-2.5 px-3">Device Identity</th>
                  <th className="py-2.5 px-3">Health & RUL</th>
                  <th className="py-2.5 px-3">Material Spectrometry</th>
                  <th className="py-2.5 px-3">Digital Passport</th>
                  <th className="py-2.5 px-3">Recommended Remediation</th>
                  <th className="py-2.5 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {assets.map((a) => {
                  const hasHealth = a.healthScore !== null;
                  const hasMat = (a.recoverableUSD || 0) > 0;
                  const hasPass = Boolean(a.passportId);

                  return (
                    <tr key={a.analysisId} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono text-slate-300">{a.assetId}</td>
                      <td className="py-3 px-3 text-white font-medium">{a.deviceName || "Unspecified"}</td>
                      <td className="py-3 px-3">
                        {hasHealth ? (
                          <span className="text-emerald-400 font-medium">Complete ({a.healthScore}/100)</span>
                        ) : (
                          <span className="text-amber-400 italic">Missing RUL Telemetry</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {hasMat ? (
                          <span className="text-emerald-400 font-medium">${a.recoverableUSD} Recoverable</span>
                        ) : (
                          <span className="text-amber-400 italic">No Yield Data</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {hasPass ? (
                          <span className="text-blue-400 font-mono text-[10px]">{a.passportId}</span>
                        ) : (
                          <span className="text-slate-500 italic">Unminted</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {!hasHealth ? "Trigger RUL inference" : !hasPass ? "Mint Digital Passport" : "Fully verified"}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/console/results?analysisId=${a.analysisId}`}
                          className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-0.5"
                        >
                          Remediate
                          <ExternalLink className="w-3 h-3" />
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
    </div>
  );
}
