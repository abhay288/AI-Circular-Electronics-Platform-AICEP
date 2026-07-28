"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  badge?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center" | "right";
  className?: string;
}

export default function SectionHeader({
  badge,
  title,
  subtitle,
  align = "left",
  className,
}: SectionHeaderProps) {
  const alignment = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  };

  return (
    <div className={cn("flex flex-col gap-2.5 mb-10", alignment[align], className)}>
      {badge && (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-widest uppercase text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
          {badge}
        </span>
      )}
      <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#0F172A] leading-tight max-w-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="text-base sm:text-lg text-[#475569] max-w-2xl font-normal leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
