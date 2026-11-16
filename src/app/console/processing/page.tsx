"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  FileCheck2,
  UploadCloud,
  Microscope,
  FileText,
} from "lucide-react";

interface StageItem {
  id: string;
  name: string;
  description: string;
  icon: any;
}

const STAGES: StageItem[] = [
  {
    id: "quality",
    name: "Evaluating image quality & resolution",
    description: "Checking pixel resolution, blur variance, glare, and optical lighting.",
    icon: UploadCloud,
  },
  {
    id: "detection",
    name: "Detecting visible electronic components",
    description: "YOLOv11 optical detection across 16 surface-mount and through-hole component classes.",
    icon: Cpu,
  },
  {
    id: "pcb",
    name: "Analyzing PCB visual structure",
    description: "OpenCV boundary detection, visible trace mapping, pads, and via holes.",
    icon: Layers,
  },
  {
    id: "damage",
    name: "Inspecting visible physical anomalies",
    description: "Screening visible surfaces for burn marks, corrosion, cracks, bulging, and lifted pads.",
    icon: Microscope,
  },
  {
    id: "ocr",
    name: "Extracting readable text & markings",
    description: "Detecting visible silkscreen labels, reference designators, and package markings.",
    icon: FileText,
  },
  {
    id: "summary",
    name: "Compiling evidence-based report",
    description: "Synthesizing image findings, optical boundaries, and inspection limitations.",
    icon: FileCheck2,
  },
];

type StageStatus = "pending" | "processing" | "completed" | "failed";

function ConsoleProcessingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("analysisId") || searchParams.get("sessionId");

  const [sessionStatus, setSessionStatus] = useState<string>("INITIALIZING");
  const [stageStatuses, setStageStatuses] = useState<Record<string, StageStatus>>({
    quality: "completed",
    detection: "pending",
    pcb: "pending",
    damage: "pending",
    ocr: "pending",
    summary: "pending",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!analysisId) {
      setErrorMessage("Missing analysis ID. Please return to the console and upload an image.");
      return;
    }

    let isMounted = true;
    let timer: NodeJS.Timeout;
    let hasAutoStarted = false;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/analysis/${encodeURIComponent(analysisId)}/status`);
        if (!res.ok) {
          throw new Error(`Failed to fetch analysis status (HTTP ${res.status})`);
        }

        const json = await res.json();
        const data = json.data || json;

        if (!isMounted) return;

        setSessionStatus(data.status || "PROCESSING");
        setPollCount((prev) => prev + 1);

        // Auto-heal: If session is in READY state, proactively trigger /start
        if (data.status === "READY" && !hasAutoStarted) {
          hasAutoStarted = true;
          fetch(`/api/analysis/${encodeURIComponent(analysisId)}/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          })
            .then(async (startRes) => {
              if (!startRes.ok) {
                const errJson = await startRes.json().catch(() => ({}));
                setErrorMessage(errJson?.error?.message || "Failed to trigger analysis pipeline. Please retry.");
              }
            })
            .catch((e: any) => {
              setErrorMessage(e.message || "Could not reach analysis server. Please retry.");
            });
        }

        // Map backend stageStatuses to the 6 visible stages
        const backendStages = data.stageStatuses || {};
        const isCompleted = data.status === "COMPLETED";
        const isFailed = data.status === "FAILED";

        if (isFailed) {
          setErrorMessage(data.error?.message || "Analysis pipeline encountered an error during execution.");
        }

        const newStatuses: Record<string, StageStatus> = {
          quality: "completed",
          detection: isCompleted
            ? "completed"
            : backendStages.detection === "completed"
            ? "completed"
            : backendStages.detection === "failed"
            ? "failed"
            : backendStages.detection === "processing" || data.status === "PROCESSING"
            ? "processing"
            : "pending",
          pcb: isCompleted
            ? "completed"
            : backendStages.pcb === "completed"
            ? "completed"
            : backendStages.pcb === "failed"
            ? "failed"
            : backendStages.pcb === "processing" || (backendStages.detection === "completed" && !backendStages.pcb)
            ? "processing"
            : "pending",
          damage: isCompleted
            ? "completed"
            : backendStages.damage === "completed" || backendStages.pcb === "completed"
            ? "completed"
            : backendStages.pcb === "processing"
            ? "processing"
            : "pending",
          ocr: isCompleted
            ? "completed"
            : backendStages.ocr === "completed" || backendStages.detection === "completed"
            ? "completed"
            : backendStages.detection === "completed"
            ? "processing"
            : "pending",
          summary: isCompleted
            ? "completed"
            : backendStages.summary === "completed"
            ? "completed"
            : backendStages.summary === "processing" || backendStages.pcb === "completed"
            ? "processing"
            : "pending",
        };

        setStageStatuses(newStatuses);

        // If complete, navigate to results page
        if (isCompleted) {
          setTimeout(() => {
            if (isMounted) {
              router.push(`/console/results?analysisId=${encodeURIComponent(analysisId)}`);
            }
          }, 800);
          return;
        }

        // Keep polling every 1000ms if not completed or failed
        if (!isFailed) {
          timer = setTimeout(checkStatus, 1000);
        }
      } catch (err: any) {
        console.warn("[Processing Status Poll Warning]:", err.message);
        if (isMounted && !errorMessage) {
          timer = setTimeout(checkStatus, 2000);
        }
      }
    };

    checkStatus();

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [analysisId, router]);

  const handleRetry = async () => {
    if (!analysisId) return;
    setIsRetrying(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/analysis/${encodeURIComponent(analysisId)}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message || "Failed to restart analysis.");
      }
      setSessionStatus("PROCESSING");
      window.location.reload();
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to restart analysis.");
      setIsRetrying(false);
    }
  };

  return (
    <div className="flex-1 py-12 px-4 sm:px-8 max-w-3xl mx-auto w-full space-y-8">
      {/* ─── HEADER ──────────────────────────────────────────────── */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-mono font-bold text-[#2563EB]">
          <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-ping" />
          <span>Real-Time Neural Processing</span>
        </div>

        <h1 className="font-heading text-3xl font-extrabold text-[#0F172A] tracking-tight">
          Analyzing Your Electronics
        </h1>

        <p className="text-sm text-[#64748B] max-w-lg mx-auto">
          EcoIntel is executing the optical computer vision and circular intelligence pipeline on your hardware image.
        </p>

        {analysisId && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono text-[#475569]">
            <span>Session ID:</span>
            <strong className="text-[#0F172A]">#{analysisId}</strong>
            <span className="text-slate-300">·</span>
            <span className="text-emerald-700 font-semibold uppercase text-[10px]">
              {sessionStatus}
            </span>
          </div>
        )}
      </div>

      {/* ─── ERROR STATE WITH RETRY ──────────────────────────────── */}
      {errorMessage && (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 space-y-3 text-left">
          <div className="flex items-center gap-2 font-bold text-red-900 text-sm">
            <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>Analysis Stage Failed</span>
          </div>
          <p className="text-xs text-red-700 leading-relaxed">
            {errorMessage}
          </p>
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
              <span>Retry Analysis</span>
            </button>
            <button
              onClick={() => router.push("/console")}
              className="px-4 py-2 rounded-xl border border-red-300 text-xs font-semibold text-red-800 hover:bg-red-100 transition-colors cursor-pointer"
            >
              Back to Workspace
            </button>
          </div>
        </div>
      )}

      {/* ─── LIVE BACKEND STAGES LIST ────────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-4 text-left">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
          <span className="text-xs font-mono font-bold text-[#0F172A] uppercase tracking-wider">
            Pipeline Execution Stages
          </span>
          <span className="text-[11px] font-mono text-[#64748B]">
            Live telemetry sync
          </span>
        </div>

        <div className="space-y-3">
          {STAGES.map((stage) => {
            const status = stageStatuses[stage.id] || "pending";
            const IconComp = stage.icon;

            return (
              <div
                key={stage.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  status === "completed"
                    ? "bg-[#F0FDF4] border-[#DCFCE7]"
                    : status === "processing"
                    ? "bg-[#EFF6FF] border-[#BFDBFE] shadow-sm"
                    : status === "failed"
                    ? "bg-red-50 border-red-200"
                    : "bg-[#F8FAFC] border-[#E2E8F0] opacity-60"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      status === "completed"
                        ? "bg-[#16A34A] text-white"
                        : status === "processing"
                        ? "bg-[#2563EB] text-white"
                        : status === "failed"
                        ? "bg-red-600 text-white"
                        : "bg-[#E2E8F0] text-[#94A3B8]"
                    }`}
                  >
                    {status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : status === "processing" ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : status === "failed" ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <IconComp className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <p
                      className={`text-sm font-bold truncate ${
                        status === "completed"
                          ? "text-[#16A34A]"
                          : status === "processing"
                          ? "text-[#2563EB]"
                          : status === "failed"
                          ? "text-red-900"
                          : "text-[#64748B]"
                      }`}
                    >
                      {stage.name}
                    </p>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      {stage.description}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span
                    className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                      status === "completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : status === "processing"
                        ? "bg-blue-100 text-blue-800 animate-pulse"
                        : status === "failed"
                        ? "bg-red-100 text-red-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {status === "completed"
                      ? "Completed"
                      : status === "processing"
                      ? "In Progress"
                      : status === "failed"
                      ? "Failed"
                      : "Pending"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info note */}
        <div className="pt-4 border-t border-[#F1F5F9] text-center text-xs text-[#64748B]">
          Processing completes within 3 to 8 seconds depending on image resolution. Results page will open automatically.
        </div>
      </div>
    </div>
  );
}

export default function ConsoleProcessingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 py-20 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-[#2563EB] animate-spin mb-3" />
          <span className="font-mono text-xs font-bold text-[#0F172A]">
            Loading Processing Telemetry...
          </span>
        </div>
      }
    >
      <ConsoleProcessingContent />
    </Suspense>
  );
}
