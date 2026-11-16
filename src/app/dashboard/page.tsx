"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Cpu,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  FileText,
  Calendar,
  Building,
  ArrowUpRight,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Database,
  Recycle,
} from "lucide-react";

export default function ExecutiveDashboardPage() {
  const [timeRange, setTimeRange] = useState("30_DAYS");
  const [organizationId, setOrganizationId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [riskData, setRiskData] = useState<any[]>([]);
  const [portfolioData, setPortfolioData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, riskRes, portRes] = await Promise.all([
        fetch(`/api/dashboard/summary?timeRange=${timeRange}&organizationId=${organizationId}`),
        fetch(`/api/dashboard/risk?organizationId=${organizationId}`),
        fetch(`/api/dashboard/portfolio?timeRange=${timeRange}&organizationId=${organizationId}&limit=10&search=${encodeURIComponent(searchQuery)}`),
      ]);

      const sumJson = await sumRes.json();
      const riskJson = await riskRes.json();
      const portJson = await portRes.json();

      if (sumJson.success) setSummaryData(sumJson.data);
      if (riskJson.success) setRiskData(riskJson.data.risks || []);
      if (portJson.success) setPortfolioData(portJson.data.items || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange, organizationId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const kpis = summaryData?.kpis || {};
  const healthDist = summaryData?.distributions?.healthDistribution || {};
  const rulDist = summaryData?.distributions?.rulDistribution || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      {/* Top Breadcrumb & Controls */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Enterprise Circular Intelligence
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
              Executive Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Aggregated portfolio health, material recovery, circularity decisions, and Scope 3 avoided carbon.
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Time Range Selector */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2" />
              {[
                { label: "Today", val: "TODAY" },
                { label: "7D", val: "7_DAYS" },
                { label: "30D", val: "30_DAYS" },
                { label: "90D", val: "90_DAYS" },
                { label: "6M", val: "6_MONTHS" },
                { label: "1Y", val: "1_YEAR" },
                { label: "All", val: "ALL" },
              ].map((t) => (
                <button
                  key={t.val}
                  onClick={() => setTimeRange(t.val)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    timeRange === t.val
                      ? "bg-emerald-500 text-slate-950 font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Org Selector */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none"
              >
                <option value="all" className="bg-slate-900 text-slate-200">All Organizations</option>
                <option value="org-default" className="bg-slate-900 text-slate-200">Default Enterprise</option>
              </select>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* 10 Enterprise KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">Assets Analyzed</span>
            <div className="text-2xl font-bold text-white mt-1">{kpis.totalAssetsAnalyzed ?? 0}</div>
            <span className="text-[10px] text-slate-500">Total ingested assets</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">Components Detected</span>
            <div className="text-2xl font-bold text-indigo-400 mt-1">{kpis.componentsDetected ?? 0}</div>
            <span className="text-[10px] text-slate-500">Optical YOLO telemetry</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">Assets Repaired</span>
            <div className="text-2xl font-bold text-cyan-400 mt-1">{kpis.assetsRepaired ?? 0}</div>
            <span className="text-[10px] text-slate-500">Component level rework</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">Assets Reused</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{kpis.assetsReused ?? 0}</div>
            <span className="text-[10px] text-slate-500">Direct lifecycle extension</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">Assets Refurbished</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">{kpis.assetsRefurbished ?? 0}</div>
            <span className="text-[10px] text-slate-500">Factory reconditioning</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">Recoverable Mass</span>
            <div className="text-2xl font-bold text-violet-400 mt-1">{kpis.materialsRecoveredKg ?? 0} <span className="text-xs font-normal">kg</span></div>
            <span className="text-[10px] text-slate-500">Base & precious metals</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">Waste Diverted</span>
            <div className="text-2xl font-bold text-teal-400 mt-1">{kpis.wasteDivertedKg ?? 0} <span className="text-xs font-normal">kg</span></div>
            <span className="text-[10px] text-slate-500">Landfill avoidance</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">Avoided CO2e</span>
            <div className="text-2xl font-bold text-emerald-300 mt-1">{kpis.estimatedCO2eAvoidedKg ?? 0} <span className="text-xs font-normal">kg</span></div>
            <span className="text-[10px] text-slate-500">Displaced virgin mfg</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">Marketplace Listings</span>
            <div className="text-2xl font-bold text-sky-400 mt-1">{kpis.activeMarketplaceListings ?? 0}</div>
            <span className="text-[10px] text-slate-500">Available component lots</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">Verified Passports</span>
            <div className="text-2xl font-bold text-blue-400 mt-1">{kpis.verifiedPassports ?? 0}</div>
            <span className="text-[10px] text-slate-500">Polygon DPP minted</span>
          </div>
        </div>

        {/* Charts & Distributions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Health Distribution */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Portfolio Health Distribution
              </h2>
              <span className="text-xs text-slate-400">Score Categories</span>
            </div>
            <div className="space-y-3">
              {[
                { label: "Healthy (80-100)", count: healthDist.Healthy || 0, color: "bg-emerald-500" },
                { label: "Good (65-79)", count: healthDist.Good || 0, color: "bg-blue-500" },
                { label: "Fair (50-64)", count: healthDist.Fair || 0, color: "bg-amber-500" },
                { label: "Degraded (35-49)", count: healthDist.Degraded || 0, color: "bg-orange-500" },
                { label: "Critical (<35)", count: healthDist.Critical || 0, color: "bg-red-500" },
                { label: "Unknown / Unscored", count: healthDist.Unknown || 0, color: "bg-slate-600" },
              ].map((item) => {
                const total = Math.max(1, (kpis.totalAssetsAnalyzed || 1));
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.label} className="text-xs">
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>{item.label}</span>
                      <span className="font-semibold">{item.count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className={`${item.color} h-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RUL Distribution */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Predicted Remaining Useful Life (RUL)
              </h2>
              <span className="text-xs text-slate-400">Lifespan Horizons</span>
            </div>
            <div className="space-y-3">
              {[
                { label: "< 6 Months (Immediate Action)", count: rulDist.under6Months || 0, color: "bg-red-500" },
                { label: "6–12 Months (Upcoming Maintenance)", count: rulDist.sixTo12Months || 0, color: "bg-amber-500" },
                { label: "1–3 Years (Healthy Secondary Life)", count: rulDist.oneTo3Years || 0, color: "bg-blue-500" },
                { label: "3–5 Years (High Longevity)", count: rulDist.threeTo5Years || 0, color: "bg-emerald-500" },
                { label: "> 5 Years (Optimal State)", count: rulDist.over5Years || 0, color: "bg-teal-400" },
                { label: "Unknown Horizon", count: rulDist.unknown || 0, color: "bg-slate-600" },
              ].map((item) => {
                const total = Math.max(1, (kpis.totalAssetsAnalyzed || 1));
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.label} className="text-xs">
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>{item.label}</span>
                      <span className="font-semibold">{item.count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className={`${item.color} h-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Risk Center */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Risk Center & Critical Alerts
            </h2>
            <span className="text-xs text-slate-400">{riskData.length} alerts flagged</span>
          </div>

          {riskData.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-500">
              No critical degradation risks or defect alerts identified for this selection.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {riskData.slice(0, 6).map((risk) => (
                <div key={risk.id} className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        risk.severity === "CRITICAL" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {risk.severity}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{risk.analysisId}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-200">{risk.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">{risk.description}</p>
                  </div>
                  <Link
                    href={`/console/results?analysisId=${risk.analysisId}`}
                    className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300"
                  >
                    {risk.actionLabel}
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Asset Portfolio Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Asset Portfolio Registry
              </h2>
              <p className="text-xs text-slate-400">All registered devices, degradation metrics, and passport references.</p>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search Asset, Analysis ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white rounded-lg transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Asset / Analysis ID</th>
                  <th className="py-2.5 px-3">Device Name</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Health Score</th>
                  <th className="py-2.5 px-3">Predicted RUL</th>
                  <th className="py-2.5 px-3">Recommendation</th>
                  <th className="py-2.5 px-3">Recoverable Value</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {portfolioData.map((item) => (
                  <tr key={item.analysisId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-300">
                      <div>{item.assetId}</div>
                      <div className="text-[10px] text-slate-500">{item.analysisId}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-white">
                      {item.deviceName || "Unspecified"}
                      {item.isDemo && (
                        <span className="ml-1.5 px-1 py-0.2 bg-amber-500/10 text-amber-400 text-[9px] rounded border border-amber-500/20">
                          DEMO
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {item.healthScore !== null ? (
                        <span className="font-semibold text-slate-200">{item.healthScore}/100</span>
                      ) : (
                        <span className="text-slate-500 italic">Unassessed</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {item.predictedRULYears !== null ? (
                        <span className="text-slate-200">{item.predictedRULYears} yrs</span>
                      ) : (
                        <span className="text-slate-500 italic">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-3 uppercase text-[11px] font-medium text-slate-300">
                      {item.recommendedAction || "ASSESS"}
                    </td>
                    <td className="py-3 px-3 text-slate-200">
                      ${item.recoverableUSD || 0}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <Link
                        href={`/console/results?analysisId=${item.analysisId}`}
                        className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-0.5"
                      >
                        Inspect
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                      {item.passportId && (
                        <Link
                          href={`/passport/${item.passportId}`}
                          className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-0.5 ml-2"
                        >
                          DPP
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Platform Architecture Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          <Link
            href="/reports"
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-semibold text-white">Enterprise Reports</div>
              <div className="text-[11px] text-slate-400">PDF, JSON, CSV Dossiers</div>
            </div>
            <FileText className="w-4 h-4 text-emerald-400" />
          </Link>

          <Link
            href="/impact"
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-semibold text-white">ESG & Carbon Impact</div>
              <div className="text-[11px] text-slate-400">Avoided Scope 3 Footprint</div>
            </div>
            <Recycle className="w-4 h-4 text-teal-400" />
          </Link>

          <Link
            href="/marketplace"
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-semibold text-white">Circular Marketplace</div>
              <div className="text-[11px] text-slate-400">Component Exchange</div>
            </div>
            <RotateCcw className="w-4 h-4 text-sky-400" />
          </Link>

          <Link
            href="/organization/data-quality"
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-semibold text-white">Data Quality & Models</div>
              <div className="text-[11px] text-slate-400">Provenance Directory</div>
            </div>
            <Database className="w-4 h-4 text-indigo-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
