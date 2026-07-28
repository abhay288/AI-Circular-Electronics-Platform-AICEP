"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface GlowingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  glowColor?: "cyan" | "green" | "purple";
  className?: string;
  onClick?: () => void;
}

export default function GlowingButton({
  children,
  variant = "primary",
  glowColor = "cyan",
  className,
  onClick,
  ...props
}: GlowingButtonProps) {
  const glowStyles = {
    cyan: "shadow-[0_0_20px_rgba(0,230,255,0.35)] hover:shadow-[0_0_35px_rgba(0,230,255,0.6)] border-[#00E6FF]/50",
    green: "shadow-[0_0_20px_rgba(0,255,153,0.35)] hover:shadow-[0_0_35px_rgba(0,255,153,0.6)] border-[#00FF99]/50",
    purple: "shadow-[0_0_20px_rgba(108,99,255,0.35)] hover:shadow-[0_0_35px_rgba(108,99,255,0.6)] border-[#6C63FF]/50",
  };

  const variantStyles = {
    primary: "bg-gradient-to-r from-[#00E6FF] to-[#00A3FF] text-[#04070E] font-semibold hover:brightness-110",
    secondary: "bg-[#0A1325] text-[#F5F8FF] border border-white/10 hover:border-[#00E6FF]/60 hover:bg-[#101F3C]",
    outline: "bg-transparent text-[#00E6FF] border border-[#00E6FF]/40 hover:border-[#00E6FF] hover:bg-[#00E6FF]/10",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm tracking-wide transition-all duration-300 font-medium overflow-hidden cursor-pointer",
        variantStyles[variant],
        glowStyles[glowColor],
        className
      )}
      {...props}
    >
      {/* Electric Pulse Animation */}
      <span className="absolute inset-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}
