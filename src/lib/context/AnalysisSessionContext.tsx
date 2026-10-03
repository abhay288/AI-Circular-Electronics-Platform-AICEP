"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { SAMPLE_DATASETS } from "@/lib/data/sampleDatasets";
import {
  AnalysisSession,
  AnalysisStatus,
  DetectedComponent,
  DataClassification,
} from "@/lib/types/analysis";
import {
  analysisService,
  defaultRouterSession,
  convertSampleToSession,
} from "@/lib/services/analysisService";

interface AnalysisContextType {
  session: AnalysisSession;
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
  const [activeStep, setActiveStep] = useState<number>(3);
  const [resultsTab, setResultsTab] = useState<string>("overview");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [liveDetections, setLiveDetections] = useState<DetectedComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<DetectedComponent | null>(
    defaultRouterSession.detection.components[0] || null
  );
  const [isMarketplaceModalOpen, setIsMarketplaceModalOpen] = useState<boolean>(false);
  const [marketplaceComponent, setMarketplaceComponent] = useState<DetectedComponent | null>(null);

  // Initialize from URL search param or localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const queryId = urlParams.get("analysisId") || urlParams.get("sessionId");

        if (queryId) {
          analysisService.getSession(queryId).then((sess) => {
            if (sess) {
              setSession(sess);
              if (sess.detection?.components?.length > 0) {
                setSelectedComponent(sess.detection.components[0]);
              }
            }
          });
          return;
        }

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.id || parsed.sessionId)) {
            // Normalize session structure if needed
            const normalizedSession: AnalysisSession = {
              ...defaultRouterSession,
              ...parsed,
              id: parsed.id || parsed.sessionId,
              sessionId: parsed.id || parsed.sessionId,
              detection: parsed.detection || parsed.detectionResult || defaultRouterSession.detection,
              pcbAnalysis: parsed.pcbAnalysis || parsed.reconstructionResult || defaultRouterSession.pcbAnalysis,
              rulPrediction: parsed.rulPrediction || parsed.rulResult || defaultRouterSession.rulPrediction,
              materialRecovery: parsed.materialRecovery || parsed.metalResult || defaultRouterSession.materialRecovery,
              repairAssessment: parsed.repairAssessment || parsed.repairResult || defaultRouterSession.repairAssessment,
              passport: parsed.passport || parsed.passportResult || defaultRouterSession.passport,
              carbonImpact: parsed.carbonImpact || parsed.carbonResult || defaultRouterSession.carbonImpact,
              report: parsed.report || { reportId: `REP-${parsed.id || parsed.sessionId}`, isReady: true, generatedAt: new Date().toISOString(), version: "2.4.0" },
              executiveSummary: parsed.executiveSummary || defaultRouterSession.executiveSummary,
            };
            setSession(normalizedSession);
            if (normalizedSession.detection?.components?.length > 0) {
              setSelectedComponent(normalizedSession.detection.components[0]);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Could not restore stored session:", e);
    }
  }, []);

  const persistSession = (newSession: AnalysisSession) => {
    setSession(newSession);
    analysisService.saveSession(newSession);
  };

  const loadSessionById = async (sessionId: string) => {
    const fetched = await analysisService.getSession(sessionId);
    if (fetched) {
      setSession(fetched);
      if (fetched.detection?.components?.length > 0) {
        setSelectedComponent(fetched.detection.components[0]);
      }
    }
  };

  const loadSample = (sampleId: string) => {
    const dataset = SAMPLE_DATASETS[sampleId] || SAMPLE_DATASETS["router-board"] || SAMPLE_DATASETS["laptop-motherboard"];
    const newSession = convertSampleToSession(dataset, "COMPLETED");
    setSelectedComponent(newSession.detection.components[0] || null);
    persistSession(newSession);
  };

  const setImageUpload = (
    previewUrl: string,
    name: string,
    sizeBytes: number,
    dims = "3024 x 4032 px"
  ) => {
    const routerSample = SAMPLE_DATASETS["router-board"] || SAMPLE_DATASETS["laptop-motherboard"];
    const id = `ECI-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const baseSession = convertSampleToSession(routerSample, "CAPTURED", id);

    const newSession: AnalysisSession = {
      ...baseSession,
      id,
      sessionId: id,
      deviceName: name.replace(/\.[^/.]+$/, ""),
      deviceType: "Electronic Circuit Assembly (PCB)",
      sourceType: "upload",
      imageUrl: previewUrl,
      image: previewUrl,
      dataClassification: "detected",
      status: "CAPTURED",
      imageQuality: {
        quality: "good",
        resolution: dims,
        lightingScore: 94,
        visibilityPercent: 92,
        estimatedComponentsVisible: 38,
      },
      report: {
        ...baseSession.report,
        reportId: `REP-UPL-${Date.now()}`,
        isReady: false,
      },
      reportId: `REP-UPL-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };

    persistSession(newSession);
    setSelectedComponent(newSession.detection.components[0] || null);
  };

  const setCameraCapture = (dataUrl: string, qualityInfo?: any) => {
    const routerSample = SAMPLE_DATASETS["router-board"] || SAMPLE_DATASETS["laptop-motherboard"];
    const id = `ECI-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const baseSession = convertSampleToSession(routerSample, "CAPTURED", id);

    const newSession: AnalysisSession = {
      ...baseSession,
      id,
      sessionId: id,
      deviceName: "Realtime Optical Camera Ingest",
      deviceType: "High-Resolution PCB Scan",
      sourceType: "camera",
      imageUrl: dataUrl,
      image: dataUrl,
      dataClassification: "measured",
      status: "CAPTURED",
      imageQuality: qualityInfo || {
        quality: "good",
        resolution: "1920 x 1080 px",
        lightingScore: 92,
        visibilityPercent: 94,
        estimatedComponentsVisible: 38,
      },
      report: {
        ...baseSession.report,
        reportId: `REP-CAM-${Date.now()}`,
        isReady: false,
      },
      reportId: `REP-CAM-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };

    persistSession(newSession);
    setSelectedComponent(newSession.detection.components[0] || null);
  };

  const runAnalysis = async (onStepProgress?: (step: number) => void) => {
    setIsAnalyzing(true);
    setPipelineStep(0);
    setLiveDetections([]);

    // Update status to PROCESSING
    const processingSession: AnalysisSession = {
      ...session,
      status: "PROCESSING",
      updatedAt: new Date().toISOString(),
    };
    persistSession(processingSession);

    const steps: Array<{ name: string; status: AnalysisStatus }> = [
      { name: "Image Acquisition & Calibration", status: "PROCESSING" },
      { name: "Spectro-Spatial AI Detection (YOLOv11)", status: "DETECTION_COMPLETE" },
      { name: "PCB Topology & Trace Reconstruction", status: "PCB_ANALYSIS_COMPLETE" },
      { name: "Physics-Informed Health Assessment", status: "RUL_COMPLETE" },
      { name: "Remaining Useful Life (RUL) Modeling", status: "RUL_COMPLETE" },
      { name: "Precious Material Recovery Estimation", status: "MATERIAL_ANALYSIS_COMPLETE" },
      { name: "Automated Diagnostic & Repair Mapping", status: "REPAIR_COMPLETE" },
      { name: "Digital Product Passport Synthesis", status: "PASSPORT_READY" },
      { name: "Life-Cycle ESG & Carbon Accounting", status: "REPORT_READY" },
    ];

    const allComponents = session.detection?.components || defaultRouterSession.detection.components;

    for (let i = 0; i < steps.length; i++) {
      setPipelineStep(i + 1);
      if (onStepProgress) onStepProgress(i + 1);

      // Stream live detection cards during detection step
      if (i === 1) {
        for (let c = 0; c < allComponents.length; c++) {
          await new Promise((res) => setTimeout(res, 280));
          setLiveDetections((prev) => [...prev, allComponents[c]]);
        }
      } else {
        await new Promise((res) => setTimeout(res, 450));
      }
    }

    // Complete session with COMPLETED status
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

    const predictedHours = Math.round(baseHours * tempFactor * voltageFactor * cyclesFactor * ageFactor * wearFactor);
    const predictedYears = +(predictedHours / 8760).toFixed(1);
    const healthScore = Math.min(100, Math.max(15, Math.round((predictedHours / baseHours) * 98)));

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
    persistSession(defaultRouterSession);
    setActiveStep(1);
    setResultsTab("overview");
    setSelectedComponent(defaultRouterSession.detection.components[0] || null);
  };

  const openMarketplaceListing = (component?: DetectedComponent | null) => {
    setMarketplaceComponent(component || selectedComponent || session.detection.components[0] || null);
    setIsMarketplaceModalOpen(true);
  };

  return (
    <AnalysisContext.Provider
      value={{
        session,
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
  activeStep: 3,
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
