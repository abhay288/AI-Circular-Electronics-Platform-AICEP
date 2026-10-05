import { SAMPLE_DATASETS } from "@/lib/data/sampleDatasets";
import { IRULPrediction, IHealthFactor, IFailureMode, IComponentRUL } from "@/models/RULPrediction";

export interface RULInput {
  analysisId: string;
  sampleId?: string;
  componentId?: string;
  componentType?: string;
  manufacturer?: string;
  partNumber?: string;
  packageType?: string;

  visualHealthScore?: number;
  visualDamageSeverity?: number;
  corrosionScore?: number;
  thermalDamageScore?: number;
  physicalDamageScore?: number;
  traceDamageScore?: number;

  componentAgeYears?: number;
  operatingHours?: number;
  operatingCycles?: number;
  temperatureC?: number;
  voltageV?: number;
  currentA?: number;
  loadPercentage?: number;
  environmentalStress?: number;
  maintenanceCount?: number;
  historicalFailureCount?: number;

  pcbIntegrityScore?: number;
  topologyRiskScore?: number;
  components?: Array<{
    componentId: string;
    componentType: string;
    manufacturer?: string;
    partNumber?: string;
    packageType?: string;
    visualDamageSeverity?: string;
    hasCorrosion?: boolean;
    hasThermalDamage?: boolean;
    connectedTracesCount?: number;
  }>;

  isScenarioSimulation?: boolean;
  additionalFeatures?: Record<string, number>;
}

export type RULOutput = Partial<IRULPrediction> & {
  analysisId: string;
  healthScore: number;
  healthStatus: "HEALTHY" | "GOOD" | "FAIR" | "DEGRADED" | "CRITICAL" | "UNKNOWN";
  healthConfidence: number;
  rulHours: number;
  rulYears: number;
  confidence: number;
  modelProvider: "MOCK" | "XGBOOST" | "LSTM" | "PHYSICS_ML";
  status: "COMPLETED" | "PARTIAL" | "INSUFFICIENT_DATA" | "FAILED";
};

export interface RULProvider {
  predict(input: RULInput): Promise<RULOutput>;
  getModelInfo(): Promise<any>;
}

