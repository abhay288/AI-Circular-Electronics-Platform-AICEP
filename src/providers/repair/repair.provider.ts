import { SAMPLE_DATASETS } from "@/lib/data/sampleDatasets";
import { IRepairIssue } from "@/models/RepairAssessment";

export interface RepairInput {
  analysisId: string;
  sampleId?: string;
  damagedComponents?: string[];
}

export interface RepairOutput {
  recommendedAction: "REUSE" | "REPAIR" | "REFURBISH" | "RECOVER" | "RECYCLE";
  primaryFault: string;
  estimatedRepairCostINR: number;
  estimatedRepairCostUSD: number;
  estimatedCO2SavingsKg: number;
  feasibilityIndexPercent: number;
  confidence: number;
  issues: IRepairIssue[];
  provider: "MOCK" | "AI_REPAIR";
}

export interface RepairProvider {
  assess(input: RepairInput): Promise<RepairOutput>;
}

export class MockRepairProvider implements RepairProvider {
  async assess(input: RepairInput): Promise<RepairOutput> {
    const sample = (input.sampleId && SAMPLE_DATASETS[input.sampleId]) || SAMPLE_DATASETS["router-board"];
    const rep = sample.repair;

    const actionMap: Record<string, "REUSE" | "REPAIR" | "REFURBISH" | "RECOVER" | "RECYCLE"> = {
      reuse: "REUSE",
      repair: "REPAIR",
      refurbish: "REFURBISH",
      recover: "RECOVER",
      recycle: "RECYCLE",
    };

    const issues: IRepairIssue[] = rep.issues.map((i) => ({
      componentName: i.component,
      issue: i.issue,
      severity: i.severity.toUpperCase() as any,
      confidence: 0.94,
      recommendation: i.recommendation,
      reason: "Detected high-temperature cyclic stress on power delivery copper plane.",
      suggestedAction: i.action,
    }));

    const costUSD = rep.estimatedRepairCostUSD || 14.5;
    const costINR = Math.round(costUSD * 86.5);

    return {
      recommendedAction: actionMap[rep.recommendedAction] || "REFURBISH",
      primaryFault: rep.primaryFault,
      estimatedRepairCostINR: costINR,
      estimatedRepairCostUSD: costUSD,
      estimatedCO2SavingsKg: rep.estimatedCO2SavingsKg || 28.4,
      feasibilityIndexPercent: rep.feasibilityIndexPercent || 92,
      confidence: 0.94,
      issues,
      provider: "MOCK",
    };
  }
}
