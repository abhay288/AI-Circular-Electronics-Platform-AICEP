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
  Leaf,
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
        
        {/* Sleek Dark Navy Enterprise Glass Navbar Container */}
        <nav
          className={`w-full flex items-center justify-between px-6 py-3 rounded-full transition-all duration-300 backdrop-blur-2xl ${
            scrolled
              ? "bg-[#0F172A]/95 text-white border border-slate-800 shadow-[0_16px_40px_-10px_rgba(15,23,42,0.3)]"
              : "bg-[#0F172A]/90 text-white border border-slate-800/90 shadow-[0_10px_30px_-5px_rgba(15,23,42,0.2)]"
          }`}
        >
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#3B82F6] flex items-center justify-center text-white shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform duration-200">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-bold tracking-tight text-white group-hover:text-[#60A5FA] transition-colors">
                EcoIntel
              </span>
              <span className="text-[9px] font-mono text-[#60A5FA] -mt-1 tracking-widest uppercase font-bold">
                CIRCULAR AI PLATFORM
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1.5">
            <Link
              href="/"
              className={`px-4 py-2 rounded-full text-[13px] font-medium tracking-tight transition-all ${
                pathname === "/"
                  ? "bg-white/10 text-white font-semibold border border-white/15"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
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
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium tracking-tight transition-all cursor-pointer ${
                  pathname.startsWith("/platform")
                    ? "bg-white/10 text-white font-semibold border border-white/15"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>Platform</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    platformDropdownOpen ? "rotate-180 text-[#60A5FA]" : ""
                  }`}
                />
              </button>

              {/* Platform Dropdown Panel */}
              {platformDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[580px] pointer-events-auto">
                  <div className="p-4 rounded-3xl bg-[#0F172A] border border-slate-800 shadow-2xl shadow-black/40 grid grid-cols-2 gap-2">
                    {platformSubPages.map((sub) => {
                      const IconComp = sub.icon;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setPlatformDropdownOpen(false)}
                          className="flex items-start gap-3 p-3.5 rounded-2xl hover:bg-slate-800/60 transition-all duration-200 group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 text-[#60A5FA] flex items-center justify-center mt-0.5 group-hover:bg-[#2563EB] group-hover:text-white transition-all duration-200 shadow-sm">
                            <IconComp className="w-4.5 h-4.5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white group-hover:text-[#60A5FA] transition-colors">
                              {sub.name}
                            </span>
                            <span className="text-[11px] text-slate-400 leading-snug mt-0.5">
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
                className={`px-4 py-2 rounded-full text-[13px] font-medium tracking-tight transition-all ${
                  pathname === link.href
                    ? "bg-white/10 text-white font-semibold border border-white/15"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/console">
              <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white text-xs font-semibold tracking-tight transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 cursor-pointer group shadow-sm">
                <span>Launch Console</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </Link>
          </div>

          {/* Mobile Drawer Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-2xl border border-slate-800 text-white hover:bg-slate-800 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-4 top-24 z-40 p-6 rounded-3xl bg-[#0F172A] border border-slate-800 shadow-2xl flex flex-col gap-4 pointer-events-auto text-white">
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-white py-2 border-b border-slate-800"
            >
              Home
            </Link>
            <div className="pt-2 font-mono text-xs text-[#60A5FA] uppercase tracking-wider font-bold">
              Platform Modules
            </div>
            {platformSubPages.map((sub) => (
              <Link
                key={sub.href}
                href={sub.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-slate-300 hover:text-[#60A5FA] py-1.5 pl-3 border-l-2 border-transparent hover:border-[#60A5FA]"
              >
                {sub.name}
              </Link>
            ))}
            {navLinks.slice(1).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-white py-2 border-b border-slate-800"
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
