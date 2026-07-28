"use client";

import React from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
import LabCard from "@/components/ui/LabCard";
import TechBadge from "@/components/ui/TechBadge";
import FloatingBadge from "@/components/ui/FloatingBadge";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { Leaf, Droplets, Zap, Recycle, Globe, ArrowUpRight, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

const EarthImpact3D = dynamic(
  () => import("@/components/3d/EarthAnalytics3D"),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#F8FAFC] rounded-2xl" /> }
);

export default function CarbonImpactPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-[#2563EB] mb-6 hover:underline font-semibold">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Vision Overview</span>
          </Link>

          <SectionHeader
            badge="QUANTIFIED ENVIRONMENTAL IMPACT"
            title="ESG Carbon Analytics & Circular Savings"
            subtitle="Real-time environmental telemetry calculating Scope 3 emissions avoided, virgin mining displacement, and energy conservation across global enterprise partners."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-12">
            {/* Photorealistic 3D Wireframe Earth Box */}
            <div className="lg:col-span-6 h-[460px] relative rounded-3xl bg-white border border-[#E2E8F0] shadow-xl overflow-hidden">
              <EarthImpact3D />

              {/* Floating Telemetry Badges on 3D Earth */}
              <div className="absolute top-6 left-6 z-20">
                <FloatingBadge
                  icon={<Leaf className="w-4 h-4 text-[#16A34A]" />}
                  label="CO₂ Prevented"
                  value="42,850 Tons"
                  variant="green"
                />
              </div>

              <div className="absolute top-6 right-6 z-20">
                <FloatingBadge
                  icon={<Globe className="w-4 h-4 text-[#2563EB]" />}
                  label="Recycling Nodes"
                  value="128 Facilities"
                  variant="blue"
                />
              </div>

              <div className="absolute bottom-6 left-6 z-20">
                <FloatingBadge
                  icon={<Zap className="w-4 h-4 text-[#2563EB]" />}
                  label="Clean Energy Saved"
                  value="128 GWh"
                  variant="blue"
                />
              </div>

              <div className="absolute bottom-6 right-6 z-20">
                <FloatingBadge
                  icon={<Recycle className="w-4 h-4 text-[#16A34A]" />}
                  label="Components Reused"
                  value="1.4 Million"
                  variant="green"
                />
              </div>
            </div>

            {/* Environmental Impact Stat Cards */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <LabCard className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center font-bold">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs text-[#64748B]">CO₂ Emissions Prevented</span>
                </div>
                <span className="font-mono text-3xl font-extrabold text-[#0F172A]">42,850 Tons</span>
                <span className="text-xs font-mono text-[#16A34A] block mt-2 font-bold">+14.2% Month-over-Month</span>
              </LabCard>

              <LabCard className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs text-[#64748B]">Clean Energy Saved</span>
                </div>
                <span className="font-mono text-3xl font-extrabold text-[#0F172A]">128 GWh</span>
                <span className="text-xs font-mono text-[#2563EB] block mt-2 font-bold">Equivalent to 24,000 Homes</span>
              </LabCard>

              <LabCard className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs text-[#64748B]">Water Conserved</span>
                </div>
                <span className="font-mono text-3xl font-extrabold text-[#0F172A]">850,000 Liters</span>
                <span className="text-xs font-mono text-[#2563EB] block mt-2 font-bold">Zero Chemical Runoff</span>
              </LabCard>

              <LabCard className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FEF9C3] text-[#C9A227] flex items-center justify-center font-bold">
                    <Recycle className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs text-[#64748B]">Components Reused</span>
                </div>
                <span className="font-mono text-3xl font-extrabold text-[#0F172A]">1.4 Million</span>
                <span className="text-xs font-mono text-[#C9A227] block mt-2 font-bold">Landfill Diverted Direct</span>
              </LabCard>
            </div>
          </div>

          {/* ESG Audit Certificate Section */}
          <LabCard className="p-8 bg-white border-[#E2E8F0] shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-[#0F172A]">Automated ESG Audit Reports</h3>
                  <p className="text-xs text-[#64748B] font-mono mt-1">
                    Export verified Scope 3 carbon reduction proofs signed with Polygon blockchain hashes.
                  </p>
                </div>
              </div>

              <Link href="/console">
                <PrimaryButton variant="primary" size="md">
                  <span>Export ESG Compliance Report</span>
                  <ArrowUpRight className="w-4 h-4" />
                </PrimaryButton>
              </Link>
            </div>
          </LabCard>
        </div>
      </section>

      <Footer />
    </main>
  );
}
