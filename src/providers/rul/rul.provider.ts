import { SAMPLE_DATASETS } from "@/lib/data/sampleDatasets";

export interface RULInput {
  analysisId: string;
  sampleId?: string;
  componentsHealthAvg?: number;
}

export interface RULOutput {
  healthScore: number;
  estimatedHours: number;
  estimatedYears: number;
  confidence: number;
  temperature: number;
  voltage: number;
  operationalCycles: number;
  age: number;
  wear: number;
  corrosion: number;
  model: string;
  version: string;
  predictionRange: {
    minYears: number;
    maxYears: number;
    confidenceIntervalPercent: number;
  };
  provider: "MOCK" | "XGBOOST" | "LSTM" | "PHYSICS_ML";
}

export interface RULProvider {
  predict(input: RULInput): Promise<RULOutput>;
}

export class MockRULProvider implements RULProvider {
  async predict(input: RULInput): Promise<RULOutput> {
    const sample = (input.sampleId && SAMPLE_DATASETS[input.sampleId]) || SAMPLE_DATASETS["router-board"];
    const r = sample.rul;

    return {
      healthScore: r.overallHealthScore,
      estimatedHours: r.predictedHours,
      estimatedYears: r.predictedYears,
      confidence: +(r.confidence / 100).toFixed(2),
      temperature: r.parameters.operatingTempCelsius,
      voltage: r.parameters.inputVoltageVolts,
      operationalCycles: r.parameters.operatingCycles,
      age: r.parameters.ageYears,
      wear: 14.2,
      corrosion: 5.1,
      model: "Arrhenius-Degradation-XGB (Mock Provider)",
      version: "3.1.0",
      predictionRange: {
        minYears: +(r.predictedYears * 0.85).toFixed(1),
        maxYears: +(r.predictedYears * 1.15).toFixed(1),
        confidenceIntervalPercent: 95,
      },
      provider: "MOCK",
    };
  }
}
