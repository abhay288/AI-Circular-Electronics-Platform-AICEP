"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface TechBadgeProps {
  label: string;
  icon?: React.ReactNode;
  variant?: "blue" | "green" | "gold" | "purple" | "cyan" | "neutral";
  className?: string;
}

export default function TechBadge({
  label,
  icon,
  variant = "blue",
  className,
}: TechBadgeProps) {
  const styles = {
    blue: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
    cyan: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
    green: "bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]",
    gold: "bg-[#FEF9C3] text-[#C9A227] border-[#FDE047]",
    purple: "bg-[#F3E8FF] text-[#9333EA] border-[#E9D5FF]",
    neutral: "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border font-medium",
        styles[variant],
        className
      )}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
}
