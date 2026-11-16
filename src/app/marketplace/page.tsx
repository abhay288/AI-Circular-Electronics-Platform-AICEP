"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/marketplace/ProductCard";
import {
  ShoppingCart,
  ShieldCheck,
  Search,
  Filter,
  PlusCircle,
  Activity,
  Layers,
  Sparkles,
  TrendingUp,
  Cpu,
  RefreshCw,
  SlidersHorizontal,
  Building2,
  Lock,
} from "lucide-react";
import { PRODUCT_CATEGORIES, LISTING_CONDITIONS } from "@/lib/marketplace/marketplaceTaxonomy";

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedCondition, setSelectedCondition] = useState("ALL");
  const [selectedVerification, setSelectedVerification] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [inStockOnly, setInStockOnly] = useState(false);

  const [listings, setListings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchListings = () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (selectedCategory !== "ALL") params.set("category", selectedCategory);
    if (selectedCondition !== "ALL") params.set("condition", selectedCondition);
    if (selectedVerification !== "ALL") params.set("verificationStatus", selectedVerification);
    if (inStockOnly) params.set("inStockOnly", "true");
    params.set("sortBy", sortBy);

    fetch(`/api/marketplace/listings?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setListings(data.data.listings || []);
        } else if (data.listings) {
          setListings(data.listings);
        }
      })
      .catch((err) => console.error("Error fetching listings:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchListings();
  }, [selectedCategory, selectedCondition, selectedVerification, sortBy, inStockOnly]);

  useEffect(() => {
    // Fetch stats
    fetch("/api/marketplace/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.stats) {
          setStats(data.data.stats);
        }
      })
      .catch((err) => console.warn("Failed to load marketplace stats:", err));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  return (
    <main className="relative flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-32 pb-16 bg-[#0B132B] text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-mono font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>PHASE 8 · B2B CIRCULAR HARDWARE EXCHANGE</span>
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight">
                Verified Circular Electronics
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Give electronic components a verified second life. Discover reusable, refurbished, and recovered semiconductors with verifiable health assessments, RUL predictions, and Digital Product Passports.
              </p>

              {/* Fast navigation badges */}
              <div className="flex items-center gap-3 pt-2 text-xs font-mono">
                <Link
                  href="/marketplace/seller"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Seller Portal</span>
                </Link>
                <Link
                  href="/marketplace/buyer"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Buyer Orders</span>
                </Link>
                <Link
                  href="/marketplace/admin"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Review</span>
                </Link>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
              <Link
                href="/marketplace/create"
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs inline-flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>List Recovered Component</span>
              </Link>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
                <div className="text-white font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Technical Provenance Only</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  Every listed component references AI health, repair history, or DPP blockchain records.
                </p>
              </div>
            </div>
          </div>

          {/* Platform Metrics Bar */}
          {stats && (
            <div className="mt-10 pt-8 border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[11px]">ACTIVE LISTINGS</div>
                <div className="font-heading font-extrabold text-xl text-white mt-1">
                  {stats.activeListings}
                </div>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[11px]">COMPONENTS CIRCULATED</div>
                <div className="font-heading font-extrabold text-xl text-emerald-400 mt-1">
                  {stats.componentsReused} Units
                </div>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[11px]">PASSPORT VERIFIED</div>
                <div className="font-heading font-extrabold text-xl text-blue-400 mt-1">
                  {stats.verifiedPassports}
                </div>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[11px]">PARTICIPATING ORGS</div>
                <div className="font-heading font-extrabold text-xl text-purple-400 mt-1">
                  {stats.totalOrganizations}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-10 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          {/* Search and Filters Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by part number (e.g. STM32, ATmega), category, manufacturer, or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500 bg-slate-50"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>

            {/* Filter Selects */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-slate-100 text-xs font-mono">
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  FILTERS:
                </span>

                {/* Condition Filter */}
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-mono focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">All Conditions</option>
                  <option value="USED_TESTED">USED — TESTED</option>
                  <option value="REFURBISHED">REFURBISHED</option>
                  <option value="REPAIRED">REPAIRED</option>
                  <option value="USED_UNTESTED">USED — UNTESTED</option>
                  <option value="MATERIAL_RECOVERY">MATERIAL RECOVERY</option>
                  <option value="FOR_PARTS">FOR PARTS</option>
                </select>

                {/* Verification Status */}
                <select
                  value={selectedVerification}
                  onChange={(e) => setSelectedVerification(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-mono focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">All Verification</option>
                  <option value="PASSPORT_VERIFIED">PASSPORT VERIFIED</option>
                  <option value="TECHNICALLY_ASSESSED">TECHNICALLY ASSESSED</option>
                  <option value="SELLER_DECLARED">SELLER DECLARED</option>
                  <option value="DEMO">DEMO</option>
                </select>

                {/* In stock toggle */}
                <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer ml-2">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <span>In Stock Only</span>
                </label>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">SORT BY:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-mono focus:outline-none focus:border-blue-500"
                >
                  <option value="NEWEST">Newest First</option>
                  <option value="HEALTH_DESC">Highest Health</option>
                  <option value="RUL_DESC">Longest RUL</option>
                  <option value="QUANTITY_DESC">Highest Quantity</option>
                  <option value="PRICE_ASC">Lowest Price</option>
                  <option value="PRICE_DESC">Highest Price</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Quick Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs font-mono">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3.5 py-1.5 rounded-full border transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === "ALL"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              All Categories
            </button>
            {(PRODUCT_CATEGORIES as readonly string[]).slice(0, 10).map((cat: string) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full border transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-900">{listings.length}</span> verified component listings
            </div>
            <button
              onClick={fetchListings}
              className="hover:text-blue-600 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse"
                >
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-5 bg-slate-100 rounded w-3/4" />
                  <div className="h-20 bg-slate-50 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Listings Grid */}
          {!isLoading && listings.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((item) => (
                <ProductCard key={item.listingId || item._id} listing={item} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && listings.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-slate-800">
                No matching components found
              </h3>
              <p className="text-slate-500 text-xs font-mono max-w-md mx-auto">
                Try adjusting your search filters, or list a recovered component directly from an existing analysis session.
              </p>
              <div className="pt-2">
                <Link
                  href="/marketplace/create"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold inline-flex items-center gap-2 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>List New Component</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