export class MockRULProvider implements RULProvider {
  async predict(input: RULInput): Promise<RULOutput> {
    const sample = (input.sampleId && SAMPLE_DATASETS[input.sampleId]) || SAMPLE_DATASETS["router-board"];
    const r = sample.rul;

    // Evaluate input scenario parameters or fall back to sample baseline
    const tempC = input.temperatureC !== undefined ? input.temperatureC : r.parameters.operatingTempCelsius;
    const voltageV = input.voltageV !== undefined ? input.voltageV : r.parameters.inputVoltageVolts;
    const cycles = input.operatingCycles !== undefined ? input.operatingCycles : r.parameters.operatingCycles;
    const age = input.componentAgeYears !== undefined ? input.componentAgeYears : r.parameters.ageYears;
    const pcbIntegrity = input.pcbIntegrityScore !== undefined ? input.pcbIntegrityScore : 92.0;

    // Arrhenius thermal acceleration calculation (nominal baseline 25C)
    const tUseK = 298.15;
    const tStressK = Math.max(tempC, 25.0) + 273.15;
    const arrheniusAF = Math.min(Math.max(Math.exp((0.7 / 8.617e-5) * (1.0 / tUseK - 1.0 / tStressK)), 1.0), 10.0);
    const voltageAF = Math.pow(Math.max(voltageV / 3.3, 0.8), 2.5);
    const integrityFactor = Math.max(pcbIntegrity / 100.0, 0.4);

    const baseHours = 80000;
    const accelRate = (arrheniusAF * 0.55 + voltageAF * 0.45) / integrityFactor;
    const usedHours = input.operatingHours !== undefined ? input.operatingHours : (age * 8760 * 0.5);
    const remainingHours = Math.max(1200, Math.round((baseHours - usedHours) / accelRate));
    const remainingYears = +(remainingHours / 8760).toFixed(1);

    const healthScore = Math.min(98, Math.max(15, Math.round((remainingHours / baseHours) * 100 - (100 - pcbIntegrity) * 0.3)));
    
    let healthStatus: "HEALTHY" | "GOOD" | "FAIR" | "DEGRADED" | "CRITICAL" = "GOOD";
    if (healthScore >= 90) healthStatus = "HEALTHY";
    else if (healthScore >= 75) healthStatus = "GOOD";
    else if (healthScore >= 50) healthStatus = "FAIR";
    else if (healthScore >= 25) healthStatus = "DEGRADED";
    else healthStatus = "CRITICAL";

    const uncertaintyHours = Math.round(remainingHours * 0.16);
    const lowerBoundHours = Math.max(500, remainingHours - uncertaintyHours);
    const upperBoundHours = remainingHours + uncertaintyHours;

    const healthFactors: IHealthFactor[] = [
      {
        factor: tempC > 55 ? "Thermal Acceleration Stress" : "Optimal Junction Temperature",
        impact: tempC > 55 ? -Math.round((tempC - 55) * 0.4) : +5,
        severity: tempC > 75 ? "HIGH" : tempC > 55 ? "MEDIUM" : "LOW",
        evidence: `Operating junction temperature (${tempC}°C) gives an Arrhenius thermal acceleration factor of ${arrheniusAF.toFixed(1)}x.`,
      },
      {
        factor: "PCB Substrate Visual Integrity",
        impact: -Math.round((100 - pcbIntegrity) * 0.5),
        severity: pcbIntegrity > 85 ? "LOW" : "MEDIUM",
        evidence: `Phase 3 topological analysis recorded a visual board integrity score of ${pcbIntegrity}%.`,
      },
      {
        factor: "Operational Power Cycles",
        impact: -Math.round(cycles / 1000),
        severity: cycles > 5000 ? "HIGH" : "LOW",
        evidence: `Recorded ${cycles} power-on thermal cycles contributing to solder joint fatigue.`,
      },
    ];

    const failureModes: IFailureMode[] = [
      {
        name: "THERMAL_STRESS",
        risk: tempC > 65 ? "HIGH" : "MODERATE",
        evidence: [`Junction temperature (${tempC}°C) accelerates solder joint and die degradation.`],
        confidence: 0.88,
      },
      {
        name: "CORROSION",
        risk: pcbIntegrity < 90 ? "MODERATE" : "LOW",
        evidence: ["Visual inspection of trace surfaces indicates localized atmospheric exposure."],
        confidence: 0.82,
      },
    ];

    const components: IComponentRUL[] = (input.components && input.components.length > 0)
      ? input.components.map((c, idx) => {
          const isCapacitor = c.componentType.toLowerCase().includes("capacitor");
          const compHealth = Math.max(10, Math.min(100, healthScore - (isCapacitor ? 8 : 0) + (idx % 3) * 2));
          const compYears = +(remainingYears * (compHealth / 100)).toFixed(1);
          return {
            componentId: c.componentId,
            componentType: c.componentType,
            healthScore: compHealth,
            healthStatus: compHealth >= 90 ? "HEALTHY" : compHealth >= 75 ? "GOOD" : compHealth >= 50 ? "FAIR" : "DEGRADED",
            estimatedRULHours: Math.round(compYears * 8760),
            estimatedRULYears: compYears,
            riskLevel: compHealth < 50 ? "HIGH" : compHealth < 75 ? "MODERATE" : "LOW",
            confidence: 0.86,
            primaryContributingFactor: isCapacitor ? "Electrolytic dielectric dry-out" : "Thermal fatigue kinetics",
          };
        })
      : [
          {
            componentId: `CMP-001`,
            componentType: "SoC / Processor",
            healthScore: healthScore,
            healthStatus: healthStatus,
            estimatedRULHours: remainingHours,
            estimatedRULYears: remainingYears,
            riskLevel: "LOW",
            confidence: 0.91,
            primaryContributingFactor: "Thermal acceleration kinetics",
          },
        ];

    return {
      analysisId: input.analysisId,
      modelProvider: "MOCK",
      modelName: "Arrhenius-Degradation-XGBoost (Mock Provider)",
      modelVersion: "v1.2.0",
      datasetVersion: "synthetic-reliability-v1",
      featureVersion: "rul-features-v1",

      healthScore,
      healthStatus,
      healthConfidence: 0.89,
      healthFactors,

      rulHours: remainingHours,
      rulDays: Math.round(remainingHours / 24),
      rulMonths: +(remainingHours / 730).toFixed(1),
      rulYears: remainingYears,
      rulCycles: cycles,

      predictionInterval: {
        lowerBoundHours,
        upperBoundHours,
        lowerBoundYears: +(lowerBoundHours / 8760).toFixed(1),
        upperBoundYears: +(upperBoundHours / 8760).toFixed(1),
        confidenceIntervalPercent: 90,
      },

      confidence: 0.88,
      uncertaintyHours,
      failureRisk: healthScore < 50 ? "HIGH" : healthScore < 75 ? "MODERATE" : "LOW",
      riskLevel: healthScore < 50 ? "HIGH" : healthScore < 75 ? "MODERATE" : "LOW",

      contributingFactors: healthFactors.map((hf) => hf.factor),
      failureModes,
      components,

      inputFeatures: {
        temperatureC: tempC,
        voltageV: voltageV,
        operatingCycles: cycles,
        componentAgeYears: age,
        pcbIntegrityScore: pcbIntegrity,
      },
      dataCompleteness: (() => {
        let dc = 40;
        if (input.temperatureC !== undefined) dc += 15;
        if (input.operatingHours !== undefined) dc += 15;
        if (input.operatingCycles !== undefined) dc += 15;
        if (input.componentAgeYears !== undefined) dc += 10;
        if (input.voltageV !== undefined) dc += 5;
        return dc;
      })(),
      missingFeatures: [
        ...(input.temperatureC === undefined ? ["operatingTempCelsius"] : []),
        ...(input.operatingHours === undefined ? ["operatingHours"] : []),
        ...(input.operatingCycles === undefined ? ["operatingCycles"] : []),
      ],
      limitations: [
        "Visual PCB surface condition alone does not reveal internal silicon junction dielectric breakdown.",
        "Predictions use Arrhenius thermal acceleration (Ea = 0.7 eV) and IPC-9701 solder fatigue heuristics.",
        "Field reliability requires four-wire Kelvin electrical continuity and operational logging telemetry.",
      ],
      provenance: input.isScenarioSimulation ? "SIMULATED" : "ESTIMATED",
      status: (() => {
        let dc = 40;
        if (input.temperatureC !== undefined) dc += 15;
        if (input.operatingHours !== undefined) dc += 15;
        if (input.operatingCycles !== undefined) dc += 15;
        if (input.componentAgeYears !== undefined) dc += 10;
        if (input.voltageV !== undefined) dc += 5;
        return dc < 60 ? "INSUFFICIENT_DATA" : dc < 75 ? "PARTIAL" : "COMPLETED";
      })(),
      isSynthetic: true,

      // Legacy compatibility
      estimatedHours: remainingHours,
      estimatedYears: remainingYears,
      temperature: tempC,
      voltage: voltageV,
      operationalCycles: cycles,
      age: age,
      wear: 14.2,
      corrosion: 5.1,
      model: "Arrhenius-Degradation-XGB",
      version: "v1.2.0",
      provider: "MOCK",
      predictionRange: {
        minYears: +(lowerBoundHours / 8760).toFixed(1),
        maxYears: +(upperBoundHours / 8760).toFixed(1),
        confidenceIntervalPercent: 90,
      },
    };
  }

