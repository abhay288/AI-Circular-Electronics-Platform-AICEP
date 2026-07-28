"use client";

import Link from "next/link";
import { Cpu, Mail, ArrowUpRight, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0F172A] text-white pt-20 pb-12 relative z-10 overflow-hidden border-t border-slate-800">
      {/* Subtle background glow radial behind footer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#2563EB]/10 blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-slate-800/80">

          {/* Brand Column */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-3 w-fit group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#3B82F6] flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="font-heading text-xl font-bold text-white block leading-tight">EcoIntel</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#60A5FA] font-semibold">CIRCULAR AI PLATFORM</span>
              </div>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Building the AI-powered operating system for circular electronics — hardware recycling, PCB reconstruction, and sustainable asset recovery.
            </p>
            <div className="flex items-center gap-2.5 text-xs font-mono text-[#4ADE80] bg-[#16A34A]/10 border border-[#16A34A]/30 px-4 py-2 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
              <span className="font-semibold">Polygon Mainnet Verified</span>
            </div>
          </div>

          {/* Platform Pages */}
          <div className="md:col-span-2">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400 font-bold mb-6">
              Platform
            </h4>
            <ul className="flex flex-col gap-3.5">
              {[
                { href: "/platform/detection", label: "AI Component Detection" },
                { href: "/platform/reconstruction", label: "PCB Reconstruction" },
                { href: "/platform/rul", label: "Remaining Useful Life" },
                { href: "/platform/metals", label: "Precious Metal Intelligence" },
                { href: "/platform/passport", label: "Blockchain Passport" },
                { href: "/platform/repair", label: "Repair Intelligence" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-300 hover:text-[#60A5FA] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ecosystem */}
          <div className="md:col-span-2">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400 font-bold mb-6">
              Ecosystem
            </h4>
            <ul className="flex flex-col gap-3.5">
              {[
                { href: "/marketplace", label: "B2B Hardware Exchange" },
                { href: "/impact", label: "Carbon Impact & ESG" },
                { href: "/research", label: "Patents & Research" },
                { href: "/about", label: "About EcoIntel" },
                { href: "/console", label: "Console Dashboard" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-300 hover:text-[#60A5FA] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Enterprise CTA */}
          <div className="md:col-span-4 flex flex-col gap-5">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400 font-bold mb-1">
              Enterprise Integration
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Deploy EcoIntel AI inspection pipelines directly into your high-volume recycling facility or manufacturing line.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2.5 text-sm font-semibold px-6 py-3 rounded-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 w-fit"
            >
              <Mail className="w-4 h-4" />
              <span>Contact AI Solutions Team</span>
            </Link>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <p>© {new Date().getFullYear()} EcoIntel Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            {["Privacy Policy", "Terms of Service", "Security Audit"].map((item) => (
              <span key={item} className="hover:text-white cursor-pointer transition-colors">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
