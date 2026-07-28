"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
import LabCard from "@/components/ui/LabCard";
import PrimaryButton from "@/components/ui/PrimaryButton";
import TechBadge from "@/components/ui/TechBadge";
import { Cpu, Activity, ShieldCheck, Coins, RefreshCw, Radio, Layers, Database, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ConsoleDashboardPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(100);

  const triggerScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return prev + 25;
      });
    }, 300);
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#E2E8F0]">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] font-mono text-xs font-semibold mb-2">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>OPERATIONAL CONSOLE LIVE</span>
              </div>
              <h1 className="font-heading text-3xl font-bold text-[#0F172A]">EcoIntel Facility Dashboard</h1>
              <p className="text-xs font-mono text-[#64748B]">Facility ID: TOKYO-LAB-ALPHA-09 | Node: Polygon Mainnet Connected</p>
            </div>

            <div className="flex items-center gap-3">
              <PrimaryButton variant="primary" size="sm" onClick={triggerScan}>
                <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
                <span>{isScanning ? `Scanning ${scanProgress}%` : "Run Batch Scan"}</span>
              </PrimaryButton>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <LabCard className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-[#64748B]">Active AI Vision Stream</span>
                <TechBadge label="YOLOv8 Live" variant="blue" />
              </div>
              <span className="font-mono text-3xl font-extrabold text-[#0F172A]">2,846 / min</span>
              <span className="text-xs font-mono text-[#16A34A] block mt-1 font-semibold">99.4% Precision</span>
            </LabCard>

            <LabCard className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-[#64748B]">PCBs Reconstructed</span>
                <TechBadge label="GGNT Netlist" variant="blue" />
              </div>
              <span className="font-mono text-3xl font-extrabold text-[#2563EB]">8,450 Boards</span>
              <span className="text-xs font-mono text-[#2563EB] block mt-1 font-semibold">100% Gerber Exported</span>
            </LabCard>

            <LabCard className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-[#64748B]">Precious Gold Value</span>
                <TechBadge label="$78.40 / g" variant="gold" />
              </div>
              <span className="font-mono text-3xl font-extrabold text-[#C9A227]">$18,740 USD</span>
              <span className="text-xs font-mono text-[#C9A227] block mt-1 font-semibold">238.8g Pure Gold</span>
            </LabCard>

            <LabCard className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-[#64748B]">Polygon DPP Minted</span>
                <TechBadge label="Polygon POS" variant="green" />
              </div>
              <span className="font-mono text-3xl font-extrabold text-[#16A34A]">73,420 DPPs</span>
              <span className="text-xs font-mono text-[#16A34A] block mt-1 font-semibold">Immutable On-Chain</span>
            </LabCard>
          </div>

          {/* Operational Log Feed Table */}
          <LabCard className="p-8">
            <h3 className="font-heading text-lg font-bold text-[#0F172A] mb-4">Real-Time Facility Hardware Telemetry Log</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                    <th className="pb-3">Scan ID</th>
                    <th className="pb-3">Board Model</th>
                    <th className="pb-3">Detected Components</th>
                    <th className="pb-3">Health Grade</th>
                    <th className="pb-3">Est. Gold Yield</th>
                    <th className="pb-3">Polygon Hash</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {[
                    { id: "SCAN-88391", model: "NVIDIA H100 PCB Base", count: 48, health: "98.4% (A+)", gold: "0.48g", hash: "0x7f9a88...", status: "Pass" },
                    { id: "SCAN-88392", model: "Apple M2 Max Motherboard", count: 36, health: "94.2% (A)", gold: "0.32g", hash: "0x3b1c92...", status: "Pass" },
                    { id: "SCAN-88393", model: "Server VRM Power Stage", count: 18, health: "88.1% (B+)", gold: "0.14g", hash: "0x9d4a11...", status: "Reconstructed" },
                  ].map((row) => (
                    <tr key={row.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 font-bold text-[#0F172A]">{row.id}</td>
                      <td className="py-3 text-[#475569]">{row.model}</td>
                      <td className="py-3 text-[#2563EB]">{row.count} Chips</td>
                      <td className="py-3 text-[#16A34A] font-bold">{row.health}</td>
                      <td className="py-3 text-[#C9A227] font-bold">{row.gold}</td>
                      <td className="py-3 text-[#64748B]">{row.hash}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded bg-[#DCFCE7] text-[#16A34A] font-bold">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </LabCard>
        </div>
      </section>

      <Footer />
    </main>
  );
}
