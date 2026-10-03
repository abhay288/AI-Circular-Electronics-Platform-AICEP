"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TechBadge from "@/components/ui/TechBadge";
import {
  ShoppingCart,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  PlusCircle,
  Clock,
  Sparkles,
  Layers,
} from "lucide-react";

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/marketplace")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.listings)) {
          setListings(data.listings);
        }
      })
      .catch((err) => {
        console.warn("Failed to load listings from API:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredListings = listings.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.title || "").toLowerCase().includes(term) ||
      (item.polygonToken || "").toLowerCase().includes(term) ||
      (item.seller || "").toLowerCase().includes(term) ||
      (item.condition || "").toLowerCase().includes(term)
    );
  });

  return (
    <main className="relative flex flex-col min-h-screen bg-[#F1F5F9]">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-32 pb-16 bg-[#0F172A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex flex-col gap-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[#60A5FA] text-xs font-mono font-bold w-fit">
                <ShoppingCart className="w-4 h-4" />
                <span>MODULE 07 · CIRCULAR B2B HARDWARE EXCHANGE & ESCROW</span>
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight">
                B2B Hardware Marketplace
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Trade verified recovered electronic components inside transparent marketplace capsules with digital product passports, guaranteed remaining lifespan, and smart escrow.
              </p>
            </div>

            <div>
              <Link
                href="/marketplace/create"
                className="px-6 py-3 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-mono font-bold inline-flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>List Recovered Components</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Listings Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">

          {/* Search Bar */}
          <div className="glass-panel p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#64748B] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search microchips, ICs, capacitors, or Passport IDs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-[#E2E8F0] text-xs font-mono focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#64748B]">
              <span className="font-bold text-[#0F172A]">{filteredListings.length}</span> Active Listings
            </div>
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl border border-[#E2E8F0] p-7 space-y-4 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-6 bg-slate-100 rounded w-3/4" />
                  <div className="h-24 bg-slate-50 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Listings Grid */}
          {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredListings.map((item) => (
                <div
                  key={item.id || item.listingId}
                  className="glass-card-interactive p-7 flex flex-col justify-between space-y-6 hover:shadow-lg transition-shadow bg-white rounded-3xl border border-[#E2E8F0]"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <TechBadge label={item.badge || "VERIFIED PASSPORT"} variant="green" />
                      <span className="font-mono text-xs font-bold text-[#2563EB] truncate max-w-[140px]">
                        #{item.polygonToken || item.passportId || "PASSPORT"}
                      </span>
                    </div>

                    <h3 className="font-heading text-lg font-bold text-[#0F172A] leading-snug">
                      {item.title}
                    </h3>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#64748B]">Certified Health</span>
                        <span className="font-bold text-[#16A34A]">{item.health}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#64748B]">Lifespan Baseline</span>
                        <span className="font-bold text-[#2563EB]">{item.rul}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#64748B]">Facility</span>
                        <span className="font-bold text-[#0F172A] truncate max-w-[150px]">{item.seller}</span>
                      </div>
                      {item.quantity && (
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-[#64748B]">Available Quantity</span>
                          <span className="font-bold text-[#0F172A]">{item.quantity} Units</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                    <span className="font-mono font-extrabold text-xl text-[#0F172A]">
                      {item.price?.startsWith("₹")
                        ? item.price
                        : item.priceUSD
                        ? `₹${Math.round(item.priceUSD < 500 ? item.priceUSD * 86.5 : item.priceUSD).toLocaleString("en-IN")}`
                        : item.price?.replace("$", "₹") || "₹1,450"}
                    </span>
                    <button className="px-5 py-2.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-mono font-bold inline-flex items-center gap-2 transition-colors cursor-pointer">
                      <span>Buy Capsule</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      <Footer />
    </main>
  );
}
