"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { SAMPLE_DATASETS } from "@/lib/data/sampleDatasets";
import {
  AnalysisSession,
  AnalysisStatus,
  DetectedComponent,
  IngestDraft,
  RecentSessionMeta,
} from "@/lib/types/analysis";
import {
  analysisService,
  defaultRouterSession,
  convertSampleToSession,
} from "@/lib/services/analysisService";

interface AnalysisContextType {
  session: AnalysisSession;
  isNewAnalysis: boolean;
  selectedDraft: IngestDraft | null;
  selectSampleDraft: (sampleId: string) => void;
  setUploadDraft: (previewUrl: string, name: string, sizeBytes: number, dims?: string) => void;
  setCameraDraft: (dataUrl: string, qualityInfo?: any) => void;
  clearDraft: () => void;
  startAnalysisFromDraft: () => Promise<string>;
  recentSessions: RecentSessionMeta[];
  refreshRecentSessions: () => void;
  resetToNewAnalysis: () => void;

  activeStep: number;
  setActiveStep: (step: number) => void;
  resultsTab: string;
  setResultsTab: (tab: string) => void;
  isAnalyzing: boolean;
  pipelineStep: number;
  liveDetections: DetectedComponent[];
  selectedComponent: DetectedComponent | null;
  setSelectedComponent: (comp: DetectedComponent | null) => void;
  loadSample: (sampleId: string) => void;
  loadSessionById: (sessionId: string) => Promise<void>;
  setImageUpload: (previewUrl: string, name: string, sizeBytes: number, dims?: string) => void;
  setCameraCapture: (dataUrl: string, qualityInfo?: any) => void;
  runAnalysis: (onStepProgress?: (step: number) => void) => Promise<void>;
  updateRulSimulation: (params: { temp: number; voltage: number; cycles: number; age: number; wear?: number }) => void;
  resetSession: () => void;
  isMarketplaceModalOpen: boolean;
  setIsMarketplaceModalOpen: (open: boolean) => void;
  marketplaceComponent: DetectedComponent | null;
  openMarketplaceListing: (component?: DetectedComponent | null) => void;
}

const AnalysisContext = createContext<AnalysisContextType | null>(null);

const STORAGE_KEY = "ecointel_active_analysis_session_v2";

