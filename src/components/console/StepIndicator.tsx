"use client";

import React from "react";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { useAnalysisSession } from "@/lib/context/AnalysisSessionContext";

export default function StepIndicator() {
  const { activeStep, setActiveStep, session } = useAnalysisSession();

  const steps = [
    { num: "01", name: "Capture", href: "/console" },
    { num: "02", name: "AI Detection", href: "/console/processing" },
    { num: "03", name: "PCB Analysis", href: "/console/results?tab=pcb" },
    { num: "04", name: "Health & RUL", href: "/console/results?tab=rul" },
    { num: "05", name: "Material Recovery", href: "/console/results?tab=metals" },
    { num: "06", name: "Repair Intelligence", href: "/console/results?tab=repair" },
    { num: "07", name: "Digital Passport", href: "/console/passport" },
    { num: "08", name: "Impact Report", href: "/console/report" },
  ];

  const isCompleted = (index: number) => {
    // If analysis is completed, steps 1-8 are accessible
    if (session.status === "completed") return index + 1 <= activeStep || activeStep === 8;
    return index + 1 < activeStep;
  };

  const isActive = (index: number) => index + 1 === activeStep;

  return (
    <div className="w-full bg-white border-b border-[#E2E8F0] px-4 sm:px-8 py-2.5 overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between min-w-[780px]">
        {steps.map((step, idx) => {
          const active = isActive(idx);
          const completed = isCompleted(idx);

          return (
            <React.Fragment key={step.num}>
              <Link
                href={step.href}
                onClick={() => setActiveStep(idx + 1)}
                className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all text-xs font-mono ${
                  active
                    ? "bg-[#EFF6FF] text-[#2563EB] font-bold"
                    : completed
                    ? "text-[#16A34A] hover:bg-[#F8FAFC]"
                    : "text-[#94A3B8] hover:text-[#475569]"
                }`}
              >
                {/* Step Circle Badge */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    active
                      ? "bg-[#2563EB] text-white shadow-sm"
                      : completed
                      ? "bg-[#16A34A] text-white"
                      : "bg-[#F1F5F9] text-[#64748B] group-hover:bg-[#E2E8F0]"
                  }`}
                >
                  {completed ? <Check className="w-3 h-3 stroke-[3]" /> : step.num}
                </div>

                <span
                  className={`whitespace-nowrap tracking-tight ${
                    active ? "text-[#0F172A] font-bold" : completed ? "text-[#16A34A] font-semibold" : "text-[#64748B]"
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
