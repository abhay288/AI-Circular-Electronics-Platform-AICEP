"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Cpu,
  Layers,
  Activity,
  Coins,
  ShieldCheck,
  ShoppingCart,
  Leaf,
  BarChart3,
  Users,
  Settings,
  Bell,
  Search,
  CheckCircle2,
  RefreshCw,
  Zap,
} from "lucide-react";

export default function ConsoleDashboard() {
  const [activeTab, setActiveTab] = useState("analytics");

  const sidebarLinks = [
    { id: "analytics", name: "System Analytics", icon: BarChart3 },
    { id: "detection", name: "AI Job Queue", icon: Cpu },
    { id: "pcb", name: "PCB Management", icon: Layers },
    { id: "rul", name: "RUL Health Engine", icon: Activity },
    { id: "metals", name: "Urban Mining Yields", icon: Coins },
    { id: "passports", name: "Polygon Passports", icon: ShieldCheck },
    { id: "marketplace", name: "Marketplace Orders", icon: ShoppingCart },
    { id: "settings", name: "Facility Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#090D16] text-slate-100 font-sans overflow-hidden">
      
      {/* Dark Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#0F172A] flex flex-col justify-between p-5">
        <div className="space-y-8">
          
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#3B82F6] flex items-center justify-center text-white shadow-md">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-bold tracking-tight text-white">EcoIntel</span>
              <span className="text-[9px] font-mono text-[#60A5FA] -mt-1 tracking-widest uppercase font-bold">ENTERPRISE CONSOLE</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {sidebarLinks.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? "bg-[#2563EB] text-white shadow-lg shadow-blue-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs">
              AD
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Admin Operator</span>
              <span className="text-[9px] font-mono text-emerald-400">Polygon Wallet Connected</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Console Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Topbar */}
        <header className="h-16 border-b border-slate-800/80 bg-[#0F172A]/80 backdrop-blur-xl px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 w-96">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Global Search PCBs, Passports, or Token IDs..."
              className="bg-transparent text-xs font-mono text-white placeholder-slate-500 focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Celery Worker Queue Active</span>
            </div>
            <button className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dashboard Operational Body */}
        <div className="p-8 space-y-8">
          
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-mono text-slate-400">Total Scanned PCBs</span>
              <span className="font-mono text-3xl font-extrabold text-white block">120,492</span>
              <span className="text-[10px] font-mono text-emerald-400">↑ 12.4% this week</span>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-mono text-slate-400">Active AI Detection Jobs</span>
              <span className="font-mono text-3xl font-extrabold text-[#60A5FA] block">14 Running</span>
              <span className="text-[10px] font-mono text-blue-400">YOLOv11 Inference Queue</span>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-mono text-slate-400">Minted Polygon Passports</span>
              <span className="font-mono text-3xl font-extrabold text-white block">73,810</span>
              <span className="text-[10px] font-mono text-emerald-400">100% Polygon Mainnet</span>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-mono text-slate-400">E-Waste Diverted (Tons)</span>
              <span className="font-mono text-3xl font-extrabold text-emerald-400 block">96.3 Tons</span>
              <span className="text-[10px] font-mono text-emerald-400">Scope 3 ESG Certified</span>
            </div>
          </div>

          {/* AI Worker Task Queue Monitor */}
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-white">Active Background AI Job Queue</h3>
              <span className="font-mono text-xs text-[#60A5FA] font-bold">Celery + Redis Broker</span>
            </div>

            <div className="space-y-3">
              {[
                { id: "task_98421", name: "50-Micron Spectro-Spatial Scan", status: "COMPLETED", duration: "42ms", batch: "Batch-9842 (TerraCycle)" },
                { id: "task_98422", name: "Gerber Netlist CAD Synthesis", status: "RUNNING", duration: "112ms", batch: "Batch-9843 (LUMAFUSE)" },
                { id: "task_98423", name: "Polygon ERC-721 Passport Mint", status: "QUEUED", duration: "Pending", batch: "Batch-9844 (ReMaterials)" },
              ].map((job) => (
                <div key={job.id} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-blue-400 font-bold">{job.id}</span>
                    <span className="text-white font-semibold">{job.name}</span>
                  </div>
                  <span className="text-slate-400">{job.batch}</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                    job.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" :
                    job.status === "RUNNING" ? "bg-blue-500/20 text-blue-400 border border-blue-500/40 animate-pulse" :
                    "bg-slate-700 text-slate-300"
                  }`}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
