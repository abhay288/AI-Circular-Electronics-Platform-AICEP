"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Lock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  ShieldCheck,
  FileText,
  Activity,
  Layers,
} from "lucide-react";

export default function AdminMarketplacePage() {
  const [pendingListings, setPendingListings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Review action modal state
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | "REQUEST_CHANGES">("APPROVE");
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAdminData = () => {
    setIsLoading(true);
    Promise.all([
      fetch("/api/marketplace/listings?isAdmin=true&limit=100").then((r) => r.json()),
      fetch("/api/marketplace/stats").then((r) => r.json()),
    ])
      .then(([listingsRes, statsRes]) => {
        if (listingsRes.success && listingsRes.data?.listings) {
          const pending = listingsRes.data.listings.filter(
            (l: any) => l.listingStatus === "PENDING_REVIEW"
          );
          setPendingListings(pending);
        }
        if (statsRes.success && statsRes.data?.stats) {
          setStats(statsRes.data.stats);
        }
      })
      .catch((err) => console.error("Admin load error:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListingId) return;
    setIsSubmitting(true);

    try {
      let endpoint = `/api/marketplace/listings/${selectedListingId}/approve`;
      let body: any = { reviewNotes };

      if (actionType === "REJECT") {
        endpoint = `/api/marketplace/listings/${selectedListingId}/reject`;
        body = { rejectionReason: reviewNotes || "Violates quality or provenance guidelines" };
      } else if (actionType === "REQUEST_CHANGES") {
        endpoint = `/api/marketplace/listings/${selectedListingId}/request-changes`;
        body = { notes: reviewNotes };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        alert(`Action ${actionType} completed successfully.`);
        setSelectedListingId(null);
        setReviewNotes("");
        loadAdminData();
      } else {
        alert(data.error?.message || "Failed to execute review action");
      }
    } catch (err: any) {
      alert(err.message || "Execution error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <section className="pt-32 pb-12 bg-[#0B132B] text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-mono font-bold">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>ADMINISTRATIVE OVERSIGHT</span>
            </div>
            <h1 className="font-heading text-3xl font-extrabold text-white">
              Circular Marketplace Review Console
            </h1>
            <p className="text-slate-300 text-xs font-mono">
              Audit submitted recovered electronics, inspect telemetry verification, and enforce provenance integrity.
            </p>
          </div>

          <button
            onClick={loadAdminData}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer self-start md:self-auto"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </section>

      <section className="py-10 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
          {/* Stats Bar */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="text-slate-400 text-[10px]">PENDING REVIEWS</div>
                <div className="font-heading font-extrabold text-2xl text-amber-600 mt-1">
                  {pendingListings.length}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="text-slate-400 text-[10px]">ACTIVE LISTINGS</div>
                <div className="font-heading font-extrabold text-2xl text-slate-900 mt-1">
                  {stats.activeListings}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="text-slate-400 text-[10px]">TOTAL REUSED</div>
                <div className="font-heading font-extrabold text-2xl text-emerald-600 mt-1">
                  {stats.componentsReused} Units
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="text-slate-400 text-[10px]">PASSPORT BACKED</div>
                <div className="font-heading font-extrabold text-2xl text-blue-600 mt-1">
                  {stats.verifiedPassports}
                </div>
              </div>
            </div>
          )}

          {/* Pending Review Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Listings Awaiting Verification ({pendingListings.length})</span>
              <span className="text-xs font-mono text-slate-400 font-normal">
                Requires manual or AI audit before publishing
              </span>
            </h2>

            {pendingListings.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono text-slate-500">
                No listings currently in PENDING_REVIEW queue.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Title & Part Number</th>
                      <th className="p-3">Seller Org</th>
                      <th className="p-3">Condition & Evidence</th>
                      <th className="p-3">Health / RUL</th>
                      <th className="p-3">Qty & Price</th>
                      <th className="p-3 text-right">Review Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingListings.map((l) => (
                      <tr key={l.listingId} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{l.title}</div>
                          <div className="text-blue-600 font-semibold">{l.partNumber || l.category}</div>
                        </td>
                        <td className="p-3 text-slate-600">{l.sellerOrganizationId}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{l.condition}</div>
                          <div className="text-[10px] text-slate-400">
                            Status: {l.verificationStatus}
                          </div>
                        </td>
                        <td className="p-3">
                          <div>Health: {l.healthSummary?.healthScore ?? "—"}%</div>
                          <div className="text-slate-400">RUL: {l.rulSummary?.estimatedRulYears ?? "—"} Yrs</div>
                        </td>
                        <td className="p-3">
                          <div>Qty: {l.quantity}</div>
                          <div className="font-semibold text-slate-900">
                            {l.pricingType === "REQUEST_QUOTE" ? "Quote" : `${l.currency} ${l.price}`}
                          </div>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <Link
                            href={`/marketplace/${l.listingId}`}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedListingId(l.listingId);
                              setActionType("APPROVE");
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedListingId(l.listingId);
                              setActionType("REJECT");
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Review Modal */}
      {selectedListingId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-heading font-bold text-slate-900 text-base">
              {actionType === "APPROVE" ? "Approve & Publish Listing" : "Reject Listing"} ({selectedListingId})
            </h3>
            <form onSubmit={handleExecuteAction} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-600">Reviewer Notes / Feedback</label>
                <textarea
                  rows={4}
                  required={actionType === "REJECT"}
                  placeholder={
                    actionType === "APPROVE"
                      ? "Optional remarks regarding compliance validation..."
                      : "Reason for rejection (e.g. insufficient testing evidence)..."
                  }
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedListingId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-xl font-bold text-white cursor-pointer ${
                    actionType === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
                  }`}
                >
                  {isSubmitting ? "Processing..." : `Confirm ${actionType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
