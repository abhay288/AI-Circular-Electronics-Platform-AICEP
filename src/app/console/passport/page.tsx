"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAnalysisSession } from "@/lib/context/AnalysisSessionContext";
import DigitalPassportWorkspace from "@/components/console/DigitalPassportWorkspace";
import { ShieldCheck } from "lucide-react";

function DigitalPassportContent() {
  const searchParams = useSearchParams();
  const { session } = useAnalysisSession();

  const queryAnalysisId = searchParams.get("analysisId") || searchParams.get("sessionId");
  const effectiveAnalysisId = queryAnalysisId || session?.id || "ECI-2026-7740";

  return (
    <div className="flex-1 py-8 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-6 text-[#0F172A]">
      <DigitalPassportWorkspace
        analysisId={effectiveAnalysisId}
        initialSessionData={session}
      />
    </div>
  );
}

export default function DigitalPassportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 py-16 flex flex-col items-center justify-center">
          <ShieldCheck className="w-10 h-10 text-[#2563EB] animate-pulse mb-3" />
          <span className="font-mono text-xs font-bold text-[#0F172A]">Loading Digital Product Passport...</span>
        </div>
      }
    >
      <DigitalPassportContent />
    </Suspense>
  );
}