export function AnalysisSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AnalysisSession>(defaultRouterSession);
  const [isNewAnalysis, setIsNewAnalysis] = useState<boolean>(true);
  const [selectedDraft, setSelectedDraft] = useState<IngestDraft | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSessionMeta[]>([]);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [resultsTab, setResultsTab] = useState<string>("overview");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [liveDetections, setLiveDetections] = useState<DetectedComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<DetectedComponent | null>(
    defaultRouterSession.detection.components[0] || null
  );
  const [isMarketplaceModalOpen, setIsMarketplaceModalOpen] = useState<boolean>(false);
  const [marketplaceComponent, setMarketplaceComponent] = useState<DetectedComponent | null>(null);

  const refreshRecentSessions = useCallback(() => {
    const list = analysisService.getRecentSessions();
    setRecentSessions(list);
  }, []);

  // Initialize from URL search param or route state
  useEffect(() => {
    refreshRecentSessions();

    try {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const queryId = urlParams.get("analysisId") || urlParams.get("sessionId");
        const pathname = window.location.pathname;

        // If on the root capture page without a queryId, ensure NEW ANALYSIS state
        if (pathname === "/console" && !queryId) {
          setIsNewAnalysis(true);
          setActiveStep(1);
          return;
        }

        if (queryId) {
          setIsNewAnalysis(false);
          analysisService.getSession(queryId).then((sess) => {
            if (sess) {
              setSession(sess);
              if (sess.detection?.components?.length > 0) {
                setSelectedComponent(sess.detection.components[0]);
              }
              if (pathname.includes("processing")) {
                setActiveStep(2);
              } else if (pathname.includes("results")) {
                setActiveStep(3);
              } else if (pathname.includes("passport")) {
                setActiveStep(7);
              } else if (pathname.includes("report")) {
                setActiveStep(8);
              }
            }
          });
          return;
        }

        // Only restore previous session if navigating directly to results/report/passport without param
        if (
          pathname.includes("results") ||
          pathname.includes("processing") ||
          pathname.includes("passport") ||
          pathname.includes("report")
        ) {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && (parsed.id || parsed.sessionId)) {
              setSession(parsed);
              setIsNewAnalysis(false);
              if (parsed.detection?.components?.length > 0) {
                setSelectedComponent(parsed.detection.components[0]);
              }
            }
          }
        } else {
          // Default for /console is fresh new analysis
          setIsNewAnalysis(true);
          setActiveStep(1);
        }
      }
    } catch (e) {
      console.warn("Could not restore stored session:", e);
    }
  }, [refreshRecentSessions]);

  const persistSession = (newSession: AnalysisSession) => {
    setSession(newSession);
    analysisService.saveSession(newSession);
    refreshRecentSessions();
  };

  const loadSessionById = async (sessionId: string) => {
    const fetched = await analysisService.getSession(sessionId);
    if (fetched) {
      setSession(fetched);
      setIsNewAnalysis(false);
      if (fetched.detection?.components?.length > 0) {
        setSelectedComponent(fetched.detection.components[0]);
      }
      refreshRecentSessions();
    }
  };

  const selectSampleDraft = (sampleId: string) => {
    const dataset =
      SAMPLE_DATASETS[sampleId] ||
      SAMPLE_DATASETS["router-board"] ||
      SAMPLE_DATASETS["laptop-motherboard"];

    const draft: IngestDraft = {
      sourceType: "sample",
      sampleId: dataset.id,
      deviceName: dataset.name,
      deviceType: dataset.deviceType,
      datasetName: "EcoIntel Demonstration Dataset",
      imageUrl: dataset.image,
      imageQuality: {
        quality: "good",
        resolution: dataset.hardwareSpecs?.dimensions || "3840 x 2160 px",
        lightingScore: 98,
        visibilityPercent: 96,
        estimatedComponentsVisible: dataset.componentCount,
      },
      status: "Ready for Analysis",
    };

    setSelectedDraft(draft);
    setIsNewAnalysis(true);
  };

  const setUploadDraft = (
    previewUrl: string,
    name: string,
    sizeBytes: number,
    dims = "3024 x 4032 px"
  ) => {
    const cleanName = name.replace(/\.[^/.]+$/, "");
    const draft: IngestDraft = {
      sourceType: "upload",
      deviceName: cleanName || "Uploaded Electronic PCB",
      deviceType: "Electronic Circuit Assembly (PCB)",
      datasetName: "Optical Hardware Ingest",
      imageUrl: previewUrl,
      fileName: name,
      fileSizeBytes: sizeBytes,
      imageQuality: {
        quality: "good",
        resolution: dims,
        lightingScore: 94,
        visibilityPercent: 92,
        estimatedComponentsVisible: 38,
      },
      status: "Ready for Analysis",
    };

    setSelectedDraft(draft);
    setIsNewAnalysis(true);
  };

  const setCameraDraft = (dataUrl: string, qualityInfo?: any) => {
    const draft: IngestDraft = {
      sourceType: "camera",
      deviceName: "Realtime Optical Camera Ingest",
      deviceType: "High-Resolution PCB Scan",
      datasetName: "Live Optical Telemetry Ingest",
      imageUrl: dataUrl,
      imageQuality: qualityInfo || {
        quality: "good",
        resolution: "1920 x 1080 px",
        lightingScore: 92,
        visibilityPercent: 94,
        estimatedComponentsVisible: 40,
      },
      status: "Ready for Analysis",
    };

    setSelectedDraft(draft);
    setIsNewAnalysis(true);
  };

  const clearDraft = () => {
    setSelectedDraft(null);
  };

  const startAnalysisFromDraft = async (): Promise<string> => {
    const currentDraft =
      selectedDraft || {
        sourceType: "sample" as const,
        sampleId: "router-board",
        deviceName: "Router Board",
        deviceType: "Networking Controller",
        datasetName: "EcoIntel Demonstration Dataset",
        imageUrl: "/images/samples/router_board.jpg",
        imageQuality: {
          quality: "good" as const,
          resolution: "2400 x 1600 px",
          lightingScore: 98,
          visibilityPercent: 96,
          estimatedComponentsVisible: 38,
        },
        status: "Ready for Analysis" as const,
      };

    const newSession = analysisService.createSessionFromDraft(currentDraft);
    persistSession(newSession);
    setIsNewAnalysis(false);
    setSelectedDraft(null);
    return newSession.id;
  };

  const resetToNewAnalysis = () => {
    setIsNewAnalysis(true);
    setSelectedDraft(null);
    setActiveStep(1);
    setResultsTab("overview");
  };

  const loadSample = (sampleId: string) => {
    const dataset =
      SAMPLE_DATASETS[sampleId] ||
      SAMPLE_DATASETS["router-board"] ||
      SAMPLE_DATASETS["laptop-motherboard"];
    const newSession = convertSampleToSession(dataset, "COMPLETED");
    setSelectedComponent(newSession.detection.components[0] || null);
    setIsNewAnalysis(false);
    persistSession(newSession);
  };

  const setImageUpload = (
    previewUrl: string,
    name: string,
    sizeBytes: number,
    dims = "3024 x 4032 px"
  ) => {
    setUploadDraft(previewUrl, name, sizeBytes, dims);
  };

  const setCameraCapture = (dataUrl: string, qualityInfo?: any) => {
    setCameraDraft(dataUrl, qualityInfo);
  };

  const runAnalysis = async (onStepProgress?: (step: number) => void) => {
    setIsAnalyzing(true);
    setPipelineStep(0);
    setLiveDetections([]);

    const processingSession: AnalysisSession = {
      ...session,
      status: "PROCESSING",
      updatedAt: new Date().toISOString(),
    };
    persistSession(processingSession);

    const steps: Array<{ name: string; status: AnalysisStatus }> = [
      { name: "Image Acquisition & Optical Calibration", status: "PROCESSING" },
      { name: "Component Detection (YOLOv11 Spectro-Spatial)", status: "DETECTION_COMPLETE" },
      { name: "PCB Topology & Trace Reconstruction", status: "PCB_ANALYSIS_COMPLETE" },
      { name: "Physics-Informed Health Assessment", status: "RUL_COMPLETE" },
      { name: "Remaining Useful Life (RUL) Modeling", status: "RUL_COMPLETE" },
      { name: "Precious Material Recovery Estimation", status: "MATERIAL_ANALYSIS_COMPLETE" },
      { name: "AI Repair & Refurbishment Intelligence", status: "REPAIR_COMPLETE" },
      { name: "Digital Product Passport Synthesis", status: "PASSPORT_READY" },
      { name: "Life-Cycle ESG & Carbon Accounting", status: "REPORT_READY" },
    ];

    const allComponents = session.detection?.components || defaultRouterSession.detection.components;

    for (let i = 0; i < steps.length; i++) {
      setPipelineStep(i + 1);
      if (onStepProgress) onStepProgress(i + 1);

      if (i === 1) {
        // Stream components progressive discovery
        const stepComponents = allComponents.slice(0, 8);
        for (let c = 0; c < stepComponents.length; c++) {
          await new Promise((res) => setTimeout(res, 220));
          setLiveDetections((prev) => [...prev, stepComponents[c]]);
        }
      } else {
        await new Promise((res) => setTimeout(res, 400));
      }
    }

    const completedSession: AnalysisSession = {
      ...session,
      status: "COMPLETED",
      report: {
        ...session.report,
        isReady: true,
        generatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    persistSession(completedSession);
    setIsAnalyzing(false);
  };

  const updateRulSimulation = (params: {
    temp: number;
    voltage: number;
    cycles: number;
    age: number;
    wear?: number;
  }) => {
    const baseHours = 68000;
    const tempFactor = Math.max(0.2, 1 - (params.temp - 25) / 100);
    const voltageFactor = Math.max(0.3, 1 - Math.abs(params.voltage - 12.0) / 20);
    const cyclesFactor = Math.max(0.3, 1 - params.cycles / 40000);
    const ageFactor = Math.max(0.2, 1 - params.age / 12);
    const wearFactor = params.wear ? Math.max(0.3, 1 - params.wear / 100) : 0.92;

    const predictedHours = Math.round(
      baseHours * tempFactor * voltageFactor * cyclesFactor * ageFactor * wearFactor
    );
    const predictedYears = +(predictedHours / 8760).toFixed(1);
    const healthScore = Math.min(
      100,
      Math.max(15, Math.round((predictedHours / baseHours) * 98))
    );

    const updatedSession: AnalysisSession = {
      ...session,
      rulPrediction: {
        ...session.rulPrediction,
        overallHealthScore: healthScore,
        predictedHours,
        predictedYears,
        failureProbability: +((100 - healthScore) / 100).toFixed(2),
        parameters: {
          operatingTempCelsius: params.temp,
          inputVoltageVolts: params.voltage,
          operatingCycles: params.cycles,
          ageYears: params.age,
          wearFactor: params.wear || 12,
        },
      },
      rulResult: {
        ...session.rulPrediction,
        overallHealthScore: healthScore,
        predictedHours,
        predictedYears,
        failureProbability: +((100 - healthScore) / 100).toFixed(2),
        parameters: {
          operatingTempCelsius: params.temp,
          inputVoltageVolts: params.voltage,
          operatingCycles: params.cycles,
          ageYears: params.age,
          wearFactor: params.wear || 12,
        },
      },
      executiveSummary: {
        ...session.executiveSummary,
        overallHealthPercent: healthScore,
        estimatedRemainingLifeYears: predictedYears,
      },
      updatedAt: new Date().toISOString(),
    };

    persistSession(updatedSession);
  };

  const resetSession = () => {
    resetToNewAnalysis();
  };

  const openMarketplaceListing = (component?: DetectedComponent | null) => {
    setMarketplaceComponent(
      component || selectedComponent || session.detection?.components[0] || null
    );
    setIsMarketplaceModalOpen(true);
  };

  return (
    <AnalysisContext.Provider
      value={{
        session,
        isNewAnalysis,
        selectedDraft,
        selectSampleDraft,
        setUploadDraft,
        setCameraDraft,
        clearDraft,
        startAnalysisFromDraft,
        recentSessions,
        refreshRecentSessions,
        resetToNewAnalysis,
        activeStep,
        setActiveStep,
        resultsTab,
        setResultsTab,
        isAnalyzing,
        pipelineStep,
        liveDetections,
        selectedComponent,
        setSelectedComponent,
        loadSample,
        loadSessionById,
        setImageUpload,
        setCameraCapture,
        runAnalysis,
        updateRulSimulation,
        resetSession,
        isMarketplaceModalOpen,
        setIsMarketplaceModalOpen,
        marketplaceComponent,
        openMarketplaceListing,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

const defaultFallbackContext: AnalysisContextType = {
  session: defaultRouterSession,
  isNewAnalysis: true,
  selectedDraft: null,
  selectSampleDraft: () => {},
  setUploadDraft: () => {},
  setCameraDraft: () => {},
  clearDraft: () => {},
  startAnalysisFromDraft: async () => "ECI-2026-7740",
  recentSessions: [],
  refreshRecentSessions: () => {},
  resetToNewAnalysis: () => {},
  activeStep: 1,
  setActiveStep: () => {},
  resultsTab: "overview",
  setResultsTab: () => {},
  isAnalyzing: false,
  pipelineStep: 0,
  liveDetections: [],
  selectedComponent: defaultRouterSession.detection.components[0] || null,
  setSelectedComponent: () => {},
  loadSample: () => {},
  loadSessionById: async () => {},
  setImageUpload: () => {},
  setCameraCapture: () => {},
  runAnalysis: async () => {},
  updateRulSimulation: () => {},
  resetSession: () => {},
  isMarketplaceModalOpen: false,
  setIsMarketplaceModalOpen: () => {},
  marketplaceComponent: null,
  openMarketplaceListing: () => {},
};

export function useAnalysisSession() {
  const context = useContext(AnalysisContext);
  if (!context) {
    return defaultFallbackContext;
  }
  return context;
}
