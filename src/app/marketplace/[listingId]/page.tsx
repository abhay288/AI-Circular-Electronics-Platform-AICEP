"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/marketplace/ProductCard";
import {
  ShieldCheck,
  Cpu,
  Activity,
  Clock,
  Wrench,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  Building2,
  Package,
  Layers,
  FileText,
  Lock,
  ShoppingCart,
  Send,
  Flag,
  CheckCircle,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params?.listingId as string;

  const [listing, setListing] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interaction State
  const [activeTab, setActiveTab] = useState<"PURCHASE" | "RESERVE" | "QUOTE">("PURCHASE");
  const [actionQuantity, setActionQuantity] = useState(1);
  const [reservationMins, setReservationMins] = useState(30);
  const [quoteMessage, setQuoteMessage] = useState("");
  const [targetPrice, setTargetPrice] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("MISREPRESENTED_CONDITION");
  const [reportDescription, setReportDescription] = useState("");

  const loadListing = () => {
    if (!listingId) return;
    setIsLoading(true);
    fetch(`/api/marketplace/listings/${listingId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.listing) {
          setListing(data.data.listing);
          setActionQuantity(data.data.listing.minimumOrderQuantity || 1);
        } else {
          setError(data.error?.message || "Listing not found");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadListing();
  }, [listingId]);

  useEffect(() => {
    if (!listingId) return;
    fetch(`/api/marketplace/recommendations?listingId=${listingId}&limit=4`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data?.recommendations)) {
          setRecommendations(data.data.recommendations.map((r: any) => r.listing));
        }
      })
      .catch((err) => console.warn("Failed to load recommendations:", err));
  }, [listingId]);

  // Handle Reservation
  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch(`/api/marketplace/listings/${listingId}/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: actionQuantity,
          durationMinutes: reservationMins,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Reserved ${actionQuantity} units successfully! Reservation expires in ${reservationMins} minutes.`);
        loadListing();
      } else {
        setActionError(data.error?.message || "Failed to reserve inventory.");
      }
    } catch (err: any) {
      setActionError(err.message || "Reservation request failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Direct Order Request
  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch(`/api/marketplace/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              listingId,
              quantity: actionQuantity,
              unitPrice: listing.price,
              currency: listing.currency,
            },
          ],
          shippingAddress: {
            recipientName: "Demo Facilities Manager",
            street: "100 Electronics Way, Industrial Corridor",
            city: "Bangalore",
            country: "India",
            postalCode: "560001",
          },
          notes: "B2B Circular Re-use Procurement Order",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Order ${data.data.order.orderId} created successfully! Payment status: PAYMENT_PENDING.`);
        loadListing();
      } else {
        setActionError(data.error?.message || "Failed to create order.");
      }
    } catch (err: any) {
      setActionError(err.message || "Order request failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Quote Request
  const handleQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch(`/api/marketplace/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          quantity: actionQuantity,
          targetPricePerUnit: targetPrice,
          currency: listing.currency || "INR",
          message: quoteMessage || "Requesting quotation for circular electronics batch.",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Quote request ${data.data.quote.quoteId} sent to seller organization.`);
      } else {
        setActionError(data.error?.message || "Failed to send quote request.");
      }
    } catch (err: any) {
      setActionError(err.message || "Quote request failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Report
  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/marketplace/listings/${listingId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reportReason,
          description: reportDescription,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Report submitted for trust & safety review. Thank you.");
        setShowReportModal(false);
        setReportDescription("");
      } else {
        alert(data.error?.message || "Failed to submit report");
      }
    } catch (err: any) {
      alert(err.message || "Failed to submit report");
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-36 w-full flex items-center justify-center">
          <div className="font-mono text-xs text-slate-500 animate-pulse flex items-center gap-2">
            <Cpu className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading technical provenance & passport data...</span>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-3xl mx-auto px-4 py-36 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="font-heading text-2xl font-bold text-slate-900">Listing Unavailable</h2>
          <p className="text-slate-600 font-mono text-xs">{error || "The requested circular listing could not be found."}</p>
          <Link
            href="/marketplace"
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-mono text-xs font-bold inline-flex items-center gap-2 mt-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Marketplace</span>
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const isUntested = listing.condition === "USED_UNTESTED";

  return (
    <main className="relative flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      {/* Breadcrumb Header */}
      <section className="pt-28 pb-6 bg-[#0B132B] text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-3">
            <Link href="/marketplace" className="hover:text-white transition-colors">
              Marketplace
            </Link>
            <span>/</span>
            <span className="text-slate-300">{listing.category}</span>
            <span>/</span>
            <span className="text-blue-400">{listing.listingId}</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {listing.condition}
                </span>
                {listing.verificationStatus === "PASSPORT_VERIFIED" && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    PASSPORT VERIFIED
                  </span>
                )}
                {listing.verificationStatus === "DEMO" && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    DEMO
                  </span>
                )}
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                {listing.title}
              </h1>
              {listing.partNumber && (
                <p className="font-mono text-xs text-blue-400 mt-1 font-semibold">
                  Part Number: {listing.partNumber} · OEM: {listing.manufacturer || "Certified OEM"}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowReportModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5 text-amber-400" />
                <span>Report</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main 14 Sections Layout */}
      <section className="py-10 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Sections 1 to 9 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 1. Overview */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="font-heading text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                1. Component Overview
              </h2>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-slate-400 text-[10px]">CATEGORY</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{listing.category}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-slate-400 text-[10px]">PACKAGE TYPE</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{listing.packageType || "Standard"}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-slate-400 text-[10px]">INVENTORY STATUS</div>
                  <div className="font-semibold text-emerald-600 mt-0.5">{listing.listingStatus}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-slate-400 text-[10px]">ANALYSIS SESSION</div>
                  <div className="font-semibold text-blue-600 mt-0.5 truncate">{listing.analysisId || "STANDALONE"}</div>
                </div>
              </div>
            </div>

            {/* 2. Technical Specifications */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="font-heading text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>2. Technical Specifications</span>
                <span className="text-xs font-mono font-normal text-slate-400">Verifiable Engineering Telemetry</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Manufacturer</span>
                  <span className="font-semibold text-slate-800">{listing.manufacturer || "NOT PROVIDED"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Part Number</span>
                  <span className="font-semibold text-slate-800">{listing.partNumber || "NOT PROVIDED"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Package / Footprint</span>
                  <span className="font-semibold text-slate-800">{listing.technicalSpecifications?.package || listing.packageType || "NOT PROVIDED"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Pin Count</span>
                  <span className="font-semibold text-slate-800">{listing.technicalSpecifications?.pinCount ?? "NOT PROVIDED"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Dimensions</span>
                  <span className="font-semibold text-slate-800">{listing.technicalSpecifications?.dimensions || "NOT PROVIDED"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Board Location Reference</span>
                  <span className="font-semibold text-slate-800">{listing.technicalSpecifications?.boardLocation || "NOT PROVIDED"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 sm:col-span-2">
                  <span className="text-slate-500">Electrical Ratings</span>
                  <span className="font-semibold text-slate-800">{listing.technicalSpecifications?.electricalRatings || "NOT PROVIDED"}</span>
                </div>
              </div>
            </div>

            {/* 3. Condition */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="font-heading text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>3. Physical & Functional Condition</span>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-800">
                  {listing.condition}
                </span>
              </h2>
              {isUntested && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs font-mono text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Functional testing not verified.</div>
                    <div className="text-amber-800 mt-1">
                      This component was recovered intact but has not undergone automated oscilloscope or digital tester validation. Sold strictly for research, bench experimentation, or salvage.
                    </div>
                  </div>
                </div>
              )}
              <p className="text-xs font-mono text-slate-600 leading-relaxed">
                EcoIntel enforces strict declaration standards. Sellers cannot falsely declare items as TESTED or REFURBISHED without attaching corresponding test reports or inspection records.
              </p>
            </div>

            {/* 4 & 5. Health & RUL (Phase 4 Integration) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span>4 & 5. AI Health & Remaining Useful Life (RUL)</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-600 border border-blue-200">
                  AI ESTIMATE (PHASE 4)
                </span>
              </div>

              {listing.healthSummary ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="text-xs font-mono text-slate-500">HEALTH ASSESSMENT</div>
                    <div className="font-heading font-extrabold text-2xl text-slate-900 flex items-baseline gap-2">
                      <span>{listing.healthSummary.healthScore}%</span>
                      <span className="text-xs font-mono text-emerald-600 font-semibold">
                        ({listing.healthSummary.healthStatus})
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Confidence: {Math.round((listing.healthSummary.confidence || 0.85) * 100)}%
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="text-xs font-mono text-slate-500">ESTIMATED RUL</div>
                    <div className="font-heading font-extrabold text-2xl text-blue-600 flex items-baseline gap-2">
                      <span>{listing.rulSummary?.estimatedRulYears ?? "—"}</span>
                      <span className="text-xs font-mono text-slate-600 font-normal">Years remaining</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Operating Stress: {listing.rulSummary?.stressFactor || "NOMINAL"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs font-mono text-slate-500">
                  No Phase 4 AI health prediction is recorded for this component batch.
                </div>
              )}
            </div>

            {/* 6. Repair History (Phase 6 Integration) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="font-heading text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-indigo-600" />
                  <span>6. Repair & Refurbishment History</span>
                </span>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">
                  PHASE 6 RECORD
                </span>
              </h2>

              {listing.repairSummary ? (
                <div className="space-y-3 text-xs font-mono">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-slate-400 text-[10px]">REPAIRABILITY SCORE</div>
                      <div className="font-bold text-slate-800 mt-0.5">{listing.repairSummary.repairabilityScore ?? "—"}/100</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-slate-400 text-[10px]">FUNCTIONAL TEST RESULT</div>
                      <div className="font-bold text-slate-800 mt-0.5">{listing.repairSummary.functionalTestResult || "NOT_PERFORMED"}</div>
                    </div>
                  </div>
                  {listing.repairSummary.completedRepairs && listing.repairSummary.completedRepairs.length > 0 && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-slate-400 text-[10px] mb-1">COMPLETED PROCEDURES</div>
                      <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                        {listing.repairSummary.completedRepairs.map((r: string, idx: number) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs font-mono text-slate-500">
                  No prior repair or rework interventions recorded.
                </div>
              )}
            </div>

            {/* 7. Material Information (Phase 5 Integration) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="font-heading text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>7. Material Recovery & Precious Metals</span>
                </span>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  PHASE 5 ESTIMATE
                </span>
              </h2>

              {listing.materialSummary ? (
                <div className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-slate-400 text-[10px]">TOTAL MASS</div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {listing.materialSummary.totalMaterialMassGrams ? `${listing.materialSummary.totalMaterialMassGrams}g` : "N/A"}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-slate-400 text-[10px]">PRIMARY METAL</div>
                      <div className="font-bold text-amber-700 mt-0.5">
                        {listing.materialSummary.primaryRecoverableMetal || "Copper"}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-slate-400 text-[10px]">RECOVERY PRIORITY</div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {listing.materialSummary.recoveryPriority || "MEDIUM"}
                      </div>
                    </div>
                  </div>

                  {listing.materialSummary.preciousMetals && listing.materialSummary.preciousMetals.length > 0 && (
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 p-2.5 font-bold text-slate-700 text-[11px]">
                        Precious Metal Composition (AI Estimated)
                      </div>
                      <div className="divide-y divide-slate-100">
                        {listing.materialSummary.preciousMetals.map((m: any, i: number) => (
                          <div key={i} className="p-2.5 flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-800">{m.metal}</span>
                            <span className="text-slate-600 font-mono">
                              {m.estimatedMassGrams ? `${m.estimatedMassGrams.toFixed(4)} g` : m.presence}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs font-mono text-slate-500">
                  No material composition model attached.
                </div>
              )}
            </div>

            {/* 8. Digital Passport (Phase 7 Integration) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="font-heading text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>8. Digital Product Passport Provenance</span>
                </span>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  PHASE 7 INTEGRATED
                </span>
              </h2>

              {listing.passportId ? (
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-mono text-slate-500">PASSPORT IDENTIFIER</div>
                      <div className="font-mono font-bold text-emerald-800 text-sm">{listing.passportId}</div>
                    </div>
                    <Link
                      href={`/passports/${listing.passportId}`}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span>View Digital Passport</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <p className="text-[11px] font-mono text-slate-600">
                    This component is cryptographically anchored to an immutable Digital Product Passport. All marketplace lifecycle events (listing, reservation, transfer) are logged to its provenance chain.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs font-mono text-slate-500">
                  No Digital Product Passport currently assigned to this batch.
                </div>
              )}
            </div>

            {/* 9. Evidence Documents */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="font-heading text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                9. Attached Verification Evidence
              </h2>
              {listing.evidence && listing.evidence.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {listing.evidence.map((ev: any, idx: number) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="font-semibold text-slate-800">{ev.title}</div>
                          <div className="text-[10px] text-slate-400">TYPE: {ev.type}</div>
                        </div>
                      </div>
                      {ev.url && (
                        <a
                          href={ev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs font-mono text-slate-500">
                  No external datasheets or inspection photos attached.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sections 10 to 13 (Seller, Availability, Pricing, Purchase) */}
          <div className="space-y-6">
            {/* 10. Seller Profile & Privacy */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>10. Seller Organization</span>
              </h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Organization ID:</span>
                  <span className="font-semibold text-slate-800">{listing.sellerOrganizationId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Geographic Origin:</span>
                  <span className="font-semibold text-slate-800">
                    {listing.location?.city ? `${listing.location.city}, ` : ""}
                    {listing.location?.country || "India"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location Privacy:</span>
                  <span className="text-emerald-600 font-semibold">Protected (Region Only)</span>
                </div>
              </div>
            </div>

            {/* 11 & 12. Availability & Pricing */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                11 & 12. Availability & Pricing
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-baseline text-xs font-mono">
                  <span className="text-slate-500">Available Quantity:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {listing.quantityAvailable ?? listing.quantity} Units
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs font-mono">
                  <span className="text-slate-500">Reserved Quantity:</span>
                  <span className="font-semibold text-amber-600">
                    {listing.quantityReserved || 0} Units
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs font-mono">
                  <span className="text-slate-500">Min Order Qty:</span>
                  <span className="font-semibold text-slate-800">
                    {listing.minimumOrderQuantity || 1} Units
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-mono text-slate-400">UNIT PRICE</div>
                  <div className="font-heading font-extrabold text-2xl text-slate-900 mt-1">
                    {listing.pricingType === "REQUEST_QUOTE" ? (
                      <span className="text-lg text-violet-700">Request B2B Quotation</span>
                    ) : listing.price !== undefined ? (
                      `${listing.currency || "INR"} ${listing.price.toLocaleString("en-IN")}`
                    ) : (
                      "Contact Seller"
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 13. Request / Purchase Interaction Box */}
            <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-sm space-y-4">
              <h3 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                <span>13. Acquire Component</span>
                <span className="text-[11px] font-mono text-slate-500">No Fake Payments</span>
              </h3>

              {/* Action Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setActiveTab("PURCHASE")}
                  className={`py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    activeTab === "PURCHASE" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Order
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("RESERVE")}
                  className={`py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    activeTab === "RESERVE" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Reserve
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("QUOTE")}
                  className={`py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    activeTab === "QUOTE" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Quote
                </button>
              </div>

              {/* Status alerts */}
              {actionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono text-emerald-800 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{actionSuccess}</span>
                </div>
              )}
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-mono text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Mode: Purchase Order */}
              {activeTab === "PURCHASE" && (
                <form onSubmit={handleOrder} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-600">Quantity</label>
                    <input
                      type="number"
                      min={listing.minimumOrderQuantity || 1}
                      max={listing.quantityAvailable || 1}
                      value={actionQuantity}
                      onChange={(e) => setActionQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl text-[11px] font-mono text-slate-500">
                    Subtotal: <span className="font-bold text-slate-800">
                      {listing.currency || "INR"} {((listing.price || 0) * actionQuantity).toLocaleString("en-IN")}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Platform terms: Orders create verified reservation commits. Payment transitions to PAYMENT_PENDING until enterprise settlement.
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || (listing.quantityAvailable || 0) <= 0}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-mono text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{isSubmitting ? "Processing..." : "Submit B2B Order Request"}</span>
                  </button>
                </form>
              )}

              {/* Mode: Reserve */}
              {activeTab === "RESERVE" && (
                <form onSubmit={handleReserve} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-600">Quantity to Hold</label>
                    <input
                      type="number"
                      min={1}
                      max={listing.quantityAvailable || 1}
                      value={actionQuantity}
                      onChange={(e) => setActionQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-600">Reservation Duration</label>
                    <select
                      value={reservationMins}
                      onChange={(e) => setReservationMins(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
                    >
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={60}>1 Hour</option>
                      <option value={1440}>24 Hours</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || (listing.quantityAvailable || 0) <= 0}
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-mono text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    <span>{isSubmitting ? "Reserving..." : "Hold & Reserve Inventory"}</span>
                  </button>
                </form>
              )}

              {/* Mode: Quote Request */}
              {activeTab === "QUOTE" && (
                <form onSubmit={handleQuote} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-mono text-slate-600">Quantity</label>
                      <input
                        type="number"
                        min={1}
                        value={actionQuantity}
                        onChange={(e) => setActionQuantity(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-mono text-slate-600">Target Price / Unit</label>
                      <input
                        type="number"
                        placeholder="Optional"
                        value={targetPrice ?? ""}
                        onChange={(e) => setTargetPrice(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-600">Technical Specifications or Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Specify lot inspection requirements or desired delivery schedule..."
                      value={quoteMessage}
                      onChange={(e) => setQuoteMessage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-mono text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? "Sending..." : "Submit Quote Request"}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* 14. Related Components Section */}
        {recommendations.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-12 pt-8 border-t border-slate-200">
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-4 flex items-center justify-between">
              <span>14. Similar Verified Components</span>
              <span className="text-xs font-mono font-normal text-slate-500">
                Matched on exact part number or compatible family
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.map((rec) => (
                <ProductCard key={rec.listingId || rec._id} listing={rec} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
                <Flag className="w-4 h-4 text-amber-500" />
                <span>Report Listing</span>
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-mono cursor-pointer"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleReport} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-600">Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="MISREPRESENTED_CONDITION">Misrepresented Condition</option>
                  <option value="COUNTERFEIT">Suspected Counterfeit</option>
                  <option value="DAMAGED">Damaged / Non-functional</option>
                  <option value="INCORRECT_INFORMATION">Incorrect Technical Information</option>
                  <option value="UNAUTHORIZED_LISTING">Unauthorized Listing</option>
                  <option value="SAFETY_CONCERN">Safety Concern</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-600">Description of Violation</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide detailed observations..."
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer"
                >
                  Submit Report
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
