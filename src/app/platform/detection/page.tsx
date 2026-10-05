"use client";

import React, { useState, useRef } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TechBadge from "@/components/ui/TechBadge";
import { Cpu, Upload, CheckCircle2, ShieldCheck, ArrowRight, Activity, Crosshair, AlertCircle, Loader2 } from "lucide-react";

interface DisplayComponent {
  id: string;
  name: string;
  package: string;
  mfr: string;
  health: string;
  rul: string;
  conf: string;
  status: string;
  box: { x: number; y: number; width: number; height: number };
}

const INITIAL_CHIPS: DisplayComponent[] = [
  { id: "LM358", name: "LM358 Dual Op-Amp IC", package: "SOP-8", mfr: "Texas Instruments", health: "Pending Analysis", rul: "Pending Analysis", conf: "99.2%", status: "Demo Base", box: { x: 25, y: 25, width: 22, height: 18 } },
  { id: "ATmega328P", name: "ATmega328P Microcontroller", package: "TQFP-32", mfr: "Microchip Tech", health: "Pending Analysis", rul: "Pending Analysis", conf: "98.7%", status: "Demo Base", box: { x: 60, y: 35, width: 24, height: 22 } },
  { id: "Cap220uF", name: "Solid Polymer Capacitor", package: "SMD-6.3", mfr: "Nichicon", health: "Pending Analysis", rul: "Pending Analysis", conf: "97.5%", status: "Demo Base", box: { x: 20, y: 65, width: 16, height: 16 } },
];

