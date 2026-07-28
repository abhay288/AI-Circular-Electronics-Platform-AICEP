"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LabCardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

export default function LabCard({
  children,
  className,
  interactive = true,
}: LabCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-6 bg-white border border-[#E2E8F0] shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)] transition-all duration-300",
        interactive && "hover:border-[#BFDBFE] hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.12)] hover:-translate-y-1",
        className
      )}
    >
      {children}
    </div>
  );
}
