"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface PrimaryButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "outline" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export default function PrimaryButton({
  children,
  variant = "primary",
  size = "md",
  className,
  onClick,
  type = "button",
  disabled = false,
}: PrimaryButtonProps) {
  const sizeClasses = {
    sm: "px-4 py-2 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-7 py-3.5 text-base gap-2.5",
  };

  const variantClasses = {
    primary:
      "bg-[#0F172A] text-white hover:bg-[#1E293B] hover:shadow-[0_0_0_3px_rgba(37,99,235,0.2),0_8px_24px_-6px_rgba(37,99,235,0.3)] active:scale-[0.98]",
    outline:
      "bg-white/90 text-[#0F172A] border border-[#E2E8F0] hover:border-[#2563EB]/40 hover:bg-white hover:shadow-[0_4px_12px_-4px_rgba(37,99,235,0.1)]",
    secondary:
      "bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] hover:bg-white hover:border-[#2563EB]/30",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-full",
        "transition-all duration-200 ease-out",
        "cursor-pointer select-none",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </button>
  );
}
