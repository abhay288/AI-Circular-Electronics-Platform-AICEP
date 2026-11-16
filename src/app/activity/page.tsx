"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  FileText,
  ShieldCheck,
  RefreshCw,
  Clock,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export default function ActivityCenterPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/activity?limit=40");
      const json = await res.json();
      if (json.success) {
        setLogs(json.data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Immutable Lifecycle Ledger
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
              Organization Activity Trail
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Complete chronological audit trail of all analyses, reports, DPP mintings, and marketplace lifecycle updates.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-xs text-slate-500">Loading activity trail...</div>
        ) : logs.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
            No activity records recorded yet. As actions occur, they will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log._id || log.entityId + log.timestamp}
                className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex items-start justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                      {log.action}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {log.entityType} ({log.entityId})
                    </span>
                  </div>
                  {log.details && (
                    <div className="mt-1 text-[11px] text-slate-400 font-mono">
                      {JSON.stringify(log.details)}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-2 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                    <span>·</span>
                    <span>By: {log.performedBy || "system"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
