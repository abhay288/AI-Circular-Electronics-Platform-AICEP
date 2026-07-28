"use client";

import React, { useState } from "react";
import SectionHeader from "@/components/ui/SectionHeader";
import GlassCard from "@/components/ui/GlassCard";
import GlowingButton from "@/components/ui/GlowingButton";
import { Mail, Building, Send, CheckCircle, ShieldCheck } from "lucide-react";

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <section id="contact" className="py-24 relative overflow-hidden bg-[#0A1325]/40 border-t border-white/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-8">
        <SectionHeader
          badge="ENTERPRISE FACILITY DEPLOYMENT"
          title="Connect with EcoIntel AI Lab"
          subtitle="Schedule an enterprise technical demo, inquire about facility API integration, or partner on circular electronics research."
        />

        <GlassCard glow="cyan" className="p-8 sm:p-12">
          {submitted ? (
            <div className="py-12 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#00FF99]/20 border border-[#00FF99]/50 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-[#00FF99]" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-white">Inquiry Received</h3>
              <p className="text-sm text-[#8A97B5] max-w-md font-mono">
                Our AI Lab solutions team has dispatched a response payload to <span className="text-[#00E6FF]">{email}</span>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-[#8A97B5] block">Work Email</label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm font-mono focus:outline-none focus:border-[#00E6FF]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-[#8A97B5] block">Organization / Facility</label>
                  <input
                    type="text"
                    placeholder="e.g. Tokyo E-Recycling Inc"
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm font-mono focus:outline-none focus:border-[#00E6FF]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-[#8A97B5] block">Project Overview / Integration Intent</label>
                <textarea
                  rows={4}
                  placeholder="Describe your processing volume, PCB types, or research inquiry..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm font-mono focus:outline-none focus:border-[#00E6FF]"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs font-mono text-[#00FF99]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Enterprise NDA & API Access Included</span>
                </div>

                <GlowingButton variant="primary" glowColor="cyan" type="submit" className="w-full sm:w-auto px-8 py-3">
                  <Send className="w-4 h-4" />
                  <span>Transmit Inquiry</span>
                </GlowingButton>
              </div>
            </form>
          )}
        </GlassCard>
      </div>
    </section>
  );
}
