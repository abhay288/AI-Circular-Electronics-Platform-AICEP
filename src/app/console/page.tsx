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
  Play,
  RotateCcw,
  Check,
  AlertCircle,
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
  const {
    session,
    isNewAnalysis,
    selectedDraft,
    selectSampleDraft,
    setUploadDraft,
    clearDraft,
    startAnalysisFromDraft,
    setActiveStep,
  } = useAnalysisSession();

  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    preview: string;
  } | null>(null);
  const [activeInfoModal, setActiveInfoModal] = useState<{
    num: string;
    title: string;
    desc: string;
    methodology: string;
    classification: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stagedRef = useRef<HTMLDivElement>(null);

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
      setUploadDraft(preview, file.name, file.size);
      setTimeout(() => {
        stagedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    };
    reader.readAsDataURL(file);
  };

  const handleStartAnalysis = async () => {
    setActiveStep(2);
    const newSessionId = await startAnalysisFromDraft();
    router.push(`/console/processing?analysisId=${encodeURIComponent(newSessionId)}`);
  };

  const handleSelectSample = (sampleId: string) => {
    selectSampleDraft(sampleId);
    setTimeout(() => {
      stagedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const whatWeAnalyze = [
    {
      num: "01",
      title: "Component Detection",
      desc: "Identify ICs, resistors, capacitors, MOSFETs, connectors, sensors and other SMD devices.",
      icon: Cpu,
      methodology:
        "High-resolution YOLOv11 spectro-spatial neural inference calibrated for sub-50-micron surface mount packages (QFN, BGA, SOIC, 0402).",
      classification: "Detected · Optical Computer Vision",
    },
    {
      num: "02",
      title: "PCB Reconstruction",
      desc: "Synthesize trace continuity, circuit topologies, and KiCad/Gerber netlists.",
      icon: Layers,
      methodology:
        "Multi-layer electrical routing synthesis based on topological pathfinding algorithms and standard IPC netlist formats.",
      classification: "Estimated · AI Topological Netlist",
    },
    {
      num: "03",
      title: "Component Health",
      desc: "Estimate physical wear, thermal stress, solder degradation and operational status.",
      icon: Activity,
      methodology:
        "Computer vision surface analysis identifies tin-whisker growth, oxidation discoloration, and thermal potting fatigue.",
      classification: "Predicted · Solder Joint & Thermal Aging Model",
    },
    {
      num: "04",
      title: "Remaining Useful Life",
      desc: "Physics-informed mathematical projections for operational hours and remaining years.",
      icon: Radio,
      methodology:
        "Arrhenius reaction rate acceleration combined with Coffin-Manson thermomechanical stress modeling.",
      classification: "Predicted · Physics-Informed Degeneration Curve",
    },
    {
      num: "05",
      title: "Material Recovery",
      desc: "Estimate recoverable Gold, Silver, Copper, and Palladium with live market valuation.",
      icon: Coins,
      methodology:
        "EN 50625 compliant metallurgic density formulas calculate electrolytic gold plating thickness and copper layer weights.",
      classification: "Estimated · Elemental Spectrometry Modeling",
    },
    {
      num: "06",
      title: "Repair Intelligence",
      desc: "Identify pinpoint failure modes and recommend component reflow, swap, or recycling.",
      icon: Wrench,
      methodology:
        "Cross-references detected solder bridge defects and thermomechanical stresses against IPC-A-610 Class 3 rework criteria.",
      classification: "Estimated · Diagnostic Decision Engine",
    },
    {
      num: "07",
      title: "Digital Passport",
      desc: "Create a traceable hardware provenance identity with Polygon network readiness.",
      icon: ShieldCheck,
      methodology:
        "ERC-721 compatible hardware pedigree records assembly serial numbers, repair telemetry, and chain-of-custody verification.",
      classification: "Verified · Cryptographic Provenance Schema",
    },
    {
      num: "08",
      title: "Environmental Impact",
      desc: "Quantify avoided Scope 3 carbon emissions, GWh energy conserved, and water saved.",
      icon: Leaf,
      methodology:
        "Life Cycle Assessment (LCA) according to ISO 14040/44 standards calculating virgin mining avoidance offsets.",
      classification: "Estimated · ESG Scope 3 GHG Accounting",
    },
  ];

  const supportedHardware = [
    {
      name: "Multi-Layer PCB",
      count: "2 to 16 Layers",
      icon: CircuitBoard,
      detail: "FR4 & Polyimide Substrates",
    },
    {
      name: "Laptop Mainboard",
      count: "Dense SMD/BGA",
      icon: HardDrive,
      detail: "High-density multi-chip interconnects",
    },
    {
      name: "IoT Controller",
      count: "Wi-Fi / BLE Nodes",
      icon: Radio,
      detail: "Microcontroller + RF front-ends",
    },
    {
      name: "Industrial PLC",
      count: "Conformal Coated",
      icon: Server,
      detail: "Ruggedized 24V automation logic",
    },
    {
      name: "Power Supply",
      count: "SMPS / High-Voltage",
      icon: Zap,
      detail: "PFC chokes & MOSFET topologies",
    },
    {
      name: "Smartphone Logic",
      count: "SLP Substrate HDI",
      icon: Smartphone,
      detail: "Stacked Substrate-Like PCB logic",
    },
  ];

  return (
    <div className="flex-1 py-10 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-14">
      {/* ─── HERO HEADER (FRESH NEW ANALYSIS FOCUS) ───────────── */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-mono font-bold text-[#2563EB]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Industrial Circular Electronics Intelligence</span>
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
          Analyze Electronic Hardware
        </h1>

        <p className="text-base text-[#475569] leading-relaxed max-w-2xl mx-auto">
          Upload or scan a PCB, motherboard, controller, IoT device, or electronic assembly to begin EcoIntel&apos;s circular intelligence analysis.
        </p>
      </div>

      {/* ─── STAGED PREVIEW BANNER (WHEN USER PICKS SAMPLE/UPLOAD/CAMERA) ─── */}
      {selectedDraft && (
        <div
          ref={stagedRef}
          className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-[#2563EB] shadow-xl shadow-blue-500/10 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#2563EB] uppercase tracking-wider">
                    {selectedDraft.sourceType === "sample"
                      ? "SAMPLE SELECTED"
                      : selectedDraft.sourceType === "camera"
                      ? "CAMERA SCAN CAPTURED"
                      : "PCB IMAGE UPLOADED"}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase">
                    Status: {selectedDraft.status}
                  </span>
                </div>
                <h3 className="font-heading text-xl font-bold text-[#0F172A]">
                  Device: {selectedDraft.deviceName}
                </h3>
                <p className="text-xs text-[#64748B]">
                  Dataset:{" "}
                  <strong className="text-[#0F172A]">{selectedDraft.datasetName}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  clearDraft();
                  setSelectedFile(null);
                }}
                className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-colors"
              >
                Change Selection
              </button>
              <button
                onClick={handleStartAnalysis}
                className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>
                  {selectedDraft.sourceType === "sample"
                    ? "Start Demo Analysis"
                    : "Start Analysis"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Validation Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-1 rounded-xl overflow-hidden bg-slate-900 border border-[#E2E8F0] h-28 relative">
              <img
                src={selectedDraft.imageUrl}
                alt="Selected preview"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/80 text-white font-mono text-[9px] font-bold">
                Preview
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <p className="text-[10px] font-mono text-[#64748B] uppercase">Image Quality</p>
              <p className="font-bold text-sm text-[#16A34A] flex items-center gap-1.5 capitalize">
                <Check className="w-4 h-4" />
                {selectedDraft.imageQuality.quality}
              </p>
              <p className="text-[10px] text-[#64748B]">Optical clarity check passed</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <p className="text-[10px] font-mono text-[#64748B] uppercase">Resolution</p>
              <p className="font-bold text-sm text-[#0F172A] font-mono">
                {selectedDraft.imageQuality.resolution}
              </p>
              <p className="text-[10px] text-[#64748B]">Adequate sub-micron pixel pitch</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <p className="text-[10px] font-mono text-[#64748B] uppercase">Lighting Uniformity</p>
              <p className="font-bold text-sm text-[#2563EB] font-mono">
                {selectedDraft.imageQuality.lightingScore}%
              </p>
              <p className="text-[10px] text-[#64748B]">Even illumination profile</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <p className="text-[10px] font-mono text-[#64748B] uppercase">PCB Visibility</p>
              <p className="font-bold text-sm text-[#16A34A] font-mono">
                {selectedDraft.imageQuality.visibilityPercent}%
              </p>
              <p className="text-[10px] text-[#64748B]">
                ~{selectedDraft.imageQuality.estimatedComponentsVisible} SMD packages detected
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── PRIMARY INGEST ACTION PANELS (CAMERA & UPLOAD) ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* OPTION 1: SCAN BY CAMERA */}
        <div className="p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#EFF6FF] rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#2563EB] tracking-wider uppercase">
                OPTION 01 · REAL CAMERA SCAN
              </span>
              <span className="text-[11px] font-mono text-[#16A34A] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full font-bold">
                getUserMedia() Sensor
              </span>
            </div>

            <h2 className="font-heading text-2xl font-bold text-[#0F172A]">
              Scan by Camera
            </h2>

            <p className="text-xs text-[#475569] leading-relaxed">
              Open your browser camera scanner to capture high-contrast optical PCB imagery with live alignment reticle and illumination validation.
            </p>

            {/* 3D Realistic Scanner Visual */}
            <div className="h-44 w-full bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] overflow-hidden flex items-center justify-center relative">
              <InspectionScanner3D />
              <div className="absolute bottom-2 left-3 text-[10px] font-mono text-[#64748B]">
                Sub-Millimeter Optical Framing Reticle
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => setIsCameraModalOpen(true)}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 group-hover:gap-3 cursor-pointer"
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
              Drag and drop high-resolution photographs, flatbed scanner exports, or automated optical inspection (AOI) imagery.
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
                      clearDraft();
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
              onClick={handleStartAnalysis}
              disabled={!selectedFile && !selectedDraft}
              className={`w-full py-3.5 px-6 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                selectedFile || selectedDraft
                  ? "bg-[#2563EB] hover:bg-[#1D4ED8] text-white cursor-pointer shadow-blue-500/20"
                  : "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed"
              }`}
            >
              <span>Start Analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── SAMPLE DATASET SECTION (NO AUTO JUMP - SHOWS PREVIEW & START BUTTON) ─── */}
      <div className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#2563EB] uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Demonstration Reference Sets</span>
            </div>
            <h2 className="font-heading text-2xl font-bold text-[#0F172A]">
              Try EcoIntel with a Sample
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              Select any pre-calibrated industrial PCB to stage and launch an end-to-end circular intelligence run.
            </p>
          </div>

          <span className="text-xs font-mono text-[#64748B]">
            6 Calibrated Datasets
          </span>
        </div>

        {/* 6 Realistic Electronic Sample Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(SAMPLE_DATASETS).map((sample) => (
            <div
              key={sample.id}
              className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all p-4 flex flex-col justify-between group ${
                selectedDraft?.sampleId === sample.id
                  ? "border-[#2563EB] ring-2 ring-blue-100"
                  : "border-[#E2E8F0] hover:border-[#2563EB]/40"
              }`}
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

              {/* Action Button: Stages sample rather than jumping immediately to results */}
              <div className="pt-4 mt-2 border-t border-[#F1F5F9] flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-[#16A34A]">
                  Health {sample.rul.overallHealthScore}%
                </span>
                <button
                  onClick={() => handleSelectSample(sample.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedDraft?.sampleId === sample.id
                      ? "bg-[#2563EB] text-white shadow-sm"
                      : "bg-[#EFF6FF] hover:bg-[#2563EB] text-[#2563EB] hover:text-white"
                  }`}
                >
                  <span>
                    {selectedDraft?.sampleId === sample.id
                      ? "Sample Staged"
                      : "Use Sample →"}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── WHAT ECOINTEL WILL ANALYZE (ALL 8 CARDS ARE INTERACTIVE) ─── */}
      <div className="space-y-6 pt-4">
        <div>
          <span className="text-xs font-mono font-bold text-[#2563EB] tracking-wider uppercase">
            END-TO-END TELEMETRY PIPELINE
          </span>
          <h2 className="font-heading text-2xl font-bold text-[#0F172A] mt-1">
            What EcoIntel Will Analyze
          </h2>
          <p className="text-xs text-[#64748B]">
            Click any telemetry pillar below to inspect its mathematical methodology and sensor pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {whatWeAnalyze.map((item) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.num}
                onClick={() => setActiveInfoModal(item)}
                className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm hover:border-[#2563EB] hover:shadow-md transition-all space-y-2.5 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-bold text-[#94A3B8]">
                    {item.num}
                  </span>
                </div>
                <h3 className="font-heading text-sm font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed">
                  {item.desc}
                </p>
                <span className="inline-block text-[10px] font-mono text-[#2563EB] group-hover:underline pt-1">
                  Inspect Methodology →
                </span>
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
                className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center space-y-1.5 hover:border-[#2563EB]/40 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] mx-auto flex items-center justify-center">
                  <IconComp className="w-4 h-4 text-[#2563EB]" />
                </div>
                <p className="font-bold text-xs text-[#0F172A] truncate">
                  {hw.name}
                </p>
                <p className="text-[10px] font-mono text-[#64748B]">
                  {hw.count}
                </p>
                <p className="text-[9px] text-[#94A3B8] leading-tight">
                  {hw.detail}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── INTERACTIVE METHODOLOGY MODAL ───────────────────────── */}
      {activeInfoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setActiveInfoModal(null)}
              className="absolute top-5 right-5 text-[#94A3B8] hover:text-[#0F172A]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs font-mono">
                {activeInfoModal.num}
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-[#0F172A]">
                  {activeInfoModal.title}
                </h3>
                <span className="text-[10px] font-mono text-[#2563EB] px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                  {activeInfoModal.classification}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[#475569] leading-relaxed">
              <p className="font-medium text-[#0F172A]">
                {activeInfoModal.desc}
              </p>
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <p className="font-bold text-[#0F172A] text-[11px] uppercase tracking-wider font-mono">
                  Scientific Methodology & Physics Model:
                </p>
                <p className="text-xs text-[#475569]">
                  {activeInfoModal.methodology}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex justify-end">
              <button
                onClick={() => setActiveInfoModal(null)}
                className="px-5 py-2 rounded-full bg-[#0F172A] text-white text-xs font-semibold hover:bg-[#1E293B] transition-colors"
              >
                Close Technical Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Scan Modal */}
      <CameraScanModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
      />
    </div>
  );
}
