import { SAMPLE_DATASETS } from "@/lib/data/sampleDatasets";
import {
  RepairAssessmentInput,
  RepairAssessmentResult,
  IRepairIssue,
  RepairAction,
  ComponentRepairabilityStatus,
  RecommendationPriority,
  CircularityRecommendation,
} from "@/lib/repair/repairTaxonomy";
import { RepairDecisionEngine } from "@/lib/repair/repairEngine";

export interface ModelInfo {
  provider: string;
  model: string;
  version: string;
  datasetVersion?: string;
  isSimulated: boolean;
}

export interface RepairProvider {
  readonly name: "mock" | "rules";
  assess(input: RepairAssessmentInput): Promise<RepairAssessmentResult>;
  getModelInfo(): Promise<ModelInfo>;
}

export class RuleBasedRepairProvider implements RepairProvider {
  readonly name = "rules" as const;
  private engine = new RepairDecisionEngine();

  async assess(input: RepairAssessmentInput): Promise<RepairAssessmentResult> {
    return this.engine.evaluate(input);
  }

  async getModelInfo(): Promise<ModelInfo> {
    return {
      provider: "RULES",
      model: "EcoIntel-Circularity-Decision-Engine",
      version: process.env.REPAIR_MODEL_VERSION || "1.0.0",
      datasetVersion: "circularity-rules-v1",
      isSimulated: false,
    };
  }
}

export class MockRepairProvider implements RepairProvider {
  readonly name = "mock" as const;
  private engine = new RepairDecisionEngine();

  async assess(input: RepairAssessmentInput): Promise<RepairAssessmentResult> {
    // If input has real components, evaluate them via the engine but label provider as MOCK DEMO
    if (input.components && input.components.length > 0) {
      const res = this.engine.evaluate(input);
      return {
        ...res,
        provider: "MOCK",
        modelVersion: "repair-demo-v1.0",
        limitations: [
          ...res.limitations,
          "DEMO DATASET: Simulated diagnostic environment for offline evaluation.",
        ],
      };
    }

    // Default sample data fallback
    const sample = (input.sampleId && SAMPLE_DATASETS[input.sampleId]) || SAMPLE_DATASETS["router-board"];
    const rep = sample.repair;

    const actionMap: Record<string, CircularityRecommendation> = {
      reuse: "REUSE",
      repair: "REPAIR",
      refurbish: "REFURBISH",
      recover: "RECOVER",
      recycle: "RECYCLE",
    };

    const componentAssessments = rep.issues.map((i) => ({
      componentId: i.component,
      componentName: i.component,
      componentType: "IC",
      repairability: "LIKELY_REPAIRABLE" as ComponentRepairabilityStatus,
      healthStatus: "FAIR",
      healthScore: 78,
      rulHours: 35000,
      damageSeverity: (i.severity.toUpperCase() === "CRITICAL" ? "HIGH" : i.severity.toUpperCase()) as any,
      recommendedAction: "RESOLDER" as RepairAction,
      priority: (i.severity.toUpperCase() === "HIGH" ? "HIGH" : "MEDIUM") as RecommendationPriority,
      confidence: 0.94,
      evidence: ["Thermal cycling discoloration observed on power pin leads"],
      reasoning: "Detected high-temperature cyclic stress on power delivery plane.",
    }));

    const repairRecommendations = rep.issues.map((i, idx) => ({
      recommendationId: `REC-DEMO-2026-00${idx + 1}`,
      componentId: i.component,
      componentName: i.component,
      action: "RESOLDER" as RepairAction,
      priority: (i.severity.toUpperCase() === "HIGH" ? "HIGH" : "MEDIUM") as RecommendationPriority,
      reason: i.issue,
      evidence: ["Cyclic thermal fatigue on copper plane"],
      confidence: 0.94,
      expectedOutcome: i.recommendation,
      estimatedComplexity: "MEDIUM" as const,
      status: "RECOMMENDED" as const,
    }));

    return {
      analysisId: input.analysisId,
      status: "COMPLETED",
      overallRepairability: "REPAIRABLE",
      overallRecommendation: actionMap[rep.recommendedAction] || "REPAIR",
      decisionScore: 88,
      componentAssessments,
      repairRecommendations,
      circularityDecision: {
        recommendedPath: actionMap[rep.recommendedAction] || "REPAIR",
        alternativePaths: ["REFURBISH", "REUSE"],
        decisionConfidence: 0.92,
        decisionScore: 88,
        decisionFactors: {
          repairability: 90,
          health: 82,
          rul: 78,
          damageSeverity: 25,
          componentAvailability: 95,
          materialRecoveryPotential: 75,
          reusability: 80,
        },
        environmentalConsiderations: "Repair avoids ~28.4 kg of Scope 3 CO2 emissions.",
        technicalConsiderations: "Component leads accessible for hot-air reflow.",
        materialConsiderations: "Precious gold content on connector pins preserved.",
        reason: "Local component thermal stress is readily repairable.",
      },
      decisionMatrix: [
        {
          option: "REPAIR",
          score: 88,
          confidence: 0.92,
          supportingFactors: ["Localized solder joint oxidation", "Intact substrate layers"],
          drawbacks: [],
        },
        {
          option: "REFURBISH",
          score: 82,
          confidence: 0.9,
          supportingFactors: ["Secondary deployment feasible"],
          drawbacks: [],
        },
      ],
      evidence: [
        {
          source: "DEMO_DATASET",
          type: "SIMULATED_INSPECTION",
          description: "EcoIntel Demonstration PCB Sample Dataset.",
          confidence: 0.95,
        },
      ],
      limitations: [
        "DEMO DATASET: Recommendations are generated from benchmark electronic samples.",
      ],
      provider: "MOCK",
      modelVersion: "repair-mock-v1.0",
    };
  }

  async getModelInfo(): Promise<ModelInfo> {
    return {
      provider: "MOCK",
      model: "EcoIntel-Mock-Repair-Provider",
      version: "1.0.0",
      datasetVersion: "demo-synthetic-v1",
      isSimulated: true,
    };
  }
}

export function getRepairProvider(): RepairProvider {
  const provider = (process.env.REPAIR_PROVIDER || "mock").toLowerCase();
  if (provider === "rules") {
    return new RuleBasedRepairProvider();
  }
  return new MockRepairProvider();
}
