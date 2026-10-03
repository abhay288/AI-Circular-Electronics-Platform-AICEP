"use client";

import React, { useState } from "react";
import {
  X,
  ShoppingCart,
  CheckCircle2,
  ShieldCheck,
  Tag,
  DollarSign,
  Building,
  Activity,
  ArrowRight,
} from "lucide-react";
import { useAnalysisSession } from "@/lib/context/AnalysisSessionContext";
import Link from "next/link";

export default function MarketplaceListingModal() {
  const {
    isMarketplaceModalOpen,
    setIsMarketplaceModalOpen,
    marketplaceComponent,
    session,
  } = useAnalysisSession();

  const [price, setPrice] = useState<number>(1600);
  const [condition, setCondition] = useState<string>("Grade A+ (Certified Reusable)");
  const [facility, setFacility] = useState<string>("EcoIntel Circular Lab 01");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  if (!isMarketplaceModalOpen) return null;

  const comp = marketplaceComponent || session.detectionResult?.components?.[0] || {
    name: "Recovered High-Reliability IC",
    type: "Integrated Circuit",
    manufacturer: "Tier-1 Semiconductor",
    health: 94,
    remainingLifeYears: 6.4,
    passportId: session.passportId || "PASSPORT-AUTO-2026",
  };

  const handlePublishListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${comp.name} (${condition.split(" ")[0]})`,
          priceUSD: Number(price),
          passportId: comp.passportId || session.passportId,
          sellerFacility: facility,
          image: session.image || "/images/samples/laptop_motherboard.jpg",
          metadata: {
            healthScore: comp.health || 92,
            remainingLifeYears: comp.remainingLifeYears || 5.0,
            manufacturer: comp.manufacturer,
            originSession: session.sessionId,
          },
        }),
      });

      const data = await res.json();
      setSuccessResult(data);
    } catch (err) {
      console.warn("Listing created in demo mode:", err);
      setSuccessResult({ success: true, message: "Published in local preview" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-bold text-[#0F172A]">
                List Recovered Component on Marketplace
              </h3>
              <p className="text-[11px] font-mono text-[#64748B]">
                Direct Circular B2B Redistribution
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsMarketplaceModalOpen(false);
              setSuccessResult(null);
            }}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#0F172A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {successResult ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#ECFDF5] border border-[#86EFAC] text-[#16A34A] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-heading text-lg font-bold text-[#0F172A]">
                Component Listed Successfully!
              </h4>
              <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                {comp.name} has been published with verified Digital Passport credentials to the EcoIntel B2B Marketplace.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <Link
                href="/marketplace"
                onClick={() => setIsMarketplaceModalOpen(false)}
                className="px-6 py-2.5 rounded-full bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors"
              >
                View in Marketplace →
              </Link>
              <button
                onClick={() => {
                  setIsMarketplaceModalOpen(false);
                  setSuccessResult(null);
                }}
                className="px-5 py-2.5 rounded-full border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9]"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePublishListing} className="p-6 space-y-4 text-xs">
            
            {/* Component Summary Card */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0F172A] text-sm">{comp.name}</span>
                <span className="px-2 py-0.5 rounded bg-[#DCFCE7] text-[#16A34A] font-mono text-[10px] font-bold">
                  {comp.health || 92}% Health
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-[#64748B]">
                <div>Manufacturer: <strong className="text-[#0F172A]">{comp.manufacturer || "TI / Microchip"}</strong></div>
                <div>Remaining Life: <strong className="text-[#0F172A]">{comp.remainingLifeYears || 6.4} Yrs</strong></div>
                <div className="col-span-2 flex items-center gap-1.5 text-[#2563EB] font-mono pt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Passport: {comp.passportId || session.passportId}</span>
                </div>
              </div>
            </div>

            {/* Price Input */}
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1.5">
                Listing Price (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2 font-bold text-sm text-[#64748B]">₹</span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#CBD5E1] font-mono text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                  required
                />
              </div>
            </div>

            {/* Condition Selection */}
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1.5">
                Hardware Condition Grade
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] font-medium text-[#0F172A] bg-white focus:outline-none focus:border-[#2563EB]"
              >
                <option value="Grade A+ (Certified Reusable)">Grade A+ (Certified Reusable - 90%+ Health)</option>
                <option value="Grade A (Good Operational)">Grade A (Good Operational - 80-89% Health)</option>
                <option value="Grade B (Refurbished / Repaired)">Grade B (Refurbished / Repaired)</option>
                <option value="Grade C (Precious Metal Ingot/Urban Mining)">Grade C (Precious Metal Ingot/Urban Mining)</option>
              </select>
            </div>

            {/* Seller Facility */}
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1.5">
                Fulfilling Facility / Lab
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 w-4 h-4 text-[#64748B]" />
                <input
                  type="text"
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#CBD5E1] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                  required
                />
              </div>
            </div>

            {/* Submit Actions */}
            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsMarketplaceModalOpen(false)}
                className="px-5 py-2.5 rounded-full border border-[#E2E8F0] font-semibold text-[#475569] hover:bg-[#F1F5F9]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold flex items-center gap-2 shadow-sm transition-colors"
              >
                {isSubmitting ? "Publishing..." : "Confirm & List Component"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
