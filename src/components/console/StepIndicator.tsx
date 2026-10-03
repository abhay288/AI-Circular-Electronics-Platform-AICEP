"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { useAnalysisSession } from "@/lib/context/AnalysisSessionContext";

export default function StepIndicator() {
  const { session, setActiveStep } = useAnalysisSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");

  const sessionIdParam = session?.id ? `&analysisId=${encodeURIComponent(session.id)}` : "";

  const steps = [
    { num: "01", name: "Capture", path: "/console", href: `/console` },
    { num: "02", name: "AI Detection", path: "/console/processing", href: `/console/processing${sessionIdParam ? `?analysisId=${encodeURIComponent(session.id)}` : ""}` },
    { num: "03", name: "PCB Analysis", path: "/console/results", tab: "pcb", href: `/console/results?tab=pcb${sessionIdParam}` },
    { num: "04", name: "Health & RUL", path: "/console/results", tab: "rul", href: `/console/results?tab=rul${sessionIdParam}` },
    { num: "05", name: "Material Recovery", path: "/console/results", tab: "metals", href: `/console/results?tab=metals${sessionIdParam}` },
    { num: "06", name: "Repair Intelligence", path: "/console/results", tab: "repair", href: `/console/results?tab=repair${sessionIdParam}` },
    { num: "07", name: "Digital Passport", path: "/console/passport", href: `/console/passport${sessionIdParam ? `?analysisId=${encodeURIComponent(session.id)}` : ""}` },
    { num: "08", name: "Impact Report", path: "/console/report", href: `/console/report${sessionIdParam ? `?analysisId=${encodeURIComponent(session.id)}` : ""}` },
  ];

  // Determine current active step index (0-indexed)
  const getActiveIndex = (): number => {
    if (pathname === "/console") return 0;
    if (pathname === "/console/processing") return 1;
    if (pathname === "/console/passport") return 6;
    if (pathname === "/console/report") return 7;
    if (pathname === "/console/results") {
      if (currentTab === "pcb") return 2;
      if (currentTab === "rul") return 3;
      if (currentTab === "metals") return 4;
      if (currentTab === "repair") return 5;
      if (currentTab === "components") return 2;
      return 2; // default results view maps to analysis stage
    }
    return 0;
  };

  const activeIdx = getActiveIndex();

  // Explicit completion check per step
  const isStepCompleted = (idx: number): boolean => {
    const status = session.status;
    if (status === "COMPLETED") return true;

    switch (idx) {
      case 0: // Capture
        return status !== "DRAFT";
      case 1: // AI Detection
        return [
          "DETECTION_COMPLETE",
          "PCB_ANALYSIS_COMPLETE",
          "RUL_COMPLETE",
          "MATERIAL_ANALYSIS_COMPLETE",
          "REPAIR_COMPLETE",
          "PASSPORT_READY",
          "REPORT_READY",
          "COMPLETED",
        ].includes(status);
      case 2: // PCB Analysis
        return [
          "PCB_ANALYSIS_COMPLETE",
          "RUL_COMPLETE",
          "MATERIAL_ANALYSIS_COMPLETE",
          "REPAIR_COMPLETE",
          "PASSPORT_READY",
          "REPORT_READY",
          "COMPLETED",
        ].includes(status);
      case 3: // Health & RUL
        return [
          "RUL_COMPLETE",
          "MATERIAL_ANALYSIS_COMPLETE",
          "REPAIR_COMPLETE",
          "PASSPORT_READY",
          "REPORT_READY",
          "COMPLETED",
        ].includes(status);
      case 4: // Material Recovery
        return [
          "MATERIAL_ANALYSIS_COMPLETE",
          "REPAIR_COMPLETE",
          "PASSPORT_READY",
          "REPORT_READY",
          "COMPLETED",
        ].includes(status);
      case 5: // Repair Intelligence
        return [
          "REPAIR_COMPLETE",
          "PASSPORT_READY",
          "REPORT_READY",
          "COMPLETED",
        ].includes(status);
      case 6: // Digital Passport
        return [
          "PASSPORT_READY",
          "REPORT_READY",
          "COMPLETED",
        ].includes(status);
      case 7: // Impact Report
        return status === "REPORT_READY";
      default:
        return false;
    }
  };

  return (
    <div className="w-full bg-white border-b border-[#E2E8F0] px-4 sm:px-8 py-2.5 overflow-x-auto scrollbar-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between min-w-[840px]">
        {steps.map((step, idx) => {
          const isActive = idx === activeIdx;
          const isDone = isStepCompleted(idx);
          const isLocked = !isDone && !isActive && idx > activeIdx;

          return (
            <React.Fragment key={step.num}>
              <Link
                href={step.href}
                onClick={() => setActiveStep(idx + 1)}
                className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all text-xs font-mono select-none ${
                  isActive
                    ? "bg-[#EFF6FF] text-[#2563EB] font-bold ring-1 ring-[#BFDBFE]"
                    : isDone
                    ? "text-[#16A34A] hover:bg-[#F0FDF4]"
                    : "text-[#94A3B8] hover:text-[#475569] hover:bg-[#F8FAFC]"
                }`}
                title={`${step.num} ${step.name}${isDone ? " (Completed)" : isActive ? " (Current Step)" : isLocked ? " (Pending Analysis)" : ""}`}
              >
                {/* Step Circle Badge */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all flex-shrink-0 ${
                    isActive
                      ? "bg-[#2563EB] text-white shadow-sm ring-2 ring-blue-200"
                      : isDone
                      ? "bg-[#16A34A] text-white"
                      : "bg-[#F1F5F9] text-[#94A3B8] group-hover:bg-[#E2E8F0]"
                  }`}
                >
                  {isDone && !isActive ? (
                    <Check className="w-3 h-3 stroke-[3]" />
                  ) : (
                    step.num
                  )}
                </div>

                <span
                  className={`whitespace-nowrap tracking-tight ${
                    isActive
                      ? "text-[#0F172A] font-bold"
                      : isDone
                      ? "text-[#16A34A] font-semibold"
                      : isLocked
                      ? "text-[#94A3B8]"
                      : "text-[#64748B]"
                  }`}
                >
                  {step.name}
                </span>
              </Link>

              {idx < steps.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1] flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
