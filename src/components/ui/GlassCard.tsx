"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: "cyan" | "green" | "purple" | "none";
  interactive?: boolean;
}

export default function GlassCard({
  children,
  className,
  glow = "none",
  interactive = true,
}: GlassCardProps) {
  const glowBorder = {
    cyan: "hover:border-[#00E6FF]/50 hover:shadow-[0_0_30px_rgba(0,230,255,0.15)]",
    green: "hover:border-[#00FF99]/50 hover:shadow-[0_0_30px_rgba(0,255,153,0.15)]",
    purple: "hover:border-[#6C63FF]/50 hover:shadow-[0_0_30px_rgba(108,99,255,0.15)]",
    none: "",
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl p-6 border border-white/10 bg-[#0A1325]/60 backdrop-blur-xl transition-all duration-300 overflow-hidden",
        interactive && "hover:-translate-y-1 hover:bg-[#0F1C36]/80",
        glowBorder[glow],
        className
      )}
    >
      {/* Corner Cyber Accent Traces */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#00E6FF]/40 rounded-tl-xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#00E6FF]/40 rounded-tr-xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#00E6FF]/40 rounded-bl-xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#00E6FF]/40 rounded-br-xl pointer-events-none" />

      {children}
    </div>
  );
}
