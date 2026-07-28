"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  badge?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

export default function SectionHeader({
  badge,
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-12 sm:mb-16", align === "center" ? "text-center" : "text-left", className)}>
      {badge && (
        <div className={cn("mb-4", align === "center" ? "flex justify-center" : "")}>
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-[10px] font-mono font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
            {badge}
          </span>
        </div>
      )}
      <h2
        className={cn(
          "font-heading font-bold text-[#0F172A] tracking-tight",
          "text-3xl sm:text-4xl md:text-[2.75rem] leading-[1.1]",
          align === "center" && "max-w-3xl mx-auto"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-4 text-[#475569] leading-relaxed",
            "text-sm sm:text-base",
            align === "center" ? "max-w-2xl mx-auto" : "max-w-2xl"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
