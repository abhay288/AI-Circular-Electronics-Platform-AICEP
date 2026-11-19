"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
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
  Info,
  X,
  AlertCircle,
  HelpCircle,
  Check,
  RefreshCw,
  Eye,
  Microscope,
  Camera,
  FolderOpen,
  Smartphone,
} from "lucide-react";
import CameraScanModal from "@/components/console/CameraScanModal";

interface CapabilityItem {
  num: string;
  title: string;
  badge: string;
  badgeColor: string;
  desc: string;
  details: string[];
  dataRequirement: string;
  isVisualOnly?: boolean;
}

const CAPABILITIES: CapabilityItem[] = [
  {
    num: "01",
    title: "AI Component Detection",
    badge: "Optical AI · Active",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    desc: "Surface-mount device (SMD) and through-hole component identification with spatial bounding boxes from YOLOv11 neural inference.",
    details: [
      "Supported categories: ICs, Resistors, Capacitors, Diodes, Transistors, MOSFETs, Inductors, Connectors, Crystals, Sensors, Relays, LEDs, Fuses, Transformers",
      "Normalized coordinate bounding boxes (x, y, width, height) and pixel positions",
      "Detection confidence percentages; uncertain detections labeled 'Unknown electronic component'",
      "Strict policy: Never invents exact part numbers or manufacturer identities",
    ],
    dataRequirement: "High-resolution optical PCB surface photograph (minimum 800×800 px).",
  },
  {
    num: "02",
    title: "Visual Condition Inspection",
    badge: "Spectro-Spatial AI",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    desc: "Automated optical defect detection across visible surfaces using multi-spectrum color clustering and morphological anomaly filters.",
    details: [
      "Burn marks, charring, and localized solder mask degradation",
      "Visible corrosion, surface verdigris crust, and oxidation",
      "Component package cracks and physical fractures",
      "Bulging or leaking electrolyte on capacitor cans",
      "Missing components and unpopulated solder pads with visible evidence",
      "Damaged or lifted copper pads and broken surface traces",
      "Visible soldering irregularities and surface contamination",
      "Physical substrate deformation",
    ],
    dataRequirement: "Optical surface imaging under diffuse, non-glare illumination.",
  },
  {
    num: "03",
    title: "PCB Visual Surface Structure",
    badge: "OpenCV Topology Engine",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    desc: "Substrate boundary detection, pixel dimensions, surface area, visible copper trace continuity, and pad/via localization.",
    details: [
      "Board perimeter contour and surface area in pixels",
      "Visible top-layer copper trace mapping and observable trace interruptions",
      "Surface solder pads and plated through-hole via hole detection",
      "Observable surface damage zones and component spatial topology",
      "Strict policy: Does not claim internal layers, hidden vias, or electrical continuity without calibration target or electrical test data",
    ],
    dataRequirement: "Visible surface traces on outer copper layer. Internal planes cannot be confirmed optically.",
  },
  {
    num: "04",
    title: "OCR & Markings Recognition",
    badge: "OpenCV Gradient OCR",
    badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
    desc: "Optical text and silkscreen marking extraction for readable component reference designators and board lettering.",
    details: [
      "Silkscreen PCB reference designators (e.g. R1, C2, U3, J1, D4)",
      "Visible component package markings where optical contrast permits",
      "Clearly marks unreadable or low-contrast text as 'Uncertain marking'",
      "Strict policy: Never completes unreadable text by guessing",
    ],
    dataRequirement: "Sharp, high-contrast text strokes without motion blur or specular glare.",
  },
  {
    num: "05",
    title: "Surface Finish & Materials",
    badge: "Observable Characteristics Only",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    desc: "Identifies visibly recognizable surface finishes and substrate colors supported by optical image evidence.",
    details: [
      "Identifies observable surface finishes (e.g. HASL solder finish, ENIG gold-colored pads)",
      "Identifies solder mask color (green, blue, black, red) and visible FR-4 laminate",
      "Strict policy: Does not claim exact precious metal masses, elemental recovery grams, or monetary valuations from RGB appearance",
    ],
    dataRequirement: "Standard RGB color photography under balanced white lighting.",
  },
  {
    num: "06",
    title: "Evidence-Based Summary",
    badge: "Objective Findings",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
    desc: "Concise, evidence-based visual classification supported exclusively by verifiable findings.",
    details: [
      "Classification: No obvious visible damage detected / Minor / Moderate / Severe visible physical damage / Quality insufficient",
      "Transparent breakdown of optical findings and confidence levels",
      "Documented optical limitations explaining internal layers and electrical health boundaries",
      "Identifies specific areas requiring manual microscopy or electrical continuity testing",
    ],
    dataRequirement: "Synthesized automatically from real image detection and inspection results.",
  },
];

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/pjpeg"];

