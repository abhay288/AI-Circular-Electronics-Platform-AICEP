"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LabCardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export default function LabCard({
  children,
  className,
  interactive = false,
  onClick,
}: LabCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        interactive ? "lab-card-interactive" : "lab-card",
        className
      )}
    >
      {children}
    </div>
  );
}
