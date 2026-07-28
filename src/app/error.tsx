"use client";

import { useEffect } from "react";
import GlowingButton from "@/components/ui/GlowingButton";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#04070E] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#FF3366]/10 border border-[#FF3366]/30 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-[#FF3366]" />
      </div>
      <h2 className="font-heading text-3xl font-bold text-white mb-2">
        EcoIntel System Telemetry Exception
      </h2>
      <p className="text-sm font-mono text-[#8A97B5] max-w-md mb-8">
        {error.message || "An unexpected error occurred in the spatial rendering pipeline."}
      </p>
      <GlowingButton variant="primary" glowColor="cyan" onClick={() => reset()}>
        <RefreshCw className="w-4 h-4" />
        <span>Re-initialize Platform</span>
      </GlowingButton>
    </div>
  );
}
