"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Cpu,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Activity,
  Coins,
  ShieldCheck,
  Leaf,
  Wrench,
  ArrowRight,
  Maximize2,
  Eye,
  Sliders,
  RotateCcw,
} from "lucide-react";
import { useAnalysisSession } from "@/lib/context/AnalysisSessionContext";

const ProcessingPcb3D = dynamic(
  () => import("@/components/3d/ProcessingPcb3D"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#F1F5F9] rounded-3xl min-h-[380px]">
        <Cpu className="w-10 h-10 text-[#2563EB] animate-pulse mb-2" />
        <span className="font-mono text-xs text-[#0F172A] font-bold">
          Synthesizing 3D Neural Spatial Inspection Mesh...
        </span>
      </div>
    ),
  }
);

export default function ConsoleProcessingPage() {
  const router = useRouter();
  const { session, runAnalysis, setActiveStep, isAnalyzing, liveDetections } =
    useAnalysisSession();

  const [currentPipelineStep, setCurrentPipelineStep] = useState(1);
  const [exploded, setExploded] = useState(false);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showTraces, setShowTraces] = useState(true);
  const [hasCompleted, setHasCompleted] = useState(false);

  const pipelineStages = [
    { num: "01", name: "Image Acquisition & Optical Calibration", icon: Eye },
    { num: "02", name: "Component Detection (YOLOv11 Spectro-Spatial)", icon: Cpu },
    { num: "03", name: "PCB Topology & Trace Reconstruction", icon: Layers },
    { num: "04", name: "Physics-Informed Health Assessment", icon: Activity },
    { num: "05", name: "Remaining Useful Life (RUL) Prediction", icon: Clock },
    { num: "06", name: "Precious Material Recovery Estimation", icon: Coins },
    { num: "07", name: "AI Repair & Refurbishment Intelligence", icon: Wrench },
    { num: "08", name: "Digital Product Passport Synthesis", icon: ShieldCheck },
    { num: "09", name: "Scope 3 ESG & Carbon Life-Cycle Analysis", icon: Leaf },
  ];

  useEffect(() => {
    let isMounted = true;

    // Trigger analysis progression
    runAnalysis((step) => {
      if (isMounted) {
        setCurrentPipelineStep(step);
      }
    }).then(() => {
      if (isMounted) {
        setHasCompleted(true);
        // Automatically route to results after brief delay
        setTimeout(() => {
          setActiveStep(3);
          router.push("/console/results");
        }, 1200);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const getStepStatus = (index: number) => {
    const stepNumber = index + 1;
    if (stepNumber < currentPipelineStep) return "completed";
    if (stepNumber === currentPipelineStep) return "processing";
    if (stepNumber === currentPipelineStep + 1) return "queued";
    return "waiting";
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-8 flex flex-col justify-between">
      
      {/* ─── TITLE & METADATA BAR ──────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] animate-ping" />
            <span className="text-xs font-mono font-bold text-[#2563EB] tracking-wider uppercase">
              AI INFERENCE IN PROGRESS
            </span>
            <span className="text-xs font-mono text-[#64748B]">·</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-white border border-[#E2E8F0] font-semibold text-[#0F172A] uppercase">
              {session.dataClassification === "sample" ? "Demonstration Dataset" : "Live Device Ingest"}
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Analyzing Your Electronic Hardware
          </h1>
          <p className="text-xs text-[#64748B]">
            EcoIntel is building a digital intelligence profile of <strong className="text-[#0F172A]">{session.deviceName}</strong> ({session.deviceType}).
          </p>
        </div>

        {/* Real-time Status Card */}
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="text-right">
            <p className="text-[10px] font-mono text-[#64748B] uppercase">Session Stream</p>
            <p className="font-mono text-sm font-bold text-[#0F172A]">#{session.sessionId}</p>
          </div>
          <div className="h-8 w-px bg-[#E2E8F0]" />
          <div className="text-right">
            <p className="text-[10px] font-mono text-[#64748B] uppercase">Neural Inference</p>
            <p className="font-mono text-sm font-bold text-[#16A34A]">
              {hasCompleted ? "Completed" : "Active (42ms)"}
            </p>
          </div>
        </div>
      </div>

      {/* ─── MAIN STAGE: 3D PCB SCANNER + LIVE DETECTION CARDS ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
        
        {/* 3D Visualizer Container (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-4 flex flex-col justify-between relative overflow-hidden min-h-[440px]">
          
          {/* Top 3D Control Pill */}
          <div className="flex items-center justify-between z-10 px-2 pt-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span className="font-mono text-xs font-bold text-[#0F172A]">
                3D Substrate & Laser Reticle
              </span>
            </div>

            {/* Viewer Toggles */}
            <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-1 text-[11px] font-mono">
              <button
                onClick={() => setExploded(!exploded)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  exploded ? "bg-[#2563EB] text-white font-bold" : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {exploded ? "Collapsed" : "Explode"}
              </button>
              <button
                onClick={() => setShowTraces(!showTraces)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  showTraces ? "bg-[#EFF6FF] text-[#2563EB] font-bold" : "text-[#94A3B8]"
                }`}
              >
                Traces
              </button>
              <button
                onClick={() => setShowBoxes(!showBoxes)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  showBoxes ? "bg-[#EFF6FF] text-[#2563EB] font-bold" : "text-[#94A3B8]"
                }`}
              >
                B-Boxes
              </button>
            </div>
          </div>

          {/* Interactive Three.js Scene */}
          <div className="flex-1 w-full flex items-center justify-center my-2">
            <ProcessingPcb3D
              isScanning={!hasCompleted}
              exploded={exploded}
              showTraces={showTraces}
              showBoxes={showBoxes}
            />
          </div>

          {/* Bottom Telemetry Bar */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-3 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-[#475569]">
              <RotateCcw className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Rotate: Click & Drag · Zoom: Scroll</span>
            </div>
            <div className="text-[#2563EB] font-bold">
              {liveDetections.length} Components Segmented
            </div>
          </div>
        </div>

        {/* Right Stage: Pipeline Tracker + Live Detection Feed (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Pipeline Tracker */}
          <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <span className="font-heading text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Inference Pipeline Progress
              </span>
              <span className="text-xs font-mono font-bold text-[#2563EB]">
                Stage {currentPipelineStep} / 9
              </span>
            </div>

            <div className="space-y-2">
              {pipelineStages.map((stage, idx) => {
                const status = getStepStatus(idx);
                const IconComp = stage.icon;

                return (
                  <div
                    key={stage.num}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all ${
                      status === "completed"
                        ? "bg-[#F0FDF4] border border-[#DCFCE7] text-[#16A34A]"
                        : status === "processing"
                        ? "bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-bold shadow-sm"
                        : status === "queued"
                        ? "bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B]"
                        : "opacity-45 text-[#94A3B8]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          status === "completed"
                            ? "bg-[#16A34A] text-white"
                            : status === "processing"
                            ? "bg-[#2563EB] text-white animate-pulse"
                            : "bg-[#E2E8F0] text-[#64748B]"
                        }`}
                      >
                        {status === "completed" ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          stage.num
                        )}
                      </div>
                      <span className="truncate max-w-[210px]">{stage.name}</span>
                    </div>

                    <span className="text-[10px] uppercase font-bold tracking-wider">
                      {status === "completed"
                        ? "Completed"
                        : status === "processing"
                        ? "Processing"
                        : status === "queued"
                        ? "Queued"
                        : "Waiting"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Detected Stream Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm flex-1 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
                <span className="font-heading text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Live Neural Detections
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#16A34A] font-bold">
                50-Micron Precision
              </span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {liveDetections.length === 0 ? (
                <div className="py-6 text-center text-xs font-mono text-[#94A3B8]">
                  Scanning PCB surface for SMD packages...
                </div>
              ) : (
                liveDetections.map((comp, idx) => (
                  <div
                    key={comp.id || idx}
                    className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs animate-fadeIn"
                  >
                    <div>
                      <p className="font-bold text-[#0F172A] text-xs">{comp.name}</p>
                      <p className="text-[10px] font-mono text-[#64748B]">
                        {comp.type} · {comp.package}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] font-mono text-[10px] font-bold">
                        {comp.confidence}% Conf.
                      </span>
                      <p className="text-[9px] font-mono text-[#2563EB] mt-0.5">
                        Health {comp.health}%
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Direct Bypass Button if user wants to immediately view results */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setActiveStep(3);
                  router.push("/console/results");
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F1F5F9] hover:bg-[#2563EB] text-[#475569] hover:text-white text-xs font-semibold font-mono transition-colors flex items-center justify-center gap-2"
              >
                <span>View Full Results Overview</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