  async getModelInfo() {
    return {
      model: "EcoIntel-Degradation-XGBoost",
      version: "v1.2.0",
      provider: "MOCK",
      status: "DEMO_DATASET",
      evaluation: {
        maeHours: 1420.5,
        rmseHours: 1890.2,
        r2Score: 0.912,
      },
    };
  }
}

export class XGBoostRULProvider implements RULProvider {
  private aiServiceUrl: string;
  private apiKey: string;

  constructor(aiServiceUrl?: string, apiKey?: string) {
    this.aiServiceUrl = aiServiceUrl || process.env.AI_SERVICE_URL || "http://localhost:8001";
    this.apiKey = apiKey || process.env.AI_SERVICE_API_KEY || "eco-intel-internal-ai-key-2026";
  }

  async predict(input: RULInput): Promise<RULOutput> {
    try {
      const response = await fetch(`${this.aiServiceUrl}/rul/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI Service RUL prediction failed HTTP ${response.status}: ${errorText}`);
      }

      const resJson = await response.json();
      if (!resJson.success || !resJson.data) {
        throw new Error(resJson.error?.message || "AI Service returned invalid RUL payload format.");
      }

      const d = resJson.data;

      return {
        ...d,
        analysisId: input.analysisId,
        modelProvider: "XGBOOST",
        // Legacy fallbacks
        estimatedHours: d.rulHours,
        estimatedYears: d.rulYears,
        temperature: input.temperatureC || 45.0,
        voltage: input.voltageV || 3.3,
        operationalCycles: d.rulCycles || 1800,
        age: input.componentAgeYears || 2.0,
        wear: 14.0,
        corrosion: 4.0,
        model: d.modelName,
        version: d.modelVersion,
        provider: "XGBOOST",
        predictionRange: {
          minYears: d.predictionInterval?.lowerBoundYears || d.rulYears * 0.85,
          maxYears: d.predictionInterval?.upperBoundYears || d.rulYears * 1.15,
          confidenceIntervalPercent: 90,
        },
      };
    } catch (err: any) {
      console.error("[XGBoostRULProvider] Prediction error:", err.message);
      throw err;
    }
  }

  async getModelInfo() {
    try {
      const response = await fetch(`${this.aiServiceUrl}/rul/model-info`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (response.ok) {
        const json = await response.json();
        return json.data;
      }
    } catch (e: any) {
      console.warn("[XGBoostRULProvider] Model info fetch failed:", e.message);
    }
    return {
      model: "EcoIntel-Degradation-XGBoost",
      version: "v1.2.0",
      provider: "XGBOOST",
      status: "VALIDATED_SYNTHETIC",
    };
  }
}

