"use client";

import Link from "next/link";
import { Cpu, Mail, ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#E2E8F0] pt-16 pb-10 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#F1F5F9]">

          {/* Brand Column */}
          <div className="md:col-span-4 flex flex-col gap-5">
            <Link href="/" className="flex items-center gap-3 w-fit group">
              <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="font-heading text-lg font-bold text-[#0F172A] block leading-tight">EcoIntel</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#94A3B8]">Circular AI</span>
              </div>
            </Link>
            <p className="text-sm text-[#64748B] leading-relaxed max-w-xs">
              Building the AI-powered operating system for circular electronics — hardware recycling, PCB reconstruction, and sustainable asset recovery.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-[#16A34A] bg-[#DCFCE7] border border-[#86EFAC] px-3.5 py-2 rounded-full w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
              <span>Polygon Mainnet Verified</span>
            </div>
          </div>

          {/* Platform */}
          <div className="md:col-span-2">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#94A3B8] font-semibold mb-5">
              Platform
            </h4>
            <ul className="flex flex-col gap-3">
              {[
                { href: "/platform/detection", label: "AI Detection" },
                { href: "/platform/reconstruction", label: "PCB Reconstruction" },
                { href: "/platform/rul", label: "Remaining Useful Life" },
                { href: "/platform/metals", label: "Metal Intelligence" },
                { href: "/platform/passport", label: "Blockchain Passport" },
                { href: "/platform/repair", label: "Repair Intelligence" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-[#475569] hover:text-[#2563EB] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ecosystem */}
          <div className="md:col-span-2">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#94A3B8] font-semibold mb-5">
              Ecosystem
            </h4>
            <ul className="flex flex-col gap-3">
              {[
                { href: "/marketplace", label: "Marketplace" },
                { href: "/impact", label: "Carbon Impact" },
                { href: "/research", label: "Research & Patents" },
                { href: "/about", label: "About EcoIntel" },
                { href: "/console", label: "Console Dashboard" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-[#475569] hover:text-[#2563EB] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Enterprise CTA */}
          <div className="md:col-span-4">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#94A3B8] font-semibold mb-5">
              Enterprise Integration
            </h4>
            <p className="text-sm text-[#475569] mb-5 leading-relaxed">
              Deploy EcoIntel AI inspection pipelines directly into your recycling facility or manufacturing line.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] hover:border-[#BFDBFE] hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-all duration-200"
            >
              <Mail className="w-4 h-4" />
              <span>Contact AI Lab</span>
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-mono text-[#94A3B8]">
            © {new Date().getFullYear()} EcoIntel Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs font-mono text-[#94A3B8]">
            {["Privacy Policy", "Terms of Service", "Security Audit"].map((item) => (
              <span key={item} className="hover:text-[#475569] cursor-pointer transition-colors">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
