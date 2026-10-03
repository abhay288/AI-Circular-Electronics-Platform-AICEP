"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShoppingCart,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  ArrowLeft,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  Check,
  Info,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAnalysisSession } from "@/lib/context/AnalysisSessionContext";
import { analysisService } from "@/lib/services/analysisService";
import { DetectedComponent } from "@/lib/types/analysis";

function MarketplaceCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryAnalysisId = searchParams.get("analysisId") || searchParams.get("sessionId");

  const { session, marketplaceComponent } = useAnalysisSession();

  const [activeSession, setActiveSession] = useState(session);
  const [selectedCompId, setSelectedCompId] = useState<string>("");
  const [listingTitle, setListingTitle] = useState("");
  const [listingPrice, setListingPrice] = useState("18.50");
  const [listingQuantity, setListingQuantity] = useState("1");
  const [listingCondition, setListingCondition] = useState("Grade A+ (Tested & Certified)");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (queryAnalysisId && queryAnalysisId !== session.id) {
      analysisService.getSession(queryAnalysisId).then((loaded) => {
        if (loaded) {
          setActiveSession(loaded);
          const firstComp = loaded.detection?.components?.[0];
          if (firstComp) {
            setSelectedCompId(firstComp.id);
            setListingTitle(`${firstComp.name} (${firstComp.package})`);
          }
        }
      });
    } else {
      setActiveSession(session);
      const initialComp = marketplaceComponent || session.detection?.components?.[0];
      if (initialComp) {
        setSelectedCompId(initialComp.id);
        setListingTitle(`${initialComp.name} (${initialComp.package})`);
      }
    }
  }, [queryAnalysisId, session, marketplaceComponent]);

  const components = activeSession.detection?.components || [];
  const currentComp = components.find((c) => c.id === selectedCompId) || components[0];

  const handleComponentChange = (id: string) => {
    setSelectedCompId(id);
    const comp = components.find((c) => c.id === id);
    if (comp) {
      setListingTitle(`${comp.name} (${comp.package})`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 800);
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans">
      <Navbar />

      <section className="pt-28 pb-16 flex-1 max-w-4xl mx-auto px-4 sm:px-6 w-full space-y-8">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href={queryAnalysisId ? `/console/results?analysisId=${encodeURIComponent(queryAnalysisId)}` : "/console/results"}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Intelligence Workspace</span>
          </Link>

          <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]">
            Pre-Filled from Session #{activeSession.id}
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#2563EB] uppercase tracking-wider">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>CIRCULAR B2B MARKETPLACE INGEST</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-[#0F172A] tracking-tight">
            List Recovered Hardware Component
          </h1>
          <p className="text-xs text-[#64748B]">
            Create a certified B2B marketplace listing with cryptographic Digital Product Passport provenance.
          </p>
        </div>

        {isSuccess ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="font-heading text-2xl font-bold text-[#0F172A]">
                Listing Published to B2B Marketplace
              </h2>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                <strong>{listingTitle}</strong> has been listed with Passport ID:{" "}
                <span className="font-mono font-bold text-[#2563EB]">{currentComp?.passportId || activeSession.passport?.passportId}</span>.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link
                href="/marketplace"
                className="px-6 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] transition-colors shadow-sm"
              >
                Browse Marketplace
              </Link>
              <Link
                href={`/console/results?analysisId=${encodeURIComponent(activeSession.id)}`}
                className="px-6 py-2.5 rounded-xl bg-[#F1F5F9] text-[#0F172A] text-xs font-semibold hover:bg-[#E2E8F0] transition-colors"
              >
                Return to Workspace
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Form Fields (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8 space-y-5">
              <h3 className="font-heading text-base font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3">
                Listing Specifications
              </h3>

              {/* Component Selector */}
              <div>
                <label className="text-xs font-mono text-[#64748B] block mb-1.5">
                  Select Component from Session Analysis:
                </label>
                <select
                  value={selectedCompId}
                  onChange={(e) => handleComponentChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-mono bg-white focus:outline-none focus:border-[#2563EB]"
                >
                  {components.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name} ({comp.package}) · Health: {comp.health}%
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-mono text-[#64748B] block mb-1.5">
                  Listing Title:
                </label>
                <input
                  type="text"
                  value={listingTitle}
                  onChange={(e) => setListingTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-mono focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              {/* Price & Quantity Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-[#64748B] block mb-1.5">
                    Price per Unit (USD):
                  </label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-3" />
                    <input
                      type="number"
                      step="0.01"
                      value={listingPrice}
                      onChange={(e) => setListingPrice(e.target.value)}
                      required
                      className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-[#CBD5E1] text-xs font-mono focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-[#64748B] block mb-1.5">
                    Available Quantity:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={listingQuantity}
                    onChange={(e) => setListingQuantity(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-[#CBD5E1] text-xs font-mono focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="text-xs font-mono text-[#64748B] block mb-1.5">
                  Hardware Grade / Condition:
                </label>
                <select
                  value={listingCondition}
                  onChange={(e) => setListingCondition(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-mono bg-white focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="Grade A+ (Tested & Certified)">Grade A+ (Tested & Certified)</option>
                  <option value="Grade A (Functional, minor wear)">Grade A (Functional, minor wear)</option>
                  <option value="Grade B (Refurbished)">Grade B (Refurbished)</option>
                  <option value="Raw Desoldered (Untested)">Raw Desoldered (Untested)</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm shadow-blue-500/25"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Minting Capsule & Publishing...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Publish Component to Marketplace</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right: Attached Passport & Origin Telemetry (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <span className="font-heading text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Attached Passport
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] text-[10px] font-mono font-bold">
                  Verified
                </span>
              </div>

              {currentComp ? (
                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <span className="text-[10px] text-[#64748B] block">DIGITAL PASSPORT TOKEN</span>
                    <strong className="text-[#2563EB]">{currentComp.passportId || activeSession.passport?.passportId}</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7]">
                      <span className="text-[10px] text-[#16A34A] block">HEALTH</span>
                      <strong className="font-heading text-base text-[#16A34A]">{currentComp.health}%</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]">
                      <span className="text-[10px] text-[#2563EB] block">RUL</span>
                      <strong className="font-heading text-base text-[#2563EB]">{currentComp.remainingLifeYears} Yrs</strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1 text-[11px]">
                    <div>Manufacturer: <strong>{currentComp.manufacturer}</strong></div>
                    <div>Package: <strong>{currentComp.package}</strong></div>
                    <div>Source Assembly: <strong>{activeSession.deviceName}</strong></div>
                    <div>Material: <strong>{currentComp.material}</strong></div>
                  </div>
                </div>
              ) : null}

              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-[11px] font-mono text-blue-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2563EB] mt-0.5 flex-shrink-0" />
                <span>
                  Every marketplace listing includes smart-contract escrow protection and verifiable origin history.
                </span>
              </div>
            </div>

          </form>
        )}

      </section>

      <Footer />
    </main>
  );
}

export default function MarketplaceCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin mb-3" />
        </div>
      }
    >
      <MarketplaceCreateContent />
    </Suspense>
  );
}
