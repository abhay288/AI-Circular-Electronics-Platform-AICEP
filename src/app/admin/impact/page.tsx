"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Database,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Shield,
  Layers,
  RefreshCw,
  Search,
} from "lucide-react";

export default function AdminImpactSettingsPage() {
  const [factors, setFactors] = useState<any[]>([]);
  const [methodologies, setMethodologies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFactor, setNewFactor] = useState({
    material: "",
    process: "PRIMARY_EXTRACTION_AVOIDED",
    factor: 1.0,
    unit: "kgCO2e/kg",
    source: "",
    sourceType: "AUTHORITATIVE_DATABASE",
    sourceReference: "",
    version: "1.0",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchFactors();
  }, []);

  const fetchFactors = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/carbon/factors");
      if (res.ok) {
        const d = await res.json();
        setFactors(d.data?.factors || []);
      }
    } catch (err) {
      console.error("Failed to load factors:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (factorId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/carbon/factors/${factorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        await fetchFactors();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleCreateFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/carbon/factors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFactor),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to create factor");
      }

      setShowCreateModal(false);
      setNewFactor({
        material: "",
        process: "PRIMARY_EXTRACTION_AVOIDED",
        factor: 1.0,
        unit: "kgCO2e/kg",
        source: "",
        sourceType: "AUTHORITATIVE_DATABASE",
        sourceReference: "",
        version: "1.0",
      });
      await fetchFactors();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create factor");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = factors.filter((f) =>
    f.material.toLowerCase().includes(search.toLowerCase()) ||
    f.source.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Header */}
      <div className="bg-slate-900 border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-lg font-bold text-white">
                  Admin Emission Factor & Methodology Console
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Governance & Compliance
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Configure verified emission factors, validate source references, and manage calculation versions
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Add Verified Factor</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Policy Box */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white flex items-start gap-3 text-xs">
          <Shield className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <span className="font-bold text-emerald-400">Scientific Integrity Rule (Phase 9):</span>
            <p className="text-slate-300 leading-relaxed">
              Every active emission factor MUST have a verified, documented bibliographic source (e.g., Ecoinvent, USGS, IAI). Synthetic or unverified factors will be flagged and prohibited in production corporate reporting calculations.
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by material (e.g., Copper, Gold) or source..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <span className="text-xs font-mono text-slate-500">
            {filtered.length} factors registered
          </span>
        </div>

        {/* Factors Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="font-heading text-xs font-bold text-slate-900 uppercase tracking-wider">
              Material Emission Factor Registry
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Factor ID</th>
                  <th className="py-3 px-4">Material</th>
                  <th className="py-3 px-4">Process</th>
                  <th className="py-3 px-4">Factor Value</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Source & Reference</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((factor) => {
                  const isActive = factor.status === "ACTIVE";
                  return (
                    <tr key={factor.factorId} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 text-slate-500">{factor.factorId}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{factor.material}</td>
                      <td className="py-3 px-4 text-slate-600">{factor.process}</td>
                      <td className="py-3 px-4 font-extrabold text-purple-700">{factor.factor}</td>
                      <td className="py-3 px-4 text-slate-600">{factor.unit}</td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={factor.source}>
                        {factor.source}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {factor.sourceType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {factor.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(factor.factorId, factor.status)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                            isActive
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {isActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Factor Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading text-base font-bold text-slate-900">
                Register New Emission Factor
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateFactor} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Material Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Copper, Gold, Tantalum"
                  value={newFactor.material}
                  onChange={(e) => setNewFactor({ ...newFactor, material: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Process *</label>
                  <input
                    type="text"
                    required
                    value={newFactor.process}
                    onChange={(e) => setNewFactor({ ...newFactor, process: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Factor (kgCO2e/unit) *</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={newFactor.factor}
                    onChange={(e) => setNewFactor({ ...newFactor, factor: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Bibliographic Source *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ecoinvent 3.9, USGS Mineral Yearbook"
                  value={newFactor.source}
                  onChange={(e) => setNewFactor({ ...newFactor, source: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Source Type</label>
                <select
                  value={newFactor.sourceType}
                  onChange={(e) => setNewFactor({ ...newFactor, sourceType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="AUTHORITATIVE_DATABASE">AUTHORITATIVE_DATABASE</option>
                  <option value="LITERATURE">LITERATURE</option>
                  <option value="INDUSTRY_STANDARD">INDUSTRY_STANDARD</option>
                  <option value="ORGANIZATION_CONFIGURED">ORGANIZATION_CONFIGURED</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Create Factor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
