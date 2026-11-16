"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  ShoppingCart,
  Clock,
  MessageSquare,
  ShieldCheck,
  Package,
  ExternalLink,
  RefreshCw,
  Truck,
  ArrowRight,
} from "lucide-react";

export default function BuyerDashboardPage() {
  const [activeTab, setActiveTab] = useState<"ORDERS" | "QUOTES">("ORDERS");
  const [orders, setOrders] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      fetch("/api/marketplace/orders?role=buyer").then((r) => r.json()),
      fetch("/api/marketplace/quotes?role=buyer").then((r) => r.json()),
    ])
      .then(([ordersRes, quotesRes]) => {
        if (ordersRes.success && ordersRes.data?.orders) {
          setOrders(ordersRes.data.orders);
        }
        if (quotesRes.success && quotesRes.data?.quotes) {
          setQuotes(quotesRes.data.quotes);
        }
      })
      .catch((err) => console.error("Error loading buyer data:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <main className="relative flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <section className="pt-32 pb-12 bg-[#0B132B] text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-mono font-bold">
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
              <span>BUYER WORKSPACE</span>
            </div>
            <h1 className="font-heading text-3xl font-extrabold text-white">
              Circular Procurement & Inquiries
            </h1>
            <p className="text-slate-300 text-xs font-mono">
              Track acquired hardware batches, inspection statuses, delivery tracking, and active quote requests.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/marketplace"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold inline-flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4" />
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
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-mono font-bold">
            <button
              onClick={() => setActiveTab("ORDERS")}
              className={`px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === "ORDERS"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Procurement Orders ({orders.length})</span>
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
              <span>My Quote Inquiries ({quotes.length})</span>
            </button>
          </div>

          {/* Orders Section */}
          {activeTab === "ORDERS" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Acquired Components & Hardware Shipments
              </h2>
              {orders.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-slate-500">
                  No circular procurement orders found.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {orders.map((ord) => (
                    <div key={ord.orderId} className="py-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                        <div>
                          <span className="font-bold text-slate-900">{ord.orderId}</span>
                          <span className="text-slate-400 ml-2">from Seller Org: {ord.sellerOrganizationId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                            {ord.orderStatus}
                          </span>
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {ord.fulfillmentStatus}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono bg-slate-50 p-3 rounded-xl">
                        <div>
                          <div className="text-[10px] text-slate-400 mb-1 uppercase">Ordered Components</div>
                          {ord.items?.map((it: any, i: number) => (
                            <div key={i} className="flex justify-between font-semibold text-slate-800">
                              <span>
                                {it.title} (x{it.quantity})
                              </span>
                              <span>
                                {it.currency} {(it.totalPrice || 0).toLocaleString("en-IN")}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 mb-1 uppercase">Shipment / Tracking</div>
                          <div className="text-slate-700">
                            Carrier: {ord.carrier || "Standard ESD Freight"}
                          </div>
                          <div className="text-slate-700">
                            Tracking: {ord.trackingNumber || "Assigned upon dispatch"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quotes Section */}
          {activeTab === "QUOTES" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Submitted Quotation Requests
              </h2>
              {quotes.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-slate-500">
                  No active quote inquiries.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {quotes.map((q) => (
                    <div key={q.quoteId} className="py-4 space-y-2 text-xs font-mono">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{q.quoteId}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-700">
                          {q.status}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        Listing ID: <Link href={`/marketplace/${q.listingId}`} className="text-blue-600 hover:underline">{q.listingId}</Link>
                      </div>
                      <div className="text-slate-600">Requested Quantity: {q.quantity} Units</div>
                      {q.offeredPricePerUnit && (
                        <div className="p-2 bg-emerald-50 rounded text-emerald-800 font-bold">
                          Seller Offered Price: {q.currency} {q.offeredPricePerUnit} / unit
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
