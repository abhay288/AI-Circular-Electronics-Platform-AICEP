"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Building2,
  Package,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
  Eye,
  Truck,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

export default function SellerDashboardPage() {
  const [activeTab, setActiveTab] = useState<"LISTINGS" | "ORDERS" | "QUOTES">("LISTINGS");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [listings, setListings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fulfillment update state
  const [fulfillmentOrderId, setFulfillmentOrderId] = useState<string | null>(null);
  const [newFulfillmentStatus, setNewFulfillmentStatus] = useState("SHIPPED");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      fetch("/api/marketplace/listings?limit=50").then((r) => r.json()),
      fetch("/api/marketplace/orders?role=seller").then((r) => r.json()),
      fetch("/api/marketplace/quotes?role=seller").then((r) => r.json()),
    ])
      .then(([listingsRes, ordersRes, quotesRes]) => {
        if (listingsRes.success && listingsRes.data?.listings) {
          setListings(listingsRes.data.listings);
        }
        if (ordersRes.success && ordersRes.data?.orders) {
          setOrders(ordersRes.data.orders);
        }
        if (quotesRes.success && quotesRes.data?.quotes) {
          setQuotes(quotesRes.data.quotes);
        }
      })
      .catch((err) => console.error("Error loading seller data:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmitForReview = async (listingId: string) => {
    try {
      const res = await fetch(`/api/marketplace/listings/${listingId}/submit`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        alert("Listing submitted for administrative review.");
        loadData();
      } else {
        alert(data.error?.message || "Failed to submit listing");
      }
    } catch (err: any) {
      alert(err.message || "Request failed");
    }
  };

  const handleUpdateFulfillment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fulfillmentOrderId) return;
    try {
      const res = await fetch(`/api/marketplace/orders/${fulfillmentOrderId}/fulfillment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fulfillmentStatus: newFulfillmentStatus,
          trackingNumber,
          carrier,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Order fulfillment updated successfully.");
        setFulfillmentOrderId(null);
        setTrackingNumber("");
        setCarrier("");
        loadData();
      } else {
        alert(data.error?.message || "Failed to update fulfillment");
      }
    } catch (err: any) {
      alert(err.message || "Request failed");
    }
  };

  const filteredListings = listings.filter((l) => {
    if (statusFilter === "ALL") return true;
    return l.listingStatus === statusFilter;
  });

  return (
    <main className="relative flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <section className="pt-32 pb-12 bg-[#0B132B] text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-mono font-bold">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>SELLER WORKSPACE</span>
            </div>
            <h1 className="font-heading text-3xl font-extrabold text-white">
              Seller & Facility Management
            </h1>
            <p className="text-slate-300 text-xs font-mono">
              Manage recoverable electronic listings, review submissions, process orders, and track quote negotiations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/marketplace/create"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold inline-flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Listing</span>
            </Link>
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="py-10 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
          {/* Dashboard Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-mono font-bold">
            <button
              onClick={() => setActiveTab("LISTINGS")}
              className={`px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === "LISTINGS"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Listings ({listings.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("ORDERS")}
              className={`px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === "ORDERS"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Orders ({orders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("QUOTES")}
              className={`px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === "QUOTES"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Quote Requests ({quotes.length})</span>
            </button>
          </div>

          {/* Tab 1: Listings Table */}
          {activeTab === "LISTINGS" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">STATUS FILTER:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-mono focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PENDING_REVIEW">Pending Review</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="SOLD">Sold</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
                <span className="text-slate-400">Total: {filteredListings.length} listings</span>
              </div>

              {filteredListings.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-slate-500">
                  No listings match the current filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Title & Part Number</th>
                        <th className="p-3">Condition</th>
                        <th className="p-3">Available / Reserved</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredListings.map((l) => (
                        <tr key={l.listingId} className="hover:bg-slate-50/50">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{l.title}</div>
                            <div className="text-[11px] text-blue-600 font-semibold">{l.partNumber || l.category}</div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                              {l.condition}
                            </span>
                          </td>
                          <td className="p-3">
                            <div>Available: <span className="font-bold">{l.quantityAvailable ?? l.quantity}</span></div>
                            <div className="text-slate-400 text-[11px]">Reserved: {l.quantityReserved || 0}</div>
                          </td>
                          <td className="p-3">
                            {l.pricingType === "REQUEST_QUOTE" ? (
                              <span className="text-violet-700 font-semibold">Quote</span>
                            ) : (
                              `${l.currency || "INR"} ${(l.price || 0).toLocaleString("en-IN")}`
                            )}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                l.listingStatus === "PUBLISHED"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : l.listingStatus === "PENDING_REVIEW"
                                  ? "bg-amber-50 text-amber-700"
                                  : l.listingStatus === "RESERVED"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {l.listingStatus}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <Link
                              href={`/marketplace/${l.listingId}`}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </Link>
                            {l.listingStatus === "DRAFT" && (
                              <button
                                onClick={() => handleSubmitForReview(l.listingId)}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Send className="w-3 h-3" />
                                <span>Submit Review</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Orders Table */}
          {activeTab === "ORDERS" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Orders Received
              </h2>
              {orders.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-slate-500">
                  No orders have been received yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Buyer Org</th>
                        <th className="p-3">Items</th>
                        <th className="p-3">Total Amount</th>
                        <th className="p-3">Fulfillment</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((ord) => (
                        <tr key={ord.orderId} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-900">{ord.orderId}</td>
                          <td className="p-3 text-slate-600">{ord.buyerOrganizationId}</td>
                          <td className="p-3">
                            {ord.items?.map((item: any, i: number) => (
                              <div key={i}>
                                {item.title} (x{item.quantity})
                              </div>
                            ))}
                          </td>
                          <td className="p-3 font-semibold">
                            {ord.currency} {(ord.totalAmount || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                              {ord.fulfillmentStatus}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setFulfillmentOrderId(ord.orderId)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold cursor-pointer"
                            >
                              Update Shipment
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Quotes Table */}
          {activeTab === "QUOTES" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Inbound B2B Quotation Requests
              </h2>
              {quotes.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-slate-500">
                  No quote inquiries have been submitted.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Quote ID</th>
                        <th className="p-3">Listing ID</th>
                        <th className="p-3">Buyer Org</th>
                        <th className="p-3">Requested Qty</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {quotes.map((q) => (
                        <tr key={q.quoteId} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-900">{q.quoteId}</td>
                          <td className="p-3 text-blue-600">{q.listingId}</td>
                          <td className="p-3">{q.buyerOrganizationId}</td>
                          <td className="p-3 font-semibold">{q.quantity}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-700">
                              {q.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 max-w-xs truncate">{q.message || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Fulfillment Modal */}
      {fulfillmentOrderId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-heading font-bold text-slate-900 text-base">
              Update Fulfillment ({fulfillmentOrderId})
            </h3>
            <form onSubmit={handleUpdateFulfillment} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-600">Fulfillment Status</label>
                <select
                  value={newFulfillmentStatus}
                  onChange={(e) => setNewFulfillmentStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-600">Carrier</label>
                <input
                  type="text"
                  placeholder="e.g. DHL Express, BlueDart"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-600">Tracking Number</label>
                <input
                  type="text"
                  placeholder="e.g. TRK-88924021"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFulfillmentOrderId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                >
                  Save Status
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
