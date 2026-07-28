"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
import LabCard from "@/components/ui/LabCard";
import PrimaryButton from "@/components/ui/PrimaryButton";
import TechBadge from "@/components/ui/TechBadge";
import { ShoppingCart, ShieldCheck, Tag, ArrowRight } from "lucide-react";

const GlassCapsule3D = dynamic(
  () => import("@/components/3d/GlassCapsule3D"),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#F8FAFC] rounded-2xl" /> }
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

export default function MarketplacePage() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionHeader
            badge="CIRCULAR B2B HARDWARE EXCHANGE"
            title="Verified Component Marketplace"
            subtitle="Acquire AI-diagnosed electronic components featuring Polygon ERC-721 Digital Product Passports, verified remaining lifespan, and instant escrow."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {marketplaceItems.map((item) => {
              const isHovered = hoveredId === item.id;
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <LabCard interactive className="p-6 h-full flex flex-col justify-between">
                    <div className="w-full h-48 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] relative overflow-hidden mb-6 flex items-center justify-center">
                      <GlassCapsule3D isHovered={isHovered} />
                      <div className="absolute top-3 right-3">
                        <TechBadge label="Polygon Verified" variant="green" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="text-[11px] font-mono text-[#2563EB] uppercase tracking-wider block font-semibold">
                        {item.category}
                      </span>
                      <h3 className="font-heading text-lg font-bold text-[#0F172A] line-clamp-1">
                        {item.name}
                      </h3>

                      <div className="grid grid-cols-2 gap-2 py-3 border-y border-[#E2E8F0] font-mono text-xs">
                        <div>
                          <span className="text-[#64748B] block">Health Score</span>
                          <span className="text-[#16A34A] font-bold">{item.health}% Grade A</span>
                        </div>
                        <div>
                          <span className="text-[#64748B] block">Remaining RUL</span>
                          <span className="text-[#2563EB] font-bold">{item.rul}</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <div>
                          <span className="font-mono text-xl font-extrabold text-[#0F172A]">
                            ${item.priceUSD.toLocaleString()}
                          </span>
                          <span className="text-xs font-mono text-[#64748B] block">{item.priceETH}</span>
                        </div>

                        <PrimaryButton variant="primary" size="sm">
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Acquire</span>
                        </PrimaryButton>
                      </div>
                    </div>
                  </LabCard>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
