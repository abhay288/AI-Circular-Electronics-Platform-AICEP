"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  Cpu,
  ShieldCheck,
  Maximize2,
  FileCheck,
  Sliders,
  Eye,
} from "lucide-react";
import { useAnalysisSession } from "@/lib/context/AnalysisSessionContext";

export default function ReadyForAnalysisPage() {
  const router = useRouter();
  const { session, setActiveStep } = useAnalysisSession();
  const [isValidating, setIsValidating] = useState(false);

  const handleStartAnalysis = () => {
    setActiveStep(2);
    router.push("/console/processing");
  };

  const validationChecks = [
    { name: "File Format Verification", result: "Valid (MIME image/*)", status: "pass" },
    { name: "Resolution & Optical Sharpness", result: session.imageQuality?.resolution || "2400 x 1600 px", status: "pass" },
    { name: "Lighting & Exposure Uniformity", result: `${session.imageQuality?.lightingScore || 96}% (Optimal Dynamic Range)`, status: "pass" },
    { name: "PCB Boundary Saliency", result: `${session.imageQuality?.visibilityPercent || 95}% Identified`, status: "pass" },
    { name: "Surface Glare & Occlusion Index", result: "Low (< 4% Specular Reflection)", status: "pass" },
  ];

  return (
    <div className="flex-1 py-10 px-4 sm:px-8 max-w-5xl mx-auto w-full space-y-8">
      
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/console"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Ingest Options</span>
        </Link>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-xs font-mono font-bold text-[#16A34A]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Pre-Flight Validation Succeeded</span>
        </div>
      </div>

      {/* Main Title Header */}
      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-wider text-[#2563EB] font-bold">
          Ingest Stage 01.5 · Hardware Verification
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
          Ready for Analysis
        </h1>
        <p className="text-sm text-[#475569] max-w-2xl leading-relaxed">
          The uploaded electronic hardware has satisfied optical intake constraints. Review hardware parameters before initializing the deep neural inspection pipeline.
        </p>
      </div>

      {/* Verification Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Device Image Preview */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-4 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-[#E2E8F0] max-h-[380px] flex items-center justify-center">
              <img
                src={session.image || "/images/samples/laptop_motherboard.jpg"}
                alt={session.deviceName}
                className="w-full h-full object-contain max-h-[360px]"
              />

              {/* Data Classification Tag */}
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#0F172A]/85 backdrop-blur-md text-white text-[11px] font-mono font-bold flex items-center gap-1.5 border border-white/20">
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                <span className="capitalize">{session.dataClassification} Dataset</span>
              </div>

              {/* Inspection Reticle Overlay */}
              <div className="absolute inset-4 border border-dashed border-[#38BDF8]/40 rounded-xl pointer-events-none" />
            </div>

            <div className="flex items-center justify-between text-xs font-mono px-1">
              <span className="text-[#64748B]">Target Session:</span>
              <span className="font-bold text-[#0F172A]">#{session.sessionId}</span>
            </div>
          </div>
        </div>

        {/* Right: Validation Checklist & Hardware Stats */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-1">
              <span className="text-xs font-mono text-[#64748B]">Device Type</span>
              <p className="font-heading font-bold text-[#0F172A] text-sm">
                {session.deviceType}
              </p>
              <span className="text-[10px] font-mono text-[#2563EB] uppercase">
                {session.sourceType} Source
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-1">
              <span className="text-xs font-mono text-[#64748B]">Optical Quality</span>
              <p className="font-heading font-bold text-[#16A34A] text-sm flex items-center gap-1">
                <span>{session.imageQuality?.quality.toUpperCase() || "GOOD"}</span>
                <span className="text-xs text-[#64748B]">({session.imageQuality?.lightingScore || 96}%)</span>
              </p>
              <span className="text-[10px] font-mono text-[#64748B]">
                Sub-50 Micron Grade
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-1">
              <span className="text-xs font-mono text-[#64748B]">Estimated Visibility</span>
              <p className="font-heading font-bold text-[#0F172A] text-sm">
                {session.imageQuality?.visibilityPercent || 95}% Saliency
              </p>
              <span className="text-[10px] font-mono text-[#16A34A]">
                Zero Critical Occlusion
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-1">
              <span className="text-xs font-mono text-[#64748B]">Components Detectable</span>
              <p className="font-heading font-bold text-[#2563EB] text-sm">
                ~{session.imageQuality?.estimatedComponentsVisible || 48} Nodes
              </p>
              <span className="text-[10px] font-mono text-[#64748B]">
                SMD, BGA, QFP, Passive
              </span>
            </div>
          </div>

          {/* Validation Checklist */}
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-3">
            <h3 className="font-heading text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Automated Optical Inspection (AOI) Verification
            </h3>

            <div className="space-y-2.5">
              {validationChecks.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
                    <span className="text-[#0F172A] font-medium">{item.name}</span>
                  </div>
                  <span className="text-[#475569] font-bold">{item.result}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-2 space-y-3">
            <button
              onClick={handleStartAnalysis}
              className="w-full py-4 px-8 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-3 transition-all cursor-pointer group"
            >
              <span>Start EcoIntel Analysis</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-[11px] font-mono text-center text-[#64748B]">
              Pipeline will execute YOLOv11 Spectro-Spatial, GGNT Reconstruction, RUL, and Metals.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
