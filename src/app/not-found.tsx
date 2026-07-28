"use client";

import Link from "next/link";
import GlowingButton from "@/components/ui/GlowingButton";
import { Cpu, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#04070E] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#00E6FF]/10 border border-[#00E6FF]/30 flex items-center justify-center mb-6">
        <Cpu className="w-8 h-8 text-[#00E6FF]" />
      </div>
      <span className="font-mono text-xs text-[#00E6FF] uppercase tracking-widest mb-2">
        Error 404
      </span>
      <h1 className="font-heading text-4xl font-bold text-white mb-3">
        PCB Coordinates Not Found
      </h1>
      <p className="text-sm font-mono text-[#8A97B5] max-w-md mb-8">
        The requested digital asset or telemetry route does not exist in the EcoIntel index.
      </p>
      <Link href="/">
        <GlowingButton variant="primary" glowColor="cyan">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Command Console</span>
        </GlowingButton>
      </Link>
    </div>
  );
}