export default function LaunchConsolePage() {
  const router = useRouter();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; sizeFormatted: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeCapabilityModal, setActiveCapabilityModal] = useState<CapabilityItem | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Detect mobile phone / tablet devices
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isTouch = typeof navigator !== "undefined" && navigator.maxTouchPoints > 0 && window.innerWidth < 768;
      setIsMobile(mobileRegex.test(userAgent) || isTouch);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const validateAndSetFile = (file: File) => {
    setValidationError(null);

    const typeLower = (file.type || "").toLowerCase();
    const isImage =
      ALLOWED_TYPES.includes(typeLower) ||
      typeLower.startsWith("image/") ||
      /\.(jpe?g|png|webp)$/i.test(file.name);

    if (!isImage) {
      setValidationError("Unsupported file format. Please upload a JPG, JPEG, PNG, or WEBP image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError(
        `File size (${formatFileSize(file.size)}) exceeds the maximum limit of 15 MB. Please select a smaller image.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setPreviewUrl(url);

      // Measure dimensions
      const img = new Image();
      img.onload = () => {
        setImageMeta({
          width: img.width,
          height: img.height,
          sizeFormatted: formatFileSize(file.size),
        });
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);
  };

  const handleCameraTrigger = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isMobile) {
      // On mobile / phone: launch native device camera popup directly
      cameraInputRef.current?.click();
    } else {
      // On desktop / laptop: open optical webcam viewfinder scanner
      setIsCameraModalOpen(true);
    }
  };

  const handleBrowseTrigger = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageMeta(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setValidationError(null);

    try {
      // 1. Initialize session on backend
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "");
      const createRes = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: "UPLOAD",
          mode: "LIVE",
          deviceName: cleanName || "Electronic Circuit Assembly",
          deviceType: "Electronic Circuit Assembly (PCB)",
        }),
      });

      if (!createRes.ok) {
        const errJson = await createRes.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || "Failed to initialize analysis session.");
      }

      const createData = await createRes.json();
      const analysisId = createData.data?.analysisId || createData.analysisId;

      if (!analysisId) {
        throw new Error("Backend did not return a valid analysis ID.");
      }

      // 2. Upload file to /api/analysis/[analysisId]/upload
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadRes = await fetch(`/api/analysis/${encodeURIComponent(analysisId)}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errJson = await uploadRes.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || "Failed to upload image file to analysis server.");
      }

      // 3. Start real analysis pipeline
      const startRes = await fetch(`/api/analysis/${encodeURIComponent(analysisId)}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!startRes.ok) {
        const errJson = await startRes.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || "Failed to start analysis pipeline.");
      }

      // 4. Save to recent sessions for easy retrieval
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("ecointel_recent_sessions_v2");
          const recentList = stored ? JSON.parse(stored) : [];
          const entry = {
            id: analysisId,
            deviceName: cleanName || "Electronic Circuit Assembly",
            deviceType: "Electronic Circuit Assembly (PCB)",
            sourceType: "upload",
            status: "PROCESSING",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          const updated = [entry, ...recentList.filter((item: any) => item.id !== analysisId)].slice(0, 10);
          localStorage.setItem("ecointel_recent_sessions_v2", JSON.stringify(updated));
        } catch (e) {
          console.warn("Could not cache recent session:", e);
        }
      }

      // 5. Navigate directly to real processing screen
      router.push(`/console/processing?analysisId=${encodeURIComponent(analysisId)}`);
    } catch (err: any) {
      console.error("[Launch Console Error]:", err);
      setValidationError(err.message || "Failed to launch analysis. Please check image and retry.");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 py-6 sm:py-10 px-3 sm:px-8 max-w-7xl mx-auto w-full space-y-8 sm:space-y-12">
      {/* ─── INTRODUCTION ────────────────────────────────────────── */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-mono font-bold text-[#2563EB]">
          <Microscope className="w-3.5 h-3.5" />
          <span>Industrial Electronics Intelligence</span>
        </div>

        <h1 className="font-heading text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
          Electronic Intelligence Workspace
        </h1>

        <p className="text-sm sm:text-base text-[#475569] leading-relaxed max-w-2xl mx-auto">
          Upload or photograph a PCB or electronic component to perform AI-powered component identification, visual condition assessment, PCB analysis, and material intelligence.
        </p>

        {/* Image Quality Instructions Callout */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 text-left max-w-2xl mx-auto space-y-2 text-xs text-[#475569]">
          <div className="flex items-center gap-2 font-bold text-[#0F172A]">
            <Info className="w-4 h-4 text-[#2563EB]" />
            <span>Image Capture & Quality Requirements</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6 list-disc text-[11px] leading-relaxed">
            <li>Supported formats: JPG, JPEG, PNG, WEBP (Max 15MB)</li>
            <li>Perpendicular top-down angle for accurate bounding boxes</li>
            <li>Diffuse, even lighting without high-reflectance glare</li>
            <li>Hold camera steady with focus locked on the components</li>
          </ul>
        </div>
      </div>

      {/* ─── IMAGE UPLOAD & CAMERA AREA ─────────────────────────── */}
      <div className="max-w-3xl mx-auto">
        <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F1F5F9] pb-4">
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-bold text-[#0F172A]">
                Upload Hardware Image
              </h2>
              <p className="text-xs text-[#64748B]">
                Public analysis — Take photo with camera or choose local file
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full font-semibold border border-[#BFDBFE]">
                Max 15MB · JPG / PNG / WEBP
              </span>
            </div>
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{validationError}</div>
              <button
                onClick={() => setValidationError(null)}
                className="text-red-400 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Hidden HTML5 Native File & Camera Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {/* Upload Drop Zone / Staged Preview */}
          {!previewUrl ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => {
                if (isMobile) {
                  // On mobile: default tap triggers native camera
                  handleCameraTrigger();
                } else {
                  fileInputRef.current?.click();
                }
              }}
              className={`min-h-[290px] sm:h-72 w-full rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-5 sm:p-8 text-center cursor-pointer ${
                dragOver
                  ? "border-[#2563EB] bg-[#EFF6FF]"
                  : "border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#2563EB]/70 hover:bg-[#F1F5F9]"
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] text-[#2563EB] mx-auto flex items-center justify-center mb-3">
                <UploadCloud className="w-7 h-7" />
              </div>

              <div className="space-y-1 mb-5">
                <p className="text-sm font-bold text-[#0F172A]">
                  Capture or Upload Hardware Image
                </p>
                <p className="text-xs text-[#64748B] max-w-sm">
                  {isMobile
                    ? "Tap below to take a photo directly with your camera or browse your gallery"
                    : "Drag and drop your PCB image here, or select an option below"}
                </p>
              </div>

              {/* Action Buttons Strip */}
              <div
                className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 1. Camera Trigger Button */}
                <button
                  type="button"
                  onClick={handleCameraTrigger}
                  className="w-full sm:w-auto flex-1 min-h-[46px] px-5 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4 shrink-0" />
                  <span>{isMobile ? "Take Photo (Camera)" : "Use Camera Scanner"}</span>
                </button>

                {/* 2. File / Gallery Browser Button */}
                <button
                  type="button"
                  onClick={handleBrowseTrigger}
                  className="w-full sm:w-auto flex-1 min-h-[46px] px-5 py-3 rounded-xl bg-white hover:bg-[#F8FAFC] active:scale-[0.98] border border-[#CBD5E1] text-[#0F172A] text-xs font-bold shadow-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4 text-[#64748B] shrink-0" />
                  <span>{isMobile ? "Choose from Gallery" : "Browse Local Files"}</span>
                </button>
              </div>

              {/* Context Hint */}
              <div className="pt-4 flex items-center gap-2 text-[11px] font-mono text-[#94A3B8]">
                <span>Supported: JPG, PNG, WEBP</span>
                <span>·</span>
                <span>Max size: 15 MB</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row items-center gap-5">
                <div className="w-full sm:w-48 h-48 sm:h-36 rounded-xl overflow-hidden bg-slate-900 border border-[#CBD5E1] flex-shrink-0 relative">
                  <img
                    src={previewUrl}
                    alt="Uploaded preview"
                    className="w-full h-full object-contain sm:object-cover"
                  />
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/75 text-white font-mono text-[9px] font-bold">
                    PREVIEW
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-2 text-left w-full">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-sm text-[#0F172A] truncate" title={selectedFile?.name}>
                      {selectedFile?.name}
                    </p>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold flex items-center gap-1 flex-shrink-0">
                      <Check className="w-3 h-3" /> Validated
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#475569]">
                    <div className="bg-white p-2 rounded-lg border border-[#E2E8F0]">
                      <span className="text-[10px] text-[#94A3B8] block">FILE SIZE</span>
                      <span className="font-semibold text-[#0F172A]">{imageMeta?.sizeFormatted || "—"}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-[#E2E8F0]">
                      <span className="text-[10px] text-[#94A3B8] block">RESOLUTION</span>
                      <span className="font-semibold text-[#0F172A]">
                        {imageMeta ? `${imageMeta.width} × ${imageMeta.height} px` : "Measuring..."}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#64748B]">
                    Image validated. Ready for optical component segmentation, package classification, and condition assessment.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleClearSelection}
                    disabled={isAnalyzing}
                    className="min-h-[44px] px-3 sm:px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-colors cursor-pointer text-center"
                  >
                    Remove
                  </button>
                  <button
                    onClick={handleCameraTrigger}
                    disabled={isAnalyzing}
                    className="min-h-[44px] px-3 sm:px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#2563EB] hover:bg-[#EFF6FF] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    title="Retake photo using camera"
                  >
                    <Camera className="w-3.5 h-3.5 shrink-0" />
                    <span>Retake</span>
                  </button>
                  <button
                    onClick={handleBrowseTrigger}
                    disabled={isAnalyzing}
                    className="min-h-[44px] px-3 sm:px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-colors cursor-pointer text-center"
                  >
                    Replace
                  </button>
                </div>

                <button
                  onClick={handleAnalyzeImage}
                  disabled={isAnalyzing}
                  className="w-full sm:w-auto min-h-[44px] px-8 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Initializing Pipeline...</span>
                    </>
                  ) : (
                    <>
                      <span>Analyze Image</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Optical Camera Viewfinder Modal (Desktop & Interactive Reticle) */}
      <CameraScanModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCaptureFile={(file) => {
          validateAndSetFile(file);
          setIsCameraModalOpen(false);
        }}
      />

      {/* ─── ANALYSIS CAPABILITIES (8 DETAILED PILLARS) ──────────── */}
      <div className="space-y-6 pt-6">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <span className="text-xs font-mono font-bold text-[#2563EB] tracking-wider uppercase">
            OPERATIONAL SPECIFICATION
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#0F172A]">
            Analysis Capabilities
          </h2>
          <p className="text-xs text-[#64748B]">
            Only advertised capabilities actually operational in the platform. Capabilities requiring additional telemetry are explicitly identified.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CAPABILITIES.map((cap) => (
            <div
              key={cap.num}
              onClick={() => setActiveCapabilityModal(cap)}
              className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm hover:border-[#2563EB] hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#94A3B8]">
                    {cap.num}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${cap.badgeColor}`}>
                    {cap.badge}
                  </span>
                </div>

                <h3 className="font-heading text-base font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                  {cap.title}
                </h3>

                <p className="text-xs text-[#475569] leading-relaxed line-clamp-3">
                  {cap.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-[#F1F5F9] mt-3 flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#2563EB] group-hover:underline">
                  Inspect Spec →
                </span>
                {cap.isVisualOnly && (
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                    Visual Score
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CAPABILITY DETAIL MODAL ──────────────────────────────── */}
      {activeCapabilityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] max-w-xl w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setActiveCapabilityModal(null)}
              className="absolute top-5 right-5 text-[#94A3B8] hover:text-[#0F172A]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold font-mono">
                {activeCapabilityModal.num}
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-[#0F172A]">
                  {activeCapabilityModal.title}
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${activeCapabilityModal.badgeColor}`}>
                  {activeCapabilityModal.badge}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed">
              {activeCapabilityModal.desc}
            </p>

            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold text-[#0F172A] uppercase tracking-wider block">
                Implemented Scope & Capabilities:
              </span>
              <ul className="space-y-1.5 pl-4 list-disc text-xs text-[#475569]">
                {activeCapabilityModal.details.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1 text-xs">
              <span className="font-bold text-[#0F172A] text-[10px] uppercase font-mono block">
                Data Requirement & Boundaries:
              </span>
              <p className="text-[#475569]">
                {activeCapabilityModal.dataRequirement}
              </p>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex justify-end">
              <button
                onClick={() => setActiveCapabilityModal(null)}
                className="px-5 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold hover:bg-[#1E293B] transition-colors"
              >
                Close Technical Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
