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
    gold: "text-[#D97706]",
    neutral: "text-[#0F172A]",
  };

  const iconBg = {
    blue: "bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]",
    green: "bg-[#DCFCE7] border-[#86EFAC] text-[#16A34A]",
    gold: "bg-[#FEF3C7] border-[#FDE68A] text-[#D97706]",
    neutral: "bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A]",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white shadow-xl shadow-slate-900/10 transition-all duration-300 hover:scale-105",
        className
      )}
    >
      <div className={cn("flex-shrink-0 w-8 h-8 rounded-xl border flex items-center justify-center shadow-sm", iconBg[variant])}>
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-sans font-semibold tracking-tight text-[#64748B] uppercase whitespace-nowrap">
          {label}
        </span>
        <span className={cn("text-sm font-heading font-extrabold tracking-tight leading-tight", valueColors[variant])}>
          {value}
        </span>
      </div>
    </div>
  );
}
