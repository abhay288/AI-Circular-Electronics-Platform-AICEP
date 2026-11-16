"use client";

import React, { useState, useRef, useEffect } from "react";
import { DetectedComponent } from "@/lib/types/analysis";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Crosshair,
  Sparkles,
  Layers,
} from "lucide-react";

interface RealPcbViewerProps {
  imageUrl: string;
  components: DetectedComponent[];
  selectedComponent: DetectedComponent | null;
  onSelectComponent: (comp: DetectedComponent) => void;
  showBoxes?: boolean;
  showLabels?: boolean;
}

export default function RealPcbViewer({
  imageUrl,
  components,
  selectedComponent,
  onSelectComponent,
  showBoxes = true,
  showLabels = true,
}: RealPcbViewerProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredCompId, setHoveredCompId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Hardware Condition State (supports testing actual device condition: clean, light, moderate, heavy)
  const [activeCondition, setActiveCondition] = useState<"clean" | "light" | "moderate" | "heavy">("clean");

  const containerRef = useRef<HTMLDivElement>(null);

  // Extract base sample key if applicable
  const baseBoardMatch = (imageUrl || "").match(/(laptop_motherboard|laptop-motherboard|router_board|router-board|iot_controller|iot-controller|power_supply|power-supply|industrial_controller|industrial-controller|smartphone_pcb|smartphone-pcb)/i);
  const baseName = baseBoardMatch ? baseBoardMatch[1].replace(/-/g, "_").toLowerCase() : null;

  // Resolve current image URL based on selected actual condition
  const effectiveImageUrl = React.useMemo(() => {
    if (!baseName) return imageUrl || "/images/samples/router_board.jpg";
    if (activeCondition === "clean") {
      return `/images/samples/conditions/${baseName}_clean.jpg`;
    }
    if (activeCondition === "light") {
      return `/images/samples/conditions/${baseName}_dust_light.jpg`;
    }
    if (activeCondition === "moderate") {
      return `/images/samples/conditions/${baseName}_dust_moderate.jpg`;
    }
    if (activeCondition === "heavy") {
      return `/images/samples/conditions/${baseName}_dust_heavy.jpg`;
    }
    return imageUrl || "/images/samples/router_board.jpg";
  }, [baseName, activeCondition, imageUrl]);

  const conditionMeta = {
    clean: {
      label: "Clean / Mint Condition",
      badgeColor: "bg-[#DCFCE7] text-[#16A34A] border-emerald-300",
      dotColor: "bg-[#16A34A]",
      recommendation: "Pristine optical condition · Direct component desolder & reuse certified.",
      dustIndex: "0.042 (Clean)",
    },
    light: {
      label: "Light Dust Condition",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      dotColor: "bg-blue-500",
      recommendation: "Minor dust film present · Standard anti-static wipe recommended.",
      dustIndex: "0.134 (Light Dust)",
    },
    moderate: {
      label: "Moderate Dust Condition",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-300",
      dotColor: "bg-amber-500",
      recommendation: "Surface dust accumulation detected · Compressed air de-dusting required.",
      dustIndex: "0.165 (Moderate Veil)",
    },
    heavy: {
      label: "Heavy E-Waste Condition",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-300",
      dotColor: "bg-rose-500",
      recommendation: "Heavy particulate crust · Automated ultrasonic IPA bath mandatory prior to recovery.",
      dustIndex: "0.228 (Heavy Contamination)",
    },
  }[activeCondition];

  // Zoom handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.3, 3.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.3, 0.7));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-slate-950 rounded-2xl border border-[#E2E8F0] select-none ${
        isFullscreen ? "fixed inset-4 z-50 rounded-3xl shadow-2xl h-[calc(100vh-2rem)]" : "h-80 sm:h-96"
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Telemetry Header Overlay */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
        <span className="px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-white flex items-center gap-1.5 shadow-sm">
          <span className={`w-2 h-2 rounded-full ${conditionMeta.dotColor} animate-pulse`} />
          <span>Real Optical Scan</span>
        </span>
        <span className="px-2 py-0.5 rounded-md bg-blue-500/20 backdrop-blur-md border border-blue-500/40 text-[10px] font-mono text-[#60A5FA]">
          50-Micron Telemetry
        </span>
        <span className={`px-2 py-0.5 rounded-md backdrop-blur-md border text-[10px] font-mono font-bold ${conditionMeta.badgeColor}`}>
          {conditionMeta.label}
        </span>
      </div>

      {/* Actual Condition Switcher Bar for Real Hardware Devices */}
      {baseName && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 hidden sm:flex items-center gap-1 bg-black/85 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-lg">
          <span className="text-[10px] font-mono text-slate-400 px-2 font-bold uppercase">Condition:</span>
          {(["clean", "light", "moderate", "heavy"] as const).map((cond) => {
            const isActive = activeCondition === cond;
            const labels = {
              clean: "Clean",
              light: "Light Dust",
              moderate: "Moderate",
              heavy: "Heavy E-Waste",
            };
            return (
              <button
                key={cond}
                type="button"
                onClick={() => setActiveCondition(cond)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  isActive
                    ? cond === "clean"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : cond === "light"
                      ? "bg-blue-600 text-white shadow-xs"
                      : cond === "moderate"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-rose-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {labels[cond]}
              </button>
            );
          })}
        </div>
      )}

      {/* Floating Action Controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-lg">
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Reset Zoom"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-white/20 mx-0.5" />
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Viewport Canvas / Image Stage */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-75 cursor-crosshair"
        style={{
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
        }}
      >
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          {/* Real PCB Photographic Scan */}
          <img
            src={effectiveImageUrl}
            alt="Real Optical Hardware Capture"
            className="max-h-[380px] w-auto object-contain rounded-lg shadow-2xl pointer-events-none"
          />

          {/* Interactive AI Bounding Box Overlays */}
          {showBoxes &&
            components.map((comp) => {
              const coords = comp.coordinates || { x: 50, y: 50, width: 10, height: 10 };
              const isSelected = selectedComponent?.id === comp.id;
              const isHovered = hoveredCompId === comp.id;

              return (
                <div
                  key={comp.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectComponent(comp);
                  }}
                  onMouseEnter={() => setHoveredCompId(comp.id)}
                  onMouseLeave={() => setHoveredCompId(null)}
                  style={{
                    left: `${coords.x}%`,
                    top: `${coords.y}%`,
                    width: `${coords.width}%`,
                    height: `${coords.height}%`,
                  }}
                  className={`absolute rounded-sm transition-all cursor-pointer ${
                    isSelected
                      ? "border-2 border-[#38BDF8] bg-sky-500/25 ring-2 ring-sky-400/50 shadow-lg shadow-sky-500/30 z-30"
                      : isHovered
                      ? "border-2 border-[#4ADE80] bg-emerald-500/20 z-20"
                      : "border border-sky-400/60 bg-sky-500/10 hover:border-emerald-400 z-10"
                  }`}
                >
                  {/* Precision Corner Crosshairs */}
                  <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-sky-300" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-sky-300" />
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-sky-300" />
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-sky-300" />

                  {/* Component Badge on Box */}
                  {(showLabels || isSelected || isHovered) && (
                    <div
                      className={`absolute -top-6 left-0 whitespace-nowrap px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight shadow-md flex items-center gap-1 pointer-events-none transition-transform ${
                        isSelected
                          ? "bg-[#0284C7] text-white ring-1 ring-sky-300 z-40 scale-105"
                          : isHovered
                          ? "bg-[#16A34A] text-white z-30"
                          : "bg-slate-900/90 text-sky-200 border border-sky-500/30"
                      }`}
                    >
                      <Crosshair className="w-2.5 h-2.5" />
                      <span>{comp.name}</span>
                      <span className="opacity-80">({comp.health}%)</span>
                    </div>
                  )}

                  {/* Pulsing Target Dot when selected */}
                  {isSelected && (
                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="w-3 h-3 rounded-full bg-sky-400 animate-ping opacity-75" />
                      <span className="w-2 h-2 rounded-full bg-white" />
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="px-3 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-300 flex items-center gap-3">
          <span>Click box to inspect</span>
          <span className="text-slate-500">·</span>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">Dust Index: <strong className="text-slate-200">{conditionMeta.dustIndex}</strong></span>
        </div>

        {selectedComponent ? (
          <div className="px-3 py-1 rounded-xl bg-[#0F172A]/90 backdrop-blur-md border border-[#38BDF8]/40 text-[11px] font-mono text-[#38BDF8] flex items-center gap-1.5 shadow-md">
            <Crosshair className="w-3 h-3 text-[#38BDF8]" />
            <span>Target: <strong>{selectedComponent.name}</strong> ({selectedComponent.package})</span>
          </div>
        ) : (
          <div className="px-3 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-300 hidden md:flex items-center gap-1.5">
            <span className="text-emerald-400">Action:</span>
            <span>{conditionMeta.recommendation}</span>
          </div>
        )}
      </div>
    </div>
  );
}
