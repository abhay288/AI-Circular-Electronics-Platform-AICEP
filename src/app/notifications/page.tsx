"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  CheckCheck,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

export default function NotificationsCenterPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [severityFilter, setSeverityFilter] = useState("all");

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/notifications?unreadOnly=${unreadOnly}&severity=${severityFilter}`
      );
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data.items || []);
        setUnreadCount(json.data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Notifications fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [unreadOnly, severityFilter]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: "org-default" }),
      });
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  const getEntityUrl = (type: string, id: string) => {
    switch (type) {
      case "ANALYSIS":
        return `/console/results?analysisId=${id}`;
      case "REPORT":
        return `/reports?reportId=${id}`;
      case "PASSPORT":
        return `/passport/${id}`;
      case "LISTING":
        return `/marketplace/${id}`;
      default:
        return `/dashboard`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <Bell className="w-3.5 h-3.5 text-emerald-400" />
              Platform Alerts & Telemetry
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">Notification Center</h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time events from inference stages, digital passports, repair assessments, and marketplace transactions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                Mark All Read
              </button>
            )}
            <button
              onClick={fetchNotifs}
              disabled={loading}
              className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-xl p-2 text-xs">
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              unreadOnly ? "bg-emerald-500 text-slate-950 font-semibold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {unreadOnly ? "Showing Unread Only" : "All Notifications"} ({unreadCount} unread)
          </button>
          <div className="h-4 w-px bg-slate-800 mx-1"></div>
          {["all", "INFO", "WARNING", "ERROR", "SUCCESS"].map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-2.5 py-1 rounded transition-colors ${
                severityFilter === s ? "bg-slate-800 text-white font-semibold" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Notification List */}
        {loading ? (
          <div className="text-center py-16 text-slate-500 text-xs">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
            No notifications found matching your filter criteria.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.notificationId}
                className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                  n.read
                    ? "bg-slate-900/40 border-slate-800/80 text-slate-400"
                    : "bg-slate-900 border-slate-700 text-slate-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {n.severity === "ERROR" ? (
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                    ) : n.severity === "WARNING" ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : n.severity === "SUCCESS" ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-white">{n.title}</h4>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{n.message}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-2 font-mono">
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                      <span>·</span>
                      <span>Entity: {n.entityType} ({n.entityId})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start">
                  <Link
                    href={getEntityUrl(n.entityType, n.entityId)}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 transition-colors"
                    title="Open Entity"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  {!n.read && (
                    <button
                      onClick={() => handleMarkAsRead(n.notificationId)}
                      className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