export class LightGBMRULProvider implements RULProvider {
  async predict(): Promise<RULOutput> {
    throw new Error("LightGBMRULProvider is a future capability and is not yet configured.");
  }
  async getModelInfo() {
    throw new Error("LightGBM model not loaded.");
  }
}

export class LSTMRULProvider implements RULProvider {
  async predict(): Promise<RULOutput> {
    throw new Error("LSTMRULProvider is a future capability for temporal sensor telemetry.");
  }
  async getModelInfo() {
    throw new Error("LSTM temporal model not loaded.");
  }
}

export class PhysicsInformedRULProvider implements RULProvider {
  async predict(): Promise<RULOutput> {
    throw new Error("PhysicsInformedRULProvider requires FEA thermal strain tensor simulation.");
  }
  async getModelInfo() {
    throw new Error("FEA physics model not loaded.");
  }
}

export class RULService {
  private mockProvider = new MockRULProvider();
  private xgboostProvider = new XGBoostRULProvider();

  async predict(input: RULInput): Promise<RULOutput> {
    const configuredProvider = (process.env.RUL_PROVIDER || "mock").toLowerCase();

    // If it's a sample dataset and not explicitly forced to xgboost, use mock
    if (input.sampleId && configuredProvider !== "xgboost") {
      return this.mockProvider.predict(input);
    }

    if (configuredProvider === "xgboost") {
      return await this.xgboostProvider.predict(input);
    }

    return this.mockProvider.predict(input);
  }

  async getModelInfo() {
    const configuredProvider = (process.env.RUL_PROVIDER || "mock").toLowerCase();
    if (configuredProvider === "xgboost") {
      return this.xgboostProvider.getModelInfo();
    }
    return this.mockProvider.getModelInfo();
  }
}

export const rulService = new RULService();
