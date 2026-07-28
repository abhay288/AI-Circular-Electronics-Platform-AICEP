"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface FloatingBadgeProps {
  icon?: React.ReactNode;
  label: string;
  value: string;
  variant?: "cyan" | "green" | "gold" | "blue" | "default";
  className?: string;
}

export default function FloatingBadge({
  icon,
  label,
  value,
  variant = "default",
  className,
}: FloatingBadgeProps) {
  const valueColors = {
    cyan: "text-[#2563EB]",
    green: "text-[#16A34A]",
    gold: "text-[#C9A227]",
    blue: "text-[#2563EB]",
    default: "text-[#0F172A]",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-[#E2E8F0] shadow-[0_10px_25px_-5px_rgba(15,23,42,0.08)] font-sans transition-all hover:scale-105",
        className
      )}
    >
      {icon && (
        <div className="w-8 h-8 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-[#2563EB]">
          {icon}
        </div>
      )}
      <div className="flex flex-col text-left">
        <span className="text-[11px] font-medium text-[#64748B] leading-tight">{label}</span>
        <span className={cn("font-mono text-sm font-bold leading-tight", valueColors[variant])}>
          {value}
        </span>
      </div>
    </div>
  );
}
