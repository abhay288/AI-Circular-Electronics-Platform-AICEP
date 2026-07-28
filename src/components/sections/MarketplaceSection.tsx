"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import SectionHeader from "@/components/ui/SectionHeader";
import GlassCard from "@/components/ui/GlassCard";
import TechBadge from "@/components/ui/TechBadge";
import GlowingButton from "@/components/ui/GlowingButton";
import { ShoppingCart, ShieldCheck, ArrowRight, Tag, Activity } from "lucide-react";

const GlassCapsule3D = dynamic(
  () => import("@/components/3d/GlassCapsule3D"),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#04070E] rounded-2xl" /> }
);

interface MarketplaceItem {
  id: string;
  name: string;
  category: string;
  health: number;
  priceUSD: number;
  priceETH: string;
  rul: string;
  verified: boolean;
}

const marketplaceItems: MarketplaceItem[] = [
  {
    id: "comp-1",
    name: "Refurbished NVIDIA H100 Tensor Core GPU",
    category: "AI Accelerators",
    health: 98,
    priceUSD: 14500,
    priceETH: "4.2 ETH",
    rul: "4.8 Years",
    verified: true,
  },
  {
    id: "comp-2",
    name: "Apple M2 Max System-on-Chip (SOC)",
    category: "Processors",
    health: 94,
    priceUSD: 850,
    priceETH: "0.25 ETH",
    rul: "3.9 Years",
    verified: true,
  },
  {
    id: "comp-3",
    name: "Samsung 64GB DDR5 ECC Registered RAM Module",
    category: "Memory Systems",
    health: 96,
    priceUSD: 240,
    priceETH: "0.07 ETH",
    rul: "5.0 Years",
    verified: true,
  },
];

export default function MarketplaceSection() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <section id="marketplace" className="py-24 relative overflow-hidden bg-[#0A1325]/40 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <SectionHeader
          badge="CIRCULAR B2B HARDWARE EXCHANGE"
          title="Verified Component Marketplace"
          subtitle="Trade AI-certified recovered components with embedded Polygon Blockchain passports, guaranteed remaining lifespan, and instant escrow."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {marketplaceItems.map((item) => {
            const isHovered = hoveredCard === item.id;
            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredCard(item.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <GlassCard glow="cyan" className="p-6 h-full flex flex-col justify-between">
                  {/* Glass Capsule 3D Visual Box */}
                  <div className="w-full h-48 rounded-2xl bg-[#04070E] border border-white/10 relative overflow-hidden mb-6 flex items-center justify-center">
                    <GlassCapsule3D isHovered={isHovered} />
                    <div className="absolute top-3 right-3">
                      <TechBadge label="Polygon Verified" variant="green" />
                    </div>
                  </div>

                  {/* Component Meta */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-mono text-[#00E6FF] uppercase tracking-wider block">
                      {item.category}
                    </span>
                    <h3 className="font-heading text-lg font-bold text-white line-clamp-1">
                      {item.name}
                    </h3>

                    {/* Stats Readout */}
                    <div className="grid grid-cols-2 gap-2 py-3 border-y border-white/10 font-mono text-xs">
                      <div>
                        <span className="text-[#8A97B5] block">Health Score</span>
                        <span className="text-[#00FF99] font-bold">{item.health}% Grade A</span>
                      </div>
                      <div>
                        <span className="text-[#8A97B5] block">Remaining Life</span>
                        <span className="text-[#00E6FF] font-bold">{item.rul}</span>
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="pt-2 flex items-center justify-between">
                      <div>
                        <span className="font-heading text-xl font-bold text-white">
                          ${item.priceUSD.toLocaleString()}
                        </span>
                        <span className="text-xs font-mono text-[#8A97B5] block">
                          {item.priceETH}
                        </span>
                      </div>

                      <GlowingButton variant="primary" glowColor="cyan" className="px-4 py-2 text-xs">
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Acquire</span>
                      </GlowingButton>
                    </div>
                  </div>
                </GlassCard>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
