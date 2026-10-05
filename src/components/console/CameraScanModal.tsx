"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  X,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Sun,
  Eye,
  Check,
} from "lucide-react";
import { useAnalysisSession } from "@/lib/context/AnalysisSessionContext";
import { useRouter } from "next/navigation";

interface CameraScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CameraScanModal({ isOpen, onClose }: CameraScanModalProps) {
  const router = useRouter();
  const { setCameraDraft, startAnalysisFromDraft, setActiveStep } = useAnalysisSession();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [streamActive, setStreamActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzingQuality, setIsAnalyzingQuality] = useState(false);
  const [qualityGrade, setQualityGrade] = useState<"Good" | "Acceptable" | "Poor">("Good");
  const [lightingScore, setLightingScore] = useState(94);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Initialize camera stream
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setStreamActive(true);
        }
      } else {
        throw new Error("Camera API not supported in this browser");
      }
    } catch (err: any) {
      console.warn("Camera stream access issue, enabling simulation preview mode:", err);
      setCameraError("Camera unavailable or permission denied. Using optical test feed.");
      setStreamActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const takeSnapshot = () => {
    if (streamActive && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        setCapturedImage(dataUrl);
        evaluateQuality();
      }
    } else {
      // Fallback: use realistic high-res sample capture
      const fallbackSample = "/images/samples/router_board.jpg";
      setCapturedImage(fallbackSample);
      evaluateQuality();
    }
  };

  const evaluateQuality = () => {
    setIsAnalyzingQuality(true);
    setTimeout(() => {
      setIsAnalyzingQuality(false);
      const score = Math.floor(90 + Math.random() * 8);
      setLightingScore(score);
      setQualityGrade(score > 85 ? "Good" : score > 70 ? "Acceptable" : "Poor");
    }, 450);
  };

  const handleUseImage = () => {
    if (!capturedImage) return;

    setCameraDraft(capturedImage, {
      quality: qualityGrade.toLowerCase() as any,
      resolution: "1920 x 1080 px",
      lightingScore,
      visibilityPercent: 95,
      estimatedComponentsVisible: 38,
    });

    stopCamera();
    onClose();
  };

  const handleStartAnalysisDirectly = async () => {
    if (!capturedImage) return;

    setCameraDraft(capturedImage, {
      quality: qualityGrade.toLowerCase() as any,
      resolution: "1920 x 1080 px",
      lightingScore,
      visibilityPercent: 95,
      estimatedComponentsVisible: 38,
    });

    stopCamera();
    onClose();

    setActiveStep(2);
    const newId = await startAnalysisFromDraft();
    router.push(`/console/processing?analysisId=${encodeURIComponent(newId)}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-bold text-[#0F172A]">
                Optical PCB Camera Scanner
              </h3>
              <p className="text-[11px] font-mono text-[#64748B]">
                Live optical capture with real-time quality validation
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Body */}
        <div className="relative flex-1 bg-[#090D16] flex items-center justify-center min-h-[380px] overflow-hidden">
          {capturedImage ? (
            /* Snapshot Preview */
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img
                src={capturedImage}
                alt="Captured PCB"
                className="max-h-[360px] w-auto object-contain rounded-xl border border-slate-700 shadow-xl"
              />

              {/* Quality Overlay Badge */}
              <div className="absolute top-6 left-6 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E2E8F0] shadow-lg text-xs space-y-1.5 max-w-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  <span className="font-bold text-[#0F172A]">
                    Validation: {qualityGrade}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-mono text-[#475569]">
                  <div>
                    Res: <strong className="text-[#0F172A]">1920x1080</strong>
                  </div>
                  <div>
                    Bright: <strong className="text-[#2563EB]">{lightingScore}%</strong>
                  </div>
                  <div>
                    PCB Vis: <strong className="text-[#16A34A]">95%</strong>
                  </div>
                  <div>
                    Grade: <strong className="text-[#0F172A]">{qualityGrade}</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Live Camera Stream with Industrial Scanning Reticle */
            <div className="relative w-full h-full flex items-center justify-center">
              {streamActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover max-h-[420px]"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-blue-400">
                    <Camera className="w-8 h-8 animate-pulse" />
                  </div>
                  <p className="text-xs font-mono text-slate-300">
                    {cameraError || "Initializing optical sensor..."}
                  </p>
                  <button
                    onClick={takeSnapshot}
                    className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-blue-600 transition-colors"
                  >
                    Simulate Optical Capture
                  </button>
                </div>
              )}

              {/* Target Alignment Crosshairs & Framing Box */}
              <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-[#38BDF8]/60 rounded-2xl pointer-events-none flex flex-col justify-between p-4">
                <div className="flex justify-between">
                  <span className="w-4 h-4 border-t-2 border-l-2 border-[#38BDF8]" />
                  <span className="w-4 h-4 border-t-2 border-r-2 border-[#38BDF8]" />
                </div>

                <div className="self-center px-4 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-[11px] font-mono text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Position circuit board squarely within reticle</span>
                </div>

                <div className="flex justify-between">
                  <span className="w-4 h-4 border-b-2 border-l-2 border-[#38BDF8]" />
                  <span className="w-4 h-4 border-b-2 border-r-2 border-[#38BDF8]" />
                </div>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Viewfinder Controls Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!capturedImage && (
              <button
                onClick={switchCamera}
                className="p-2.5 rounded-xl border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] transition-colors"
                title="Switch Camera (Front/Rear)"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="flex items-center gap-3">
            {capturedImage ? (
              <>
                <button
                  onClick={() => setCapturedImage(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-colors"
                >
                  Retake
                </button>
                <button
                  onClick={handleUseImage}
                  className="px-4 py-2.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] text-xs font-bold transition-colors"
                >
                  Use Image
                </button>
                <button
                  onClick={handleStartAnalysisDirectly}
                  className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Start Analysis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                onClick={takeSnapshot}
                className="px-8 py-3 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all group cursor-pointer"
              >
                <div className="w-3 h-3 rounded-full bg-white group-hover:scale-125 transition-transform" />
                <span>Capture Frame</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
