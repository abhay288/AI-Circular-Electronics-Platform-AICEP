"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface FloatingBadgeProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  variant?: "blue" | "green" | "gold" | "neutral";
  className?: string;
}

export default function FloatingBadge({
  icon,
  label,
  value,
  variant = "blue",
  className,
}: FloatingBadgeProps) {
  const valueColors = {
    blue: "text-[#2563EB]",
    green: "text-[#16A34A]",
    gold: "text-[#C9A227]",
    neutral: "text-[#0F172A]",
  };

  return (
    <div
      className={cn(
        "glass-pill inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl animate-float",
        className
      )}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#94A3B8] font-medium leading-none mb-0.5 whitespace-nowrap">
          {label}
        </span>
        <span className={cn("text-sm font-mono font-bold leading-tight", valueColors[variant])}>
          {value}
        </span>
      </div>
    </div>
  );
}
