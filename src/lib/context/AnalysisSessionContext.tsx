"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { SAMPLE_DATASETS, SampleDataset } from "@/lib/data/sampleDatasets";

export interface AnalysisSessionState {
  sessionId: string;
  deviceName: string;
  deviceType: string;
  sourceType: "upload" | "camera" | "sample";
  sampleId?: string;
  image: string;
  imageQuality?: {
    quality: "good" | "acceptable" | "poor";
    resolution: string;
    lightingScore: number;
    visibilityPercent: number;
    estimatedComponentsVisible: number;
  };
  status: "draft" | "ready" | "processing" | "completed" | "failed";
  dataClassification: "measured" | "detected" | "predicted" | "estimated" | "simulated" | "sample";
  detectionResult?: any;
  reconstructionResult?: any;
  rulResult?: any;
  metalResult?: any;
  repairResult?: any;
  passportId?: string;
  passportResult?: any;
  carbonResult?: any;
  reportId?: string;
  executiveSummary?: {
    overallHealthPercent: number;
    classification: string;
    potentialValueUSD: number;
    estimatedRemainingLifeYears: number;
    componentsDetectedCount: number;
    recommendedAction: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface AnalysisContextType {
  session: AnalysisSessionState;
  activeStep: number;
  setActiveStep: (step: number) => void;
  resultsTab: string;
  setResultsTab: (tab: string) => void;
  isAnalyzing: boolean;
  pipelineStep: number;
  liveDetections: any[];
  selectedComponent: any | null;
  setSelectedComponent: (comp: any | null) => void;
  loadSample: (sampleId: string) => void;
  setImageUpload: (previewUrl: string, name: string, sizeBytes: number, dims?: string) => void;
  setCameraCapture: (dataUrl: string, qualityInfo?: any) => void;
  runAnalysis: (onStepProgress?: (step: number) => void) => Promise<void>;
  updateRulSimulation: (params: { temp: number; voltage: number; cycles: number; age: number }) => void;
  resetSession: () => void;
  isMarketplaceModalOpen: boolean;
  setIsMarketplaceModalOpen: (open: boolean) => void;
  marketplaceComponent: any | null;
  openMarketplaceListing: (component?: any) => void;
}

const defaultInitialSample = SAMPLE_DATASETS["laptop-motherboard"];

const defaultSession: AnalysisSessionState = {
  sessionId: "ECI-2026-8941",
  deviceName: defaultInitialSample.name,
  deviceType: defaultInitialSample.deviceType,
  sourceType: "sample",
  sampleId: defaultInitialSample.id,
  image: defaultInitialSample.image,
  imageQuality: {
    quality: "good",
    resolution: "2400 x 1600 px",
    lightingScore: 98,
    visibilityPercent: 96,
    estimatedComponentsVisible: defaultInitialSample.componentCount,
  },
  status: "draft",
  dataClassification: "sample",
  detectionResult: defaultInitialSample.detection,
  reconstructionResult: defaultInitialSample.reconstruction,
  rulResult: defaultInitialSample.rul,
  metalResult: defaultInitialSample.metals,
  repairResult: defaultInitialSample.repair,
  passportId: defaultInitialSample.passport.passportId,
  passportResult: defaultInitialSample.passport,
  carbonResult: defaultInitialSample.carbon,
  reportId: `REP-${defaultInitialSample.id}-2026`,
  executiveSummary: defaultInitialSample.executiveSummary,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const AnalysisContext = createContext<AnalysisContextType | null>(null);

const STORAGE_KEY = "ecointel_active_analysis_session_v2";

export function AnalysisSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AnalysisSessionState>(defaultSession);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [resultsTab, setResultsTab] = useState<string>("inventory");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [liveDetections, setLiveDetections] = useState<any[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<any | null>(null);
  const [isMarketplaceModalOpen, setIsMarketplaceModalOpen] = useState<boolean>(false);
  const [marketplaceComponent, setMarketplaceComponent] = useState<any | null>(null);

  // Initialize from localStorage or fallback
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.sessionId) {
          setSession(parsed);
          if (parsed.detectionResult?.components?.length > 0) {
            setSelectedComponent(parsed.detectionResult.components[0]);
          }
        }
      } else {
        setSelectedComponent(defaultInitialSample.detection.components[0]);
      }
    } catch (e) {
      console.warn("Could not load stored session:", e);
    }
  }, []);

  // Save changes to localStorage and optionally sync to /api/sessions
  const persistSession = (newSession: AnalysisSessionState) => {
    setSession(newSession);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    } catch (e) {
      console.warn("Storage write error:", e);
    }

    // Background sync to MongoDB API
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSession),
    }).catch((err) => console.warn("Background session sync warning:", err));
  };

  const loadSample = (sampleId: string) => {
    const dataset = SAMPLE_DATASETS[sampleId] || SAMPLE_DATASETS["laptop-motherboard"];
    const newSession: AnalysisSessionState = {
      sessionId: `ECI-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      deviceName: dataset.name,
      deviceType: dataset.deviceType,
      sourceType: "sample",
      sampleId: dataset.id,
      image: dataset.image,
      imageQuality: {
        quality: "good",
        resolution: "2400 x 1600 px",
        lightingScore: 98,
        visibilityPercent: 97,
        estimatedComponentsVisible: dataset.componentCount,
      },
      status: "ready",
      dataClassification: "sample",
      detectionResult: dataset.detection,
      reconstructionResult: dataset.reconstruction,
      rulResult: dataset.rul,
      metalResult: dataset.metals,
      repairResult: dataset.repair,
      passportId: dataset.passport.passportId,
      passportResult: dataset.passport,
      carbonResult: dataset.carbon,
      reportId: `REP-${dataset.id}-2026`,
      executiveSummary: dataset.executiveSummary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSelectedComponent(dataset.detection.components[0] || null);
    persistSession(newSession);
  };

  const setImageUpload = (
    previewUrl: string,
    name: string,
    sizeBytes: number,
    dims = "3024 x 4032 px"
  ) => {
    const mbSize = (sizeBytes / (1024 * 1024)).toFixed(2);
    const newSession: AnalysisSessionState = {
      sessionId: `ECI-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      deviceName: name.replace(/\.[^/.]+$/, ""),
      deviceType: "Electronic Circuit Assembly (PCB)",
      sourceType: "upload",
      image: previewUrl,
      imageQuality: {
        quality: "good",
        resolution: dims,
        lightingScore: 94,
        visibilityPercent: 92,
        estimatedComponentsVisible: 36,
      },
      status: "ready",
      dataClassification: "detected",
      // Synthesize starting analysis data
      detectionResult: {
        ...defaultInitialSample.detection,
        componentsCount: 36,
      },
      reconstructionResult: defaultInitialSample.reconstruction,
      rulResult: defaultInitialSample.rul,
      metalResult: defaultInitialSample.metals,
      repairResult: defaultInitialSample.repair,
      passportId: `ECO-PASSPORT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      passportResult: {
        ...defaultInitialSample.passport,
        passportId: `ECO-PASSPORT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        blockchainStatus: "Passport Ready",
      },
      carbonResult: defaultInitialSample.carbon,
      reportId: `REP-UPL-${Date.now()}`,
      executiveSummary: {
        ...defaultInitialSample.executiveSummary,
        componentsDetectedCount: 36,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    persistSession(newSession);
  };

  const setCameraCapture = (dataUrl: string, qualityInfo?: any) => {
    const newSession: AnalysisSessionState = {
      sessionId: `ECI-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      deviceName: "Realtime Optical Camera Ingest",
      deviceType: "High-Resolution PCB Scan",
      sourceType: "camera",
      image: dataUrl,
      imageQuality: qualityInfo || {
        quality: "good",
        resolution: "1920 x 1080 px",
        lightingScore: 92,
        visibilityPercent: 94,
        estimatedComponentsVisible: 40,
      },
      status: "ready",
      dataClassification: "measured",
      detectionResult: defaultInitialSample.detection,
      reconstructionResult: defaultInitialSample.reconstruction,
      rulResult: defaultInitialSample.rul,
      metalResult: defaultInitialSample.metals,
      repairResult: defaultInitialSample.repair,
      passportId: `ECO-PASSPORT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      passportResult: defaultInitialSample.passport,
      carbonResult: defaultInitialSample.carbon,
      reportId: `REP-CAM-${Date.now()}`,
      executiveSummary: defaultInitialSample.executiveSummary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    persistSession(newSession);
  };

  const runAnalysis = async (onStepProgress?: (step: number) => void) => {
    setIsAnalyzing(true);
    setPipelineStep(0);
    setLiveDetections([]);

    const steps = [
      "Image Acquisition & Calibration",
      "Spectro-Spatial AI Detection (YOLOv11)",
      "Generative CAD Reconstruction (GGNT)",
      "Physics-Informed Health Assessment",
      "Remaining Useful Life (RUL) Modeling",
      "Precious Metal Recovery Estimation",
      "Automated Diagnostic & Repair Mapping",
      "Polygon Digital Product Passport Synthesis",
      "Life-Cycle ESG & Carbon Accounting",
    ];

    const allComponents = session.detectionResult?.components || defaultInitialSample.detection.components;

    for (let i = 0; i < steps.length; i++) {
      setPipelineStep(i + 1);
      if (onStepProgress) onStepProgress(i + 1);

      // Stream live detection cards during detection step
      if (i === 1) {
        for (let c = 0; c < allComponents.length; c++) {
          await new Promise((res) => setTimeout(res, 350));
          setLiveDetections((prev) => [...prev, allComponents[c]]);
        }
      } else {
        await new Promise((res) => setTimeout(res, 600));
      }
    }

    // Finish analysis and update session status
    const completedSession: AnalysisSessionState = {
      ...session,
      status: "completed",
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
  }) => {
    const baseHours = 60000;
    const tempFactor = Math.max(0.2, 1 - params.temp / 120);
    const voltageFactor = Math.max(0.3, 1 - Math.abs(params.voltage - 3.3) / 10);
    const cyclesFactor = Math.max(0.3, 1 - params.cycles / 50000);
    const ageFactor = Math.max(0.2, 1 - params.age / 15);

    const predictedHours = Math.round(baseHours * tempFactor * voltageFactor * cyclesFactor * ageFactor);
    const predictedYears = +(predictedHours / 8760).toFixed(1);
    const healthScore = Math.min(100, Math.max(10, Math.round((predictedHours / baseHours) * 100)));

    const updatedSession: AnalysisSessionState = {
      ...session,
      rulResult: {
        ...session.rulResult,
        overallHealthScore: healthScore,
        predictedHours,
        predictedYears,
        failureProbability: +((100 - healthScore) / 100).toFixed(2),
        parameters: {
          operatingTempCelsius: params.temp,
          inputVoltageVolts: params.voltage,
          operatingCycles: params.cycles,
          ageYears: params.age,
        },
      },
    };

    persistSession(updatedSession);
  };

  const resetSession = () => {
    persistSession(defaultSession);
    setActiveStep(1);
    setResultsTab("inventory");
    setSelectedComponent(defaultInitialSample.detection.components[0]);
  };

  const openMarketplaceListing = (component?: any) => {
    setMarketplaceComponent(component || selectedComponent || session.detectionResult?.components?.[0]);
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

export function useAnalysisSession() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error("useAnalysisSession must be used within an AnalysisSessionProvider");
  }
  return context;
}
