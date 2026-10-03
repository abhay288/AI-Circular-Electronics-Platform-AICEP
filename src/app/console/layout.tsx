"use client";

import React, { Suspense } from "react";
import { AnalysisSessionProvider } from "@/lib/context/AnalysisSessionContext";
import ConsoleHeader from "@/components/console/ConsoleHeader";
import StepIndicator from "@/components/console/StepIndicator";
import MarketplaceListingModal from "@/components/console/MarketplaceListingModal";

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AnalysisSessionProvider>
      <div className="min-h-screen bg-[#F7F9FC] text-[#0F172A] flex flex-col font-sans selection:bg-[#2563EB]/15 selection:text-[#2563EB]">
        {/* Persistent Clean White Header */}
        <Suspense fallback={<div className="h-16 bg-white border-b border-[#E2E8F0]" />}>
          <ConsoleHeader />
        </Suspense>

        {/* Persistent Progress Step Indicator */}
        <Suspense fallback={<div className="h-12 bg-white border-b border-[#E2E8F0]" />}>
          <StepIndicator />
        </Suspense>

        {/* Dynamic Workflow Stage Content */}
        <main className="flex-1 flex flex-col">
          <Suspense
            fallback={
              <div className="flex-1 py-16 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin mb-3" />
                <span className="font-mono text-xs font-bold text-[#0F172A]">Loading Stage...</span>
              </div>
            }
          >
            {children}
          </Suspense>
        </main>

        {/* Global Modal for Listing Components */}
        <MarketplaceListingModal />
      </div>
    </AnalysisSessionProvider>
  );
}
