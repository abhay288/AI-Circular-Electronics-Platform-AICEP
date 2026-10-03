"use client";

import React from "react";
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
        <ConsoleHeader />

        {/* Persistent Progress Step Indicator */}
        <StepIndicator />

        {/* Dynamic Workflow Stage Content */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>

        {/* Global Modal for Listing Components */}
        <MarketplaceListingModal />
      </div>
    </AnalysisSessionProvider>
  );
}