export default function DetectionPage() {
  const [chips, setChips] = useState<DisplayComponent[]>(INITIAL_CHIPS);
  const [selectedChipId, setSelectedChipId] = useState<string>("LM358");
  const [imageUrl, setImageUrl] = useState<string>("/images/samples/router_board.jpg");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [modelMeta, setModelMeta] = useState<{ model: string; version: string; provider: string }>({
    model: "EcoIntel-PCB-YOLO",
    version: "v0.1.0",
    provider: "DEMO",
  });
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedChip = chips.find((c) => c.id === selectedChipId) || chips[0];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImageUrl(previewUrl);
    setIsProcessing(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("analysisId", `audit-${Date.now()}`);

    try {
      const res = await fetch("/api/detection", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Detection failed.");
      }

      const data = json.data;
      setModelMeta({
        model: data.model || "EcoIntel-PCB-YOLO",
        version: data.version || "v0.1.0",
        provider: data.provider || "YOLO",
      });
      setWarnings(data.warnings || []);

      if (data.components && data.components.length > 0) {
        const mapped: DisplayComponent[] = data.components.map((c: any, idx: number) => ({
          id: c.componentId || `CMP-${idx + 1}`,
          name: c.name,
          package: c.package || "SMD",
          mfr: c.manufacturer || "Identified via AI",
          health: c.healthScore > 0 ? `${c.healthScore}%` : "Pending Analysis",
          rul: c.estimatedRUL?.years > 0 ? `${c.estimatedRUL.years} Yrs` : "Pending Analysis",
          conf: `${(c.confidence > 1 ? c.confidence : c.confidence * 100).toFixed(1)}%`,
          status: data.status === "PROD" ? "AI Verified" : "Demo Base",
          box: c.boundingBox || { x: 10 + (idx % 4) * 20, y: 10 + Math.floor(idx / 4) * 20, width: 12, height: 12 },
        }));
        setChips(mapped);
        setSelectedChipId(mapped[0].id);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="relative flex flex-col min-h-screen bg-[#F1F5F9]">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-32 pb-16 bg-[#0F172A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[#60A5FA] text-xs font-mono font-bold w-fit">
              <Cpu className="w-4 h-4" />
              <span>MODULE 01 · YOLO & VISION INFERENCE ENGINE</span>
            </div>
            <h1 className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tight">
              AI Component Detection
            </h1>
            <p className="text-slate-300 text-base max-w-2xl leading-relaxed">
              Automated neural vision pipeline detecting microchips, capacitors, connectors, MOSFETs, and relays for circular electronics recycling.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Detection Workbench */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left Upload & Bounding Box Viewer */}
            <div className="lg:col-span-7 glass-card p-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#2563EB]">INTERACTIVE PCB INSPECTION WORKBENCH</span>
                <TechBadge
                  label={modelMeta.provider === "YOLO" ? "Real AI Inference" : "Demo Base"}
                  variant={modelMeta.provider === "YOLO" ? "blue" : "neutral"}
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-mono text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-mono text-amber-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Quality Warnings: {warnings.join(", ")}</span>
                </div>
              )}

              {/* PCB Inspection Display Frame */}
              <div className="relative h-[380px] rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#1E293B] border border-slate-800 flex items-center justify-center p-6 text-center text-white overflow-hidden shadow-inner">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="PCB Scan"
                    className="max-h-full max-w-full object-contain rounded-lg opacity-85"
                  />
                )}

                {isProcessing ? (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-3 z-30">
                    <Loader2 className="w-8 h-8 text-[#38BDF8] animate-spin" />
                    <span className="font-mono text-xs font-bold">Executing YOLO Neural Inference...</span>
                  </div>
                ) : (
                  chips.map((chip) => {
                    const isSelected = selectedChipId === chip.id;
                    return (
                      <div
                        key={chip.id}
                        onClick={() => setSelectedChipId(chip.id)}
                        style={{
                          left: `${chip.box.x}%`,
                          top: `${chip.box.y}%`,
                          width: `${chip.box.width}%`,
                          height: `${chip.box.height}%`,
                        }}
                        className={`absolute rounded-md cursor-pointer transition-all ${
                          isSelected
                            ? "border-2 border-[#38BDF8] bg-sky-500/30 ring-2 ring-sky-400/50 shadow-lg z-20"
                            : "border border-[#16A34A] bg-[#16A34A]/20 hover:border-sky-400 z-10"
                        }`}
                      >
                        <span className="absolute -top-5 left-0 whitespace-nowrap px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-900/90 text-white shadow pointer-events-none">
                          {chip.name.split(" ")[0]} ({chip.conf})
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Upload Drop Zone */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#BFDBFE] rounded-2xl p-6 text-center bg-[#EFF6FF]/40 hover:bg-[#EFF6FF] transition-colors cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-6 h-6 text-[#2563EB]" />
                <span className="text-xs font-bold text-[#0F172A]">Upload Custom PCB Batch Image (JPG / PNG)</span>
                <span className="text-[10px] font-mono text-[#64748B]">Sends to FastAPI YOLO Component Detector</span>
              </div>
            </div>

            {/* Right Selected Component Inspector Panel */}
            <div className="lg:col-span-5 glass-card p-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#2563EB]">COMPONENT TELEMETRY INSPECTOR</span>
                <span className="text-xs font-mono text-slate-500">{chips.length} Components</span>
              </div>
              
              {selectedChip && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-xl font-bold text-[#0F172A]">{selectedChip.name}</h3>
                    <TechBadge label={selectedChip.status} variant="green" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-4 rounded-xl bg-white border border-[#E2E8F0]">
                      <span className="text-[10px] font-mono text-[#64748B] block">Component ID</span>
                      <span className="font-mono font-bold text-xs text-[#0F172A] truncate block">{selectedChip.id}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-[#E2E8F0]">
                      <span className="text-[10px] font-mono text-[#64748B] block">Package Type</span>
                      <span className="font-mono font-bold text-sm text-[#0F172A]">{selectedChip.package}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-[#E2E8F0]">
                      <span className="text-[10px] font-mono text-[#64748B] block">Manufacturer</span>
                      <span className="font-mono font-bold text-sm text-[#0F172A]">{selectedChip.mfr}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-[#E2E8F0]">
                      <span className="text-[10px] font-mono text-[#64748B] block">Health Score</span>
                      <span className="font-mono font-bold text-xs text-slate-500">{selectedChip.health}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-between text-xs font-mono">
                    <span className="text-[#2563EB] font-bold">Detection Model Confidence</span>
                    <span className="font-extrabold text-[#0F172A]">{selectedChip.conf}</span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200">
                <span className="text-xs font-mono text-[#64748B] block mb-3">Active Model Metadata</span>
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  <span className="px-3 py-1 rounded-full bg-white border text-[10px] font-mono text-[#0F172A] font-bold">
                    {modelMeta.model}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white border text-[10px] font-mono text-[#0F172A] font-bold">
                    {modelMeta.version}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
