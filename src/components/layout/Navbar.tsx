"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cpu,
  ChevronDown,
  Layers,
  Activity,
  Coins,
  ShieldCheck,
  Wrench,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const platformSubPages = [
    {
      name: "AI Component Detection",
      href: "/platform/detection",
      desc: "Sub-millimeter spectro-spatial neural scanning",
      icon: Cpu,
    },
    {
      name: "PCB Reconstruction",
      href: "/platform/reconstruction",
      desc: "Generative CAD topology & Gerber netlists",
      icon: Layers,
    },
    {
      name: "Remaining Useful Life (RUL)",
      href: "/platform/rul",
      desc: "Physics-informed health prediction models",
      icon: Activity,
    },
    {
      name: "Precious Metal Intelligence",
      href: "/platform/metals",
      desc: "Spectrometry Gold, Silver & Palladium yields",
      icon: Coins,
    },
    {
      name: "Blockchain Passport",
      href: "/platform/passport",
      desc: "Polygon ERC-721 Digital Product Passports",
      icon: ShieldCheck,
    },
    {
      name: "Repair Intelligence",
      href: "/platform/repair",
      desc: "AI-guided reflow & component reuse recommendations",
      icon: Wrench,
    },
  ];

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Marketplace", href: "/marketplace" },
    { name: "Carbon Impact", href: "/impact" },
    { name: "Research & Tech", href: "/research" },
    { name: "About Us", href: "/about" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 pointer-events-none transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
        {/* Floating Ultra-Glassmorphism Navbar Container */}
        <nav
          className={`w-full flex items-center justify-between px-6 py-3 rounded-full border transition-all duration-300 backdrop-blur-2xl ${
            scrolled
              ? "bg-white/80 border-white/80 shadow-[0_12px_40px_-10px_rgba(15,23,42,0.12),inset_0_1px_0_0_rgba(255,255,255,0.9)]"
              : "bg-white/65 border-white/70 shadow-[0_8px_30px_-5px_rgba(15,23,42,0.06),inset_0_1px_0_0_rgba(255,255,255,0.8)]"
          }`}
        >
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#3B82F6] flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-bold tracking-tight text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                EcoIntel
              </span>
              <span className="text-[9px] font-mono text-[#64748B] -mt-1 tracking-widest uppercase font-semibold">
                CIRCULAR AI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-8">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                pathname === "/" ? "text-[#2563EB] font-semibold" : "text-[#475569] hover:text-[#0F172A]"
              }`}
            >
              Home
            </Link>

            {/* Platform Sub-Menu Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setPlatformDropdownOpen(true)}
              onMouseLeave={() => setPlatformDropdownOpen(false)}
            >
              <button
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors py-1 cursor-pointer ${
                  pathname.startsWith("/platform")
                    ? "text-[#2563EB] font-semibold"
                    : "text-[#475569] hover:text-[#0F172A]"
                }`}
              >
                <span>Platform</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    platformDropdownOpen ? "rotate-180 text-[#2563EB]" : ""
                  }`}
                />
              </button>

              {/* Platform Glass Dropdown Panel */}
              {platformDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[580px] pointer-events-auto">
                  <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white/80 shadow-2xl shadow-slate-900/10 grid grid-cols-2 gap-2">
                    {platformSubPages.map((sub) => {
                      const IconComp = sub.icon;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setPlatformDropdownOpen(false)}
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mt-0.5 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                              {sub.name}
                            </span>
                            <span className="text-[11px] text-[#64748B] leading-snug">
                              {sub.desc}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {navLinks.slice(1).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href ? "text-[#2563EB] font-semibold" : "text-[#475569] hover:text-[#0F172A]"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/console">
              <PrimaryButton variant="primary" size="sm" className="px-5 py-2 text-xs shadow-md shadow-blue-500/10">
                <span>Launch Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </PrimaryButton>
            </Link>
          </div>

          {/* Mobile Drawer Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-4 top-24 z-40 p-6 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white/80 shadow-2xl flex flex-col gap-4 pointer-events-auto">
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-[#0F172A] py-2 border-b border-[#F1F5F9]"
            >
              Home
            </Link>
            <div className="pt-2 font-mono text-xs text-[#2563EB] uppercase tracking-wider font-bold">
              Platform Modules
            </div>
            {platformSubPages.map((sub) => (
              <Link
                key={sub.href}
                href={sub.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-[#475569] hover:text-[#2563EB] py-1.5 pl-3 border-l-2 border-transparent hover:border-[#2563EB]"
              >
                {sub.name}
              </Link>
            ))}
            {navLinks.slice(1).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-[#0F172A] py-2 border-b border-[#F1F5F9]"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-4 flex items-center justify-between">
            <Link href="/console" onClick={() => setMobileMenuOpen(false)} className="w-full">
              <PrimaryButton variant="primary" size="md" className="w-full text-xs">
                Launch Console
              </PrimaryButton>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
