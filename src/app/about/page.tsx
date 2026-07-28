"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
import LabCard from "@/components/ui/LabCard";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { Target, Compass, Send, CheckCircle } from "lucide-react";

export default function AboutPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionHeader
            badge="ENTERPRISE MISSION & VISION"
            title="Building the Operating System for Circular Electronics"
            subtitle="EcoIntel synthesizes computer vision, generative CAD topology, and blockchain product passports to transform primitive e-waste recycling into high-precision asset recovery."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <LabCard className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-6">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-[#0F172A] mb-3">Enterprise Mission</h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                To eliminate global electronic waste by providing every circuit board and microchip with an AI-certified second life through sub-millimeter component detection and Polygon blockchain traceability.
              </p>
            </LabCard>

            <LabCard className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mb-6">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-[#0F172A] mb-3">Patent-Pending Vision</h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Our PCT international patent filings protect Generative Graph Neural Topology (GGNT) algorithms capable of restoring severed multilayer PCB micro-vias in under 120 milliseconds.
              </p>
            </LabCard>
          </div>

          {/* Contact Enterprise Form */}
          <div className="max-w-3xl mx-auto">
            <LabCard className="p-8 sm:p-12">
              <h3 className="font-heading text-2xl font-bold text-[#0F172A] mb-2">Connect with EcoIntel AI Lab</h3>
              <p className="text-xs font-mono text-[#64748B] mb-8">
                Inquire about facility inspection line deployment, API key access, or joint industrial research.
              </p>

              {submitted ? (
                <div className="py-8 flex flex-col items-center text-center space-y-3">
                  <CheckCircle className="w-12 h-12 text-[#16A34A]" />
                  <h4 className="font-heading text-xl font-bold text-[#0F172A]">Inquiry Received</h4>
                  <p className="text-xs font-mono text-[#64748B]">Our AI solutions team will contact your facility within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-mono text-[#64748B] block mb-2">Work Email</label>
                      <input
                        type="email"
                        required
                        placeholder="name@company.com"
                        className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-sm font-mono focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-[#64748B] block mb-2">Facility / Company</label>
                      <input
                        type="text"
                        placeholder="Tokyo Recycling Inc."
                        className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-sm font-mono focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-[#64748B] block mb-2">Processing Intent</label>
                    <textarea
                      rows={4}
                      placeholder="Describe your processing volume, PCB types, or API requirements..."
                      className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-sm font-mono focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <PrimaryButton variant="primary" size="md" type="submit" className="w-full sm:w-auto">
                    <Send className="w-4 h-4" />
                    <span>Transmit Inquiry</span>
                  </PrimaryButton>
                </form>
              )}
            </LabCard>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
