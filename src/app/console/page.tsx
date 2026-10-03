"use client";

import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Camera,
  UploadCloud,
  FileImage,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Cpu,
  Layers,
  Activity,
  Coins,
  Wrench,
  ShieldCheck,
  Leaf,
  Radio,
  HardDrive,
  CircuitBoard,
  Server,
  Smartphone,
  Zap,
  Info,
  X,
} from "lucide-react";
import { useAnalysisSession } from "@/lib/context/AnalysisSessionContext";
import { SAMPLE_DATASETS } from "@/lib/data/sampleDatasets";
import CameraScanModal from "@/components/console/CameraScanModal";

const InspectionScanner3D = dynamic(
  () => import("@/components/3d/InspectionScanner3D"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-44 flex items-center justify-center bg-[#F1F5F9] rounded-2xl">
        <Camera className="w-8 h-8 text-[#2563EB] animate-pulse" />
      </div>
    ),
  }
);

export default function ConsoleCapturePage() {
  const router = useRouter();
  const { loadSample, setImageUpload, setActiveStep } = useAnalysisSession();

  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    preview: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = event.target?.result as string;
      setSelectedFile({
        name: file.name,
        size: file.size,
        preview,
      });
      setImageUpload(preview, file.name, file.size);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeUpload = () => {
    if (!selectedFile) return;
    setActiveStep(2);
    router.push("/console/analyze");
  };

  const handleSelectSample = (sampleId: string) => {
    loadSample(sampleId);
    setActiveStep(2);
    router.push("/console/analyze");
  };

  const whatWeAnalyze = [
    {
      num: "01",
      title: "Component Detection",
      desc: "Identify ICs, resistors, capacitors, MOSFETs, connectors, sensors and other SMD devices.",
      icon: Cpu,
    },
    {
      num: "02",
      title: "PCB Reconstruction",
      desc: "Synthesize trace continuity, circuit topologies, and KiCad/Gerber netlists.",
      icon: Layers,
    },
    {
      num: "03",
      title: "Component Health",
      desc: "Estimate physical wear, thermal stress, solder degradation and operational status.",
      icon: Activity,
    },
    {
      num: "04",
      title: "Remaining Useful Life",
      desc: "Physics-informed mathematical projections for operational hours and remaining years.",
      icon: Radio,
    },
    {
      num: "05",
      title: "Material Recovery",
      desc: "Estimate recoverable Gold, Silver, Copper, and Palladium with live market valuation.",
      icon: Coins,
    },
    {
      num: "06",
      title: "Repair Intelligence",
      desc: "Identify pinpoint failure modes and recommend component reflow, swap, or recycling.",
      icon: Wrench,
    },
    {
      num: "07",
      title: "Digital Passport",
      desc: "Create a traceable hardware provenance identity with Polygon network readiness.",
      icon: ShieldCheck,
    },
    {
      num: "08",
      title: "Environmental Impact",
      desc: "Quantify avoided Scope 3 carbon emissions, GWh energy conserved, and water saved.",
      icon: Leaf,
    },
  ];

  const supportedHardware = [
    { name: "Multi-Layer PCB", count: "2 to 16 Layers", icon: CircuitBoard },
    { name: "Laptop Mainboard", count: "Dense SMD/BGA", icon: HardDrive },
    { name: "IoT Controller", count: "Wi-Fi / BLE Nodes", icon: Radio },
    { name: "Industrial PLC", count: "Conformal Coated", icon: Server },
    { name: "Power Supply", count: "SMPS / High-Voltage", icon: Zap },
    { name: "Smartphone Logic", count: "SLP Substrate HDI", icon: Smartphone },
  ];

  return (
    <div className="flex-1 py-10 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-16">
      
      {/* ─── HERO HEADER ────────────────────────────────────────── */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-mono font-bold text-[#2563EB]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Industrial Circular Intelligence Ingest</span>
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
          Analyze Electronic Hardware
        </h1>

        <p className="text-base text-[#475569] leading-relaxed max-w-2xl mx-auto">
          Upload or scan an electronic device to begin EcoIntel&apos;s circular intelligence analysis. Sub-millimeter spectro-spatial computer vision maps health, recovery yields, and lifecycle pathways.
        </p>
      </div>

      {/* ─── PRIMARY INGEST ACTION PANELS (CAMERA & UPLOAD) ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        
        {/* OPTION 1: SCAN BY CAMERA */}
        <div className="p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#EFF6FF] rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#2563EB] tracking-wider uppercase">
                OPTION 01 · OPTICAL SCAN
              </span>
              <span className="text-[11px] font-mono text-[#16A34A] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full font-bold">
                Real-Time Video Ingest
              </span>
            </div>

            <h2 className="font-heading text-2xl font-bold text-[#0F172A]">
              Scan by Camera
            </h2>

            <p className="text-xs text-[#475569] leading-relaxed">
              Activate your optical inspection scanner or device camera. High-contrast framing detects circuit boundaries, SMD packages, and solder joints.
            </p>

            {/* 3D Realistic Scanner Visual */}
            <div className="h-44 w-full bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] overflow-hidden flex items-center justify-center relative">
              <InspectionScanner3D />
              <div className="absolute bottom-2 left-3 text-[10px] font-mono text-[#64748B]">
                Industrial 50-Micron Optical Alignment
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => setIsCameraModalOpen(true)}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 group-hover:gap-3"
            >
              <Camera className="w-4 h-4 text-[#38BDF8]" />
              <span>Open Camera Scanner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* OPTION 2: UPLOAD IMAGE */}
        <div className="p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#2563EB] tracking-wider uppercase">
                OPTION 02 · HIGH-RES FILE
              </span>
              <span className="text-[11px] font-mono text-[#64748B] bg-[#F1F5F9] px-2.5 py-0.5 rounded-full font-semibold">
                JPG · PNG · WEBP · PDF
              </span>
            </div>

            <h2 className="font-heading text-2xl font-bold text-[#0F172A]">
              Upload PCB Image
            </h2>

            <p className="text-xs text-[#475569] leading-relaxed">
              Drag and drop high-resolution photographs, flatbed scanner imagery, or automated optical inspection (AOI) exports.
            </p>

            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`h-44 w-full rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-4 text-center cursor-pointer ${
                dragOver
                  ? "border-[#2563EB] bg-[#EFF6FF]"
                  : selectedFile
                  ? "border-[#16A34A] bg-[#F0FDF4]"
                  : "border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#2563EB]/60 hover:bg-[#F1F5F9]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={handleFileInputChange}
              />

              {selectedFile ? (
                <div className="flex items-center gap-4 text-left w-full max-w-sm">
                  <img
                    src={selectedFile.preview}
                    alt="Uploaded preview"
                    className="w-16 h-16 object-cover rounded-xl border border-[#CBD5E1] flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-[#0F172A] truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] font-mono text-[#64748B]">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready
                    </p>
                    <span className="text-[10px] text-[#16A34A] font-semibold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Validated Format
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="p-1 rounded-lg text-[#94A3B8] hover:text-[#DC2626]"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#EFF6FF] text-[#2563EB] mx-auto flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0F172A]">
                      Drop your PCB image here
                    </span>
                    <span className="text-xs text-[#64748B]"> or </span>
                    <span className="text-xs font-semibold text-[#2563EB] underline">
                      Browse Files
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-[#94A3B8]">
                    Max file size 35MB · Up to 8000x8000 px
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={handleAnalyzeUpload}
              disabled={!selectedFile}
              className={`w-full py-3.5 px-6 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                selectedFile
                  ? "bg-[#2563EB] hover:bg-[#1D4ED8] text-white cursor-pointer shadow-blue-500/20"
                  : "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed"
              }`}
            >
              <span>Verify & Pre-Check Hardware</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* ─── SAMPLE DATASET SECTION (CRITICAL FOR DEMONSTRATIONS) ─── */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#2563EB] uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Demonstration Datasets</span>
            </div>
            <h2 className="font-heading text-2xl font-bold text-[#0F172A]">
              Try EcoIntel with a Sample
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              Select any pre-calibrated industrial PCB to immediately test the 8-stage circular intelligence pipeline.
            </p>
          </div>

          <span className="text-xs font-mono text-[#64748B]">
            6 Validated Reference Sets
          </span>
        </div>

        {/* 6 Realistic Electronic Sample Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(SAMPLE_DATASETS).map((sample) => (
            <div
              key={sample.id}
              className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-lg hover:border-[#2563EB]/40 transition-all p-4 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Image Container */}
                <div className="h-44 w-full rounded-xl overflow-hidden bg-slate-900 border border-[#E2E8F0] relative">
                  <img
                    src={sample.image}
                    alt={sample.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#0F172A]/80 backdrop-blur-md text-white text-[10px] font-mono font-bold">
                    {sample.category}
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-[#0F172A] text-[10px] font-mono font-bold border border-[#E2E8F0]">
                    ~{sample.componentCount} Components
                  </div>
                </div>

                {/* Details */}
                <div>
                  <h3 className="font-heading text-base font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                    {sample.name}
                  </h3>
                  <p className="text-[11px] font-mono text-[#64748B]">
                    {sample.deviceType} · {sample.hardwareSpecs.layers} Layers
                  </p>
                  <p className="text-xs text-[#475569] mt-2 line-clamp-2 leading-relaxed">
                    {sample.description}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-2 border-t border-[#F1F5F9] flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-[#16A34A]">
                  Health {sample.rul.overallHealthScore}%
                </span>
                <button
                  onClick={() => handleSelectSample(sample.id)}
                  className="px-4 py-2 rounded-xl bg-[#EFF6FF] hover:bg-[#2563EB] text-[#2563EB] hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Use Sample</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── WHAT ECOINTEL WILL ANALYZE (8 COMPACT ITEMS) ───────── */}
      <div className="space-y-6 pt-4">
        <div>
          <span className="text-xs font-mono font-bold text-[#2563EB] tracking-wider uppercase">
            END-TO-END TELEMETRY
          </span>
          <h2 className="font-heading text-2xl font-bold text-[#0F172A] mt-1">
            What EcoIntel Will Analyze
          </h2>
          <p className="text-xs text-[#64748B]">
            From pixel-level package segmentation to circular marketplace monetization.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {whatWeAnalyze.map((item) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.num}
                className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm hover:border-[#BFDBFE] transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-bold text-[#94A3B8]">
                    {item.num}
                  </span>
                </div>
                <h3 className="font-heading text-sm font-bold text-[#0F172A]">
                  {item.title}
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── SUPPORTED HARDWARE GALLERY ─────────────────────────── */}
      <div className="p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-heading text-xl font-bold text-[#0F172A]">
              Built for Electronic Hardware
            </h3>
            <p className="text-xs text-[#64748B]">
              Trained on industrial IPC-A-610 standards across server, industrial, and consumer assemblies.
            </p>
          </div>
          <span className="text-xs font-mono text-[#2563EB] font-bold">
            Zero low-poly approximations
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {supportedHardware.map((hw) => {
            const IconComp = hw.icon;
            return (
              <div
                key={hw.name}
                className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] mx-auto flex items-center justify-center">
                  <IconComp className="w-4 h-4" />
                </div>
                <p className="font-bold text-xs text-[#0F172A] truncate">
                  {hw.name}
                </p>
                <p className="text-[10px] font-mono text-[#64748B]">
                  {hw.count}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Camera Scan Modal */}
      <CameraScanModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
      />

    </div>
  );
}
