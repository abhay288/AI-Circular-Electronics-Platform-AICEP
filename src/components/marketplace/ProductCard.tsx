"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Cpu,
  Activity,
  Clock,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  FileCheck,
} from "lucide-react";

interface ProductCardProps {
  listing: any;
}

export function ProductCard({ listing }: ProductCardProps) {
  const isUntested = listing.condition === "USED_UNTESTED";
  const isPassportVerified = listing.verificationStatus === "PASSPORT_VERIFIED";
  const isDemo = listing.verificationStatus === "DEMO";

  const conditionLabels: Record<string, { label: string; color: string }> = {
    NEW: { label: "NEW", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    USED_TESTED: { label: "USED — TESTED", color: "bg-blue-50 text-blue-700 border-blue-200" },
    USED_UNTESTED: { label: "USED — UNTESTED", color: "bg-amber-50 text-amber-700 border-amber-200" },
    REFURBISHED: { label: "REFURBISHED", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    REPAIRED: { label: "REPAIRED", color: "bg-purple-50 text-purple-700 border-purple-200" },
    FOR_REPAIR: { label: "FOR REPAIR", color: "bg-orange-50 text-orange-700 border-orange-200" },
    FOR_PARTS: { label: "FOR PARTS", color: "bg-rose-50 text-rose-700 border-rose-200" },
    MATERIAL_RECOVERY: { label: "MATERIAL RECOVERY", color: "bg-teal-50 text-teal-700 border-teal-200" },
    UNKNOWN: { label: "UNKNOWN", color: "bg-slate-100 text-slate-700 border-slate-200" },
  };

  const cond = conditionLabels[listing.condition] || {
    label: listing.condition || "UNKNOWN",
    color: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group">
      {/* Top Banner / Tags */}
      <div className="p-4 pb-0 flex items-center justify-between gap-2 flex-wrap">
        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border ${cond.color}`}
        >
          {cond.label}
        </span>

        {isPassportVerified && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            PASSPORT VERIFIED
          </span>
        )}

        {isDemo && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
            DEMO
          </span>
        )}

        {listing.pricingType === "REQUEST_QUOTE" && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-violet-50 text-violet-700 border border-violet-200">
            REQUEST QUOTE
          </span>
        )}
      </div>

      {/* Untested Warning Alert if applicable */}
      {isUntested && (
        <div className="mx-4 mt-2 p-2 bg-amber-50/80 border border-amber-200 rounded-lg flex items-center gap-2 text-[11px] text-amber-800">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
          <span>Functional testing not verified. Sold for salvage or bench testing.</span>
        </div>
      )}

      {/* Body Information */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono mb-1">
            <span className="truncate max-w-[150px] font-medium text-slate-600">
              {listing.manufacturer || "OEM Certified"}
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              {listing.packageType || listing.category}
            </span>
          </div>

          <h3 className="font-heading text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            <Link href={`/marketplace/${listing.listingId}`}>{listing.title}</Link>
          </h3>

          {listing.partNumber && (
            <p className="font-mono text-xs text-blue-600 mt-1 font-semibold">
              PN: {listing.partNumber}
            </p>
          )}
        </div>

        {/* Technical Provenance Badges (Health, RUL, Recovery) */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs font-mono">
          {listing.healthSummary?.healthScore !== undefined ? (
            <div className="bg-slate-50 p-2 rounded-lg">
              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-600" />
                <span>AI HEALTH</span>
              </div>
              <div className="font-bold text-slate-800 mt-0.5">
                {listing.healthSummary.healthScore}%
                <span className="text-[10px] text-slate-500 font-normal ml-1">
                  ({listing.healthSummary.healthStatus || "ASSESSED"})
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-2 rounded-lg text-slate-400 text-[11px] flex items-center">
              <span>Health: N/A</span>
            </div>
          )}

          {listing.rulSummary?.estimatedRulYears !== undefined ? (
            <div className="bg-slate-50 p-2 rounded-lg">
              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-600" />
                <span>EST. RUL</span>
              </div>
              <div className="font-bold text-slate-800 mt-0.5">
                {listing.rulSummary.estimatedRulYears} Yrs
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-2 rounded-lg text-slate-400 text-[11px] flex items-center">
              <span>RUL: N/A</span>
            </div>
          )}
        </div>

        {/* Material or Passport Highlight */}
        {listing.materialSummary?.primaryRecoverableMetal && (
          <div className="text-[11px] font-mono text-slate-600 flex items-center gap-1.5 bg-amber-50/50 px-2 py-1 rounded border border-amber-100">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Recoverable: {listing.materialSummary.primaryRecoverableMetal}</span>
          </div>
        )}

        {/* Bottom Bar: Availability & Price */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-500">
              Available: <span className="font-bold text-slate-800">{listing.quantityAvailable ?? listing.quantity}</span>
            </div>
            <div className="font-heading font-extrabold text-base text-slate-900 mt-0.5">
              {listing.pricingType === "REQUEST_QUOTE" ? (
                <span className="text-sm text-slate-600 font-medium">B2B Quote</span>
              ) : listing.price !== undefined ? (
                `${listing.currency || "INR"} ${listing.price.toLocaleString("en-IN")}`
              ) : (
                "Quote on Request"
              )}
            </div>
          </div>

          <Link
            href={`/marketplace/${listing.listingId}`}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>Inspect</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
