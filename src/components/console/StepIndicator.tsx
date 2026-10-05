"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Check, ChevronRight, Lock } from "lucide-react";
import { useAnalysisSession } from "@/lib/context/AnalysisSessionContext";

export default function StepIndicator() {
  const { session, isNewAnalysis, setActiveStep } = useAnalysisSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const queryAnalysisId = searchParams.get("analysisId") || searchParams.get("sessionId");

  const effectiveAnalysisId = queryAnalysisId || (!isNewAnalysis ? session?.id : "");
  const sessionParam = effectiveAnalysisId ? `&analysisId=${encodeURIComponent(effectiveAnalysisId)}` : "";
  const queryPrefix = effectiveAnalysisId ? `?analysisId=${encodeURIComponent(effectiveAnalysisId)}` : "";

  const steps = [
    { num: "01", name: "Capture", path: "/console", href: `/console` },
    {
      num: "02",
      name: "AI Detection",
      path: "/console/processing",
      href: `/console/processing${queryPrefix}`,
    },
    {
      num: "03",
      name: "PCB Analysis",
      path: "/console/results",
      tab: "pcb",
      href: `/console/results?tab=pcb${sessionParam}`,
    },
    {
      num: "04",
      name: "Health & RUL",
      path: "/console/results",
      tab: "rul",
      href: `/console/results?tab=rul${sessionParam}`,
    },
    {
      num: "05",
      name: "Material Recovery",
      path: "/console/results",
      tab: "metals",
      href: `/console/results?tab=metals${sessionParam}`,
    },
    {
      num: "06",
      name: "Repair Intelligence",
      path: "/console/results",
      tab: "repair",
      href: `/console/results?tab=repair${sessionParam}`,
    },
    {
      num: "07",
      name: "Digital Passport",
      path: "/console/passport",
      href: `/console/passport${queryPrefix}`,
    },
    {
      num: "08",
      name: "Impact Report",
      path: "/console/report",
      href: `/console/report${queryPrefix}`,
    },
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
      return 2; // default overview maps to step 2-3
    }
    return 0;
  };

  const activeIdx = getActiveIndex();

  // Completion logic strictly adhering to session lifecycle
  const isStepCompleted = (idx: number): boolean => {
    // If user is on /console in new analysis mode, NO future step is complete
    if (isNewAnalysis && pathname === "/console") {
      return false;
    }

    if (pathname === "/console/processing") {
      return idx === 0; // Only capture is complete while processing
    }

    const status = session.status;
    if (status === "COMPLETED") return true;

    switch (idx) {
      case 0:
        return status !== "DRAFT";
      case 1:
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
      case 2:
        return [
          "PCB_ANALYSIS_COMPLETE",
          "RUL_COMPLETE",
          "MATERIAL_ANALYSIS_COMPLETE",
          "REPAIR_COMPLETE",
          "PASSPORT_READY",
          "REPORT_READY",
          "COMPLETED",
        ].includes(status);
      case 3:
        return [
          "RUL_COMPLETE",
          "MATERIAL_ANALYSIS_COMPLETE",
          "REPAIR_COMPLETE",
          "PASSPORT_READY",
          "REPORT_READY",
          "COMPLETED",
        ].includes(status);
      case 4:
        return [
          "MATERIAL_ANALYSIS_COMPLETE",
          "REPAIR_COMPLETE",
          "PASSPORT_READY",
          "REPORT_READY",
          "COMPLETED",
        ].includes(status);
      case 5:
        return [
          "REPAIR_COMPLETE",
          "PASSPORT_READY",
          "REPORT_READY",
          "COMPLETED",
        ].includes(status);
      case 6:
        return ["PASSPORT_READY", "REPORT_READY", "COMPLETED"].includes(status);
      case 7:
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
          // If in new analysis or future step is not done, lock it
          const isLocked =
            (isNewAnalysis && idx > 0) ||
            (pathname === "/console/processing" && idx > 1) ||
            (!isDone && !isActive && idx > activeIdx);

          const StepBadge = (
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all flex-shrink-0 ${
                isActive
                  ? "bg-[#2563EB] text-white shadow-sm ring-2 ring-blue-200"
                  : isDone
                  ? "bg-[#16A34A] text-white"
                  : isLocked
                  ? "bg-[#F1F5F9] text-[#94A3B8]"
                  : "bg-[#F1F5F9] text-[#64748B]"
              }`}
            >
              {isDone && !isActive ? (
                <Check className="w-3 h-3 stroke-[3]" />
              ) : isLocked && !isActive ? (
                <Lock className="w-2.5 h-2.5" />
              ) : (
                step.num
              )}
            </div>
          );

          const StepText = (
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
          );

          return (
            <React.Fragment key={step.num}>
              {isLocked ? (
                <div
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono text-[#94A3B8] cursor-not-allowed select-none opacity-75"
                  title={`${step.num} ${step.name} (Locked - Complete earlier stages first)`}
                >
                  {StepBadge}
                  {StepText}
                </div>
              ) : (
                <Link
                  href={step.href}
                  onClick={() => setActiveStep(idx + 1)}
                  className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all text-xs font-mono select-none ${
                    isActive
                      ? "bg-[#EFF6FF] text-[#2563EB] font-bold ring-1 ring-[#BFDBFE]"
                      : isDone
                      ? "text-[#16A34A] hover:bg-[#F0FDF4]"
                      : "text-[#475569] hover:bg-[#F8FAFC]"
                  }`}
                  title={`${step.num} ${step.name}${
                    isDone ? " (Completed)" : isActive ? " (Active)" : ""
                  }`}
                >
                  {StepBadge}
                  {StepText}
                </Link>
              )}

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
