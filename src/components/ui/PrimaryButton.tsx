"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

export default function PrimaryButton({
  children,
  variant = "primary",
  size = "md",
  className,
  onClick,
  ...props
}: PrimaryButtonProps) {
  const sizeStyles = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  const variantStyles = {
    primary: "bg-[#0F172A] text-white hover:bg-[#1E293B] shadow-md hover:shadow-lg",
    secondary: "bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-md hover:shadow-lg",
    outline: "bg-white text-[#0F172A] border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]",
    dark: "bg-[#0F172A] text-white hover:bg-[#1E293B]",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-all duration-200 cursor-pointer active:scale-[0.98]",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
