"use client";

import Link from "next/link";
import { Cpu, Github, ArrowUpRight, ShieldCheck, Mail, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#E2E8F0] pt-16 pb-12 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-[#E2E8F0]">
          {/* Brand Column */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-md">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="font-heading text-xl font-bold text-[#0F172A]">
                EcoIntel
              </span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed max-w-sm">
              Intelligence for the Circular Electronics Economy. Building the AI-powered operating system for hardware recycling, PCB reconstruction, and sustainable asset recovery.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-[#16A34A] bg-[#DCFCE7] px-3 py-1.5 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span>Polygon Blockchain Mainnet Verified</span>
            </div>
          </div>

          {/* Platform Pages */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-[#0F172A] font-bold mb-4">
              Platform
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs text-[#64748B]">
              <li><Link href="/platform/detection" className="hover:text-[#2563EB] transition-colors">AI Component Detection</Link></li>
              <li><Link href="/platform/reconstruction" className="hover:text-[#2563EB] transition-colors">PCB Reconstruction</Link></li>
              <li><Link href="/platform/rul" className="hover:text-[#2563EB] transition-colors">Remaining Useful Life (RUL)</Link></li>
              <li><Link href="/platform/metals" className="hover:text-[#2563EB] transition-colors">Precious Metal Intelligence</Link></li>
              <li><Link href="/platform/passport" className="hover:text-[#2563EB] transition-colors">Blockchain Passport</Link></li>
              <li><Link href="/platform/repair" className="hover:text-[#2563EB] transition-colors">Repair Intelligence</Link></li>
            </ul>
          </div>

          {/* Product & Research */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-[#0F172A] font-bold mb-4">
              Ecosystem
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs text-[#64748B]">
              <li><Link href="/marketplace" className="hover:text-[#2563EB] transition-colors">B2B Hardware Marketplace</Link></li>
              <li><Link href="/impact" className="hover:text-[#2563EB] transition-colors">Carbon Impact & ESG</Link></li>
              <li><Link href="/research" className="hover:text-[#2563EB] transition-colors">Patents & Research</Link></li>
              <li><Link href="/about" className="hover:text-[#2563EB] transition-colors">About EcoIntel</Link></li>
              <li><Link href="/console" className="hover:text-[#2563EB] transition-colors">Operational Console</Link></li>
            </ul>
          </div>

          {/* Enterprise */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-[#0F172A] font-bold mb-4">
              Enterprise Integration
            </h4>
            <p className="text-xs text-[#64748B] mb-4 leading-relaxed">
              Deploy EcoIntel AI inspection pipelines directly into high-volume recycling and manufacturing lines.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-xs font-mono px-4 py-2.5 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-all font-medium"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact AI Lab</span>
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] font-mono gap-4">
          <p>© {new Date().getFullYear()} EcoIntel Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-[#0F172A] cursor-pointer">Privacy Policy</span>
            <span className="hover:text-[#0F172A] cursor-pointer">Terms of Service</span>
            <span className="hover:text-[#0F172A] cursor-pointer">Security Audit</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
