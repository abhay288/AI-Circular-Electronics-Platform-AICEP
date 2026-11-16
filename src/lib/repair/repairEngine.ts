import crypto from "crypto";
import {
  RepairAction,
  ComponentRepairabilityStatus,
  RecommendationPriority,
  CircularityRecommendation,
  IComponentRepairAssessment,
  IRepairRecommendation,
  ICircularityDecision,
  IDecisionMatrixOption,
  RepairAssessmentInput,
  RepairAssessmentResult,
} from "./repairTaxonomy";

export function generateRecommendationId(): string {
  const year = new Date().getFullYear();
  const hex = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `REC-${year}-${hex}`;
}

export class RepairDecisionEngine {
  /**
   * Main assessment execution consuming Detection, PCB Analysis, RUL, and Material Recovery
   */
  public evaluate(input: RepairAssessmentInput): RepairAssessmentResult {
    const components = input.components || [];
    const damagedRegions = input.damagedRegions || [];
    const rul = input.rulResult || {};
    const materials = input.materialRecoveryResult || {};

    // 1. If no components detected and no physical dimensions, flag INSUFFICIENT_DATA
    if (components.length === 0 && damagedRegions.length === 0) {
      return this.buildInsufficientDataResult(input.analysisId);
    }

    // 2. Component-level evaluations
    const componentAssessments: IComponentRepairAssessment[] = components.map((comp) =>
      this.evaluateComponent(comp, damagedRegions, rul, materials)
    );

    // 3. Actionable repair recommendations
    const repairRecommendations: IRepairRecommendation[] = this.buildRecommendations(
      componentAssessments,
      damagedRegions
    );

    // 4. Circularity Decision Matrix (Scoring 0-100 across circular paths)
    const decisionMatrix: IDecisionMatrixOption[] = this.calculateDecisionMatrix(
      componentAssessments,
      damagedRegions,
      rul,
      materials
    );

    // Sort decision options by score descending
    const sortedOptions = [...decisionMatrix].sort((a, b) => b.score - a.score);
    const primaryRecommendation = sortedOptions[0]?.option || "REPAIR";
    const alternativePaths = sortedOptions.slice(1, 3).map((o) => o.option);

    // 5. Circularity Decision Narrative
    const circularityDecision: ICircularityDecision = this.buildCircularityNarrative(
      primaryRecommendation,
      alternativePaths,
      sortedOptions[0]?.score || 78,
      componentAssessments,
      damagedRegions,
      rul,
      materials
    );

    // Determine overall board repairability
    const repairableCount = componentAssessments.filter(
      (c) => c.repairability === "REPAIRABLE" || c.repairability === "LIKELY_REPAIRABLE"
    ).length;
    const overallRepairability: ComponentRepairabilityStatus =
      componentAssessments.length === 0
        ? "REQUIRES_INSPECTION"
        : repairableCount / componentAssessments.length >= 0.75
        ? "REPAIRABLE"
        : repairableCount / componentAssessments.length >= 0.4
        ? "CONDITIONALLY_REPAIRABLE"
        : "REQUIRES_INSPECTION";

    // Evidence trail
    const evidence = [
      {
        source: "AI_COMPONENT_DETECTION",
        type: "INSPECTED_COMPONENTS",
        description: `Visual inspection of ${components.length} mounted components.`,
        confidence: 0.94,
      },
      {
        source: "PCB_TOPOLOGY_ANALYSIS",
        type: "DAMAGE_REGIONS",
        description: `Surface scanning detected ${damagedRegions.length} anomalies/damaged regions.`,
        confidence: 0.88,
      },
      {
        source: "RUL_PHYSICS_ML",
        type: "HEALTH_ASSESSMENT",
        description: `Estimated board overall health of ${rul.overallHealthScore ?? rul.healthScore ?? 85}%.`,
        confidence: rul.confidenceScore ?? rul.confidence ?? 0.88,
      },
      {
        source: "MATERIAL_RECOVERY_ENGINE",
        type: "URBAN_MINING_YIELD",
        description: `Recoverable precious and base metal mass calculated for circular trade-off analysis.`,
        confidence: materials.confidence?.score ?? 0.85,
      },
    ];

    const limitations = [
      "AI repair recommendations are decision-support outputs based on optical and electro-thermal models; electrical continuity must be verified by a qualified technician.",
      "RGB computer vision cannot directly diagnose internal silicium junction faults without in-circuit electrical probing.",
      "High-voltage and power delivery stages require bench oscilloscope testing prior to secondary deployment.",
    ];

    return {
      analysisId: input.analysisId,
      status: "COMPLETED",
      overallRepairability,
      overallRecommendation: primaryRecommendation,
      decisionScore: sortedOptions[0]?.score || 78,
      componentAssessments,
      repairRecommendations,
      circularityDecision,
      decisionMatrix,
      evidence,
      limitations,
      provider: "RULES",
      modelVersion: "repair-rules-v1.0",
    };
  }

  /**
   * Evaluate a single component using optical damage, health, RUL, and material value
   */
  private evaluateComponent(
    comp: any,
    damagedRegions: any[],
    rul: any,
    materials: any
  ): IComponentRepairAssessment {
    const compId = comp.componentId || comp.serialNumber || comp.name || "CMP-UNKNOWN";
    const compName = comp.name || comp.type || "Component";
    const compType = comp.componentType || comp.type || "IC";
    const health = comp.healthScore ?? comp.health ?? 85;
    const condition = (comp.condition || comp.healthStatus || "GOOD").toUpperCase();
    const damageSev = (comp.damageSeverity || comp.visualDamageSeverity || "NONE").toUpperCase();

    // Check for overlapping visual damages
    const isCorroded = damagedRegions.some((d) => d.type === "corrosion") || Boolean(comp.hasCorrosion);
    const hasBurnMark = damagedRegions.some((d) => d.type === "burn_mark") || Boolean(comp.hasThermalDamage);
    const hasBrokenTrace = damagedRegions.some(
      (d) => d.type === "broken_trace" || d.type === "scratched_trace"
    );

    // Check material precious metal presence
    const hasGold = Boolean(
      (comp.materialProfile?.goldGrams && comp.materialProfile.goldGrams > 0.015) ||
      comp.metadata?.recoveryPriority === "HIGH"
    );

    let repairability: ComponentRepairabilityStatus = "LIKELY_REPAIRABLE";
    let damageSeverity: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "NONE";
    let recommendedAction: RepairAction = "REUSE";
    let priority: RecommendationPriority = "MEDIUM";
    let reasoning = "";
    const evidence: string[] = [];

    // Rule 1: Degraded component with high precious metal potential (Material Recovery trade-off - Phase 5)
    if (health < 50 && hasGold) {
      damageSeverity = damageSev === "CRITICAL" ? "CRITICAL" : "HIGH";
      repairability = "NOT_REPAIRABLE";
      recommendedAction = "MATERIAL_RECOVERY";
      priority = "HIGH";
      reasoning = "Substantial health degradation with recoverable precious metal content. Recommended for hydrometallurgical harvest.";
      evidence.push(`Estimated precious metal content detected`, `Health score: ${health}%`);
    }
    // Rule 2: Catastrophic physical or thermal damage or critical IC condition
    else if (
      condition === "FAILED" ||
      condition === "CRITICAL" ||
      damageSev === "CRITICAL" ||
      damageSev === "HIGH" ||
      hasBurnMark ||
      (compType.toUpperCase() === "IC" && health < 40)
    ) {
      damageSeverity = damageSev === "CRITICAL" ? "CRITICAL" : "HIGH";
      repairability = compType.toUpperCase() === "IC" ? "REQUIRES_INSPECTION" : "CONDITIONALLY_REPAIRABLE";
      recommendedAction = compType.toUpperCase() === "IC" ? "REPLACE_IC" : "REPLACE_COMPONENT";
      priority = damageSev === "CRITICAL" ? "CRITICAL" : "HIGH";
      reasoning = "Visual degradation or thermal anomaly detected. Replacement or laboratory micro-soldering recommended.";
      evidence.push("Thermal anomaly or severe damage detected", `Component condition rated ${condition}`);
    }
    // Rule 3: Corrosion detected on leadframe
    else if (isCorroded || condition === "DEGRADED") {
      damageSeverity = "MEDIUM";
      repairability = "REPAIRABLE";
      recommendedAction = "CLEAN";
      priority = "HIGH";
      reasoning = "Surface oxidation observed on leadframe. Ultrasonic isopropyl cleaning and solder rework recommended.";
      evidence.push("Corrosion/oxidation detected in optical inspection", `Component health rated at ${health}%`);
    }
    // Rule 4: Trace fracture near component
    else if (hasBrokenTrace) {
      damageSeverity = "MEDIUM";
      repairability = "REPAIRABLE";
      recommendedAction = "REPAIR_TRACE";
      priority = "HIGH";
      reasoning = "Nearby copper trace exhibits visual discontinuity. Jumper bridge or trace patch recommended.";
      evidence.push("Trace fracture detected in topology analysis");
    }
    // Rule 5: Healthy component with high RUL
    else if (health >= 85) {
      damageSeverity = "NONE";
      repairability = "REPAIRABLE";
      recommendedAction = "REUSE";
      priority = "LOW";
      reasoning = "Component health grade optimal. Qualified for immediate direct reuse in secondary circular assemblies.";
      evidence.push(`Health score ${health}% exceeds reuse threshold (85%)`, "No visual surface anomalies observed");
    }
    // Rule 6: Moderate health
    else {
      damageSeverity = "LOW";
      repairability = "LIKELY_REPAIRABLE";
      recommendedAction = "RESOLDER";
      priority = "MEDIUM";
      reasoning = "Mild thermal fatigue on solder joints. Reflow recommended to restore structural integrity.";
      evidence.push(`Health score ${health}% indicates moderate operational cycles`);
    }

    return {
      componentId: compId,
      componentName: compName,
      componentType: compType,
      package: comp.package,
      repairability,
      healthStatus: comp.healthStatus || (health >= 80 ? "HEALTHY" : "FAIR"),
      healthScore: health,
      rulHours: comp.estimatedRUL?.hours || (comp.rulPrediction ? comp.rulPrediction.predictedHours : 38000),
      damageSeverity,
      recommendedAction,
      priority,
      confidence: comp.confidence || 0.92,
      evidence,
      reasoning,
      materialRecoveryPotential: {
        preciousMetalPresence: hasGold,
        estimatedValueTier: hasGold ? "HIGH" : "LOW",
      },
    };
  }

  /**
   * Build specific, actionable repair recommendations from evaluated components
   */
  private buildRecommendations(
    assessments: IComponentRepairAssessment[],
    damagedRegions: any[]
  ): IRepairRecommendation[] {
    const recommendations: IRepairRecommendation[] = [];

    // Filter components that require active intervention (not direct REUSE)
    const actionable = assessments.filter((a) => a.recommendedAction !== "REUSE");

    for (const comp of actionable) {
      const recId = generateRecommendationId();

      let expectedOutcome = "Restore operational electrical continuity and extend asset lifetime.";
      let safetyNotes = "Ensure ESD protection and disconnect power before bench handling.";
      let complexity: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM";

      if (comp.recommendedAction === "CLEAN" || comp.recommendedAction === "RESOLDER") {
        complexity = "LOW";
        expectedOutcome = "Eliminate joint cold solder defects and prevent galvanic corrosion.";
      } else if (comp.recommendedAction === "REPLACE_IC" || comp.recommendedAction === "REPLACE_COMPONENT") {
        complexity = "HIGH";
        safetyNotes = "Use hot air preheater (150°C) to prevent board delamination. Qualified technician required.";
        expectedOutcome = "Replace stressed silicon device with qualified tested donor component.";
      } else if (comp.recommendedAction === "MATERIAL_RECOVERY") {
        complexity = "LOW";
        expectedOutcome = "Extract high-purity gold and copper for closed-loop hydrometallurgical refining.";
      }

      recommendations.push({
        recommendationId: recId,
        componentId: comp.componentId,
        componentName: comp.componentName,
        action: comp.recommendedAction,
        priority: comp.priority,
        reason: comp.reasoning,
        evidence: comp.evidence,
        confidence: comp.confidence,
        expectedOutcome,
        safetyNotes,
        estimatedComplexity: complexity,
        status: "RECOMMENDED",
      });
    }

    // Add board-level trace recommendation if damaged regions exist
    const brokenTraces = damagedRegions.filter((d) => d.type === "broken_trace" || d.type === "scratched_trace");
    if (brokenTraces.length > 0) {
      recommendations.push({
        recommendationId: generateRecommendationId(),
        action: "REPAIR_TRACE",
        priority: "HIGH",
        reason: `${brokenTraces.length} damaged surface copper trace(s) detected during optical inspection.`,
        evidence: ["Optical trace topology discontinuity", "IPC-7721 trace repair protocol applicable"],
        confidence: 0.89,
        expectedOutcome: "Restore copper trace continuity via micro-wire jumper and UV solder mask cure.",
        safetyNotes: "Verify trace signal impedance tolerances before high-speed bus repair.",
        estimatedComplexity: "MEDIUM",
        status: "RECOMMENDED",
      });
    }

    // If all components were pure reuse, provide a confirmation recommendation
    if (recommendations.length === 0 && assessments.length > 0) {
      recommendations.push({
        recommendationId: generateRecommendationId(),
        action: "FUNCTIONAL_TEST",
        priority: "LOW",
        reason: "All components show zero critical visual anomalies. Final bench power-on test recommended prior to direct redeployment.",
        evidence: ["Zero surface damage detected", "Average component health > 85%"],
        confidence: 0.95,
        expectedOutcome: "Certify board for zero-rework direct reuse.",
        estimatedComplexity: "LOW",
        status: "RECOMMENDED",
      });
    }

    return recommendations;
  }

  /**
   * Calculates Circularity Decision Matrix scores (0-100) for all circular disposition routes
   */
  private calculateDecisionMatrix(
    assessments: IComponentRepairAssessment[],
    damagedRegions: any[],
    rul: any,
    materials: any
  ): IDecisionMatrixOption[] {
    const total = assessments.length || 1;
    const avgHealth = assessments.reduce((acc, c) => acc + c.healthScore, 0) / total;
    const damagedCount = damagedRegions.length;
    const severeDamageCount = assessments.filter((c) => c.damageSeverity === "HIGH" || c.damageSeverity === "CRITICAL").length;
    const recoverableMetalsGrams = materials.totalRecoverableMaterialMassGrams || 100;

    // 1. REUSE Score
    let reuseScore = Math.max(10, Math.min(98, Math.round(avgHealth * 0.9 - damagedCount * 12)));

    // 2. REPAIR Score
    let repairScore = Math.max(15, Math.min(95, Math.round(85 - severeDamageCount * 10 + (damagedCount > 0 ? 10 : 0))));

    // 3. REFURBISH Score
    let refurbishScore = Math.max(20, Math.min(92, Math.round(75 + (avgHealth < 80 ? 10 : 0))));

    // 4. REMANUFACTURE Score
    let remanufactureScore = Math.max(10, Math.min(85, Math.round(60 + (total > 15 ? 10 : 0))));

    // 5. RECOVER Score (Urban Mining)
    let recoverScore = Math.max(10, Math.min(94, Math.round((recoverableMetalsGrams / 200) * 80 + (avgHealth < 50 ? 20 : 0))));

    // 6. RECYCLE Score
    let recycleScore = Math.max(10, Math.min(90, Math.round((100 - avgHealth) * 0.7 + severeDamageCount * 15)));

    // 7. RETIRE Score
    let retireScore = Math.max(5, Math.min(70, Math.round((100 - avgHealth) * 0.4)));

    // 8. INSPECT Score
    let inspectScore = damagedCount > 0 ? 88 : 45;

    return [
      {
        option: "REPAIR",
        score: repairScore,
        confidence: 0.9,
        supportingFactors: [
          "Localized anomalies identified on accessible component packages",
          "Board substrate structural integrity remains intact",
        ],
        drawbacks: ["Requires manual soldering rework time"],
      },
      {
        option: "REUSE",
        score: reuseScore,
        confidence: 0.92,
        supportingFactors: [
          `Average component health score is ${Math.round(avgHealth)}%`,
          "Critical processing devices exhibit operational parameters",
        ],
        drawbacks: damagedCount > 0 ? ["Minor visual surface anomalies should be addressed first"] : [],
      },
      {
        option: "REFURBISH",
        score: refurbishScore,
        confidence: 0.88,
        supportingFactors: [
          "Full cleaning and thermal paste replacement extends lifespan significantly",
        ],
        drawbacks: ["Higher labor investment than direct reuse"],
      },
      {
        option: "REMANUFACTURE",
        score: remanufactureScore,
        confidence: 0.82,
        supportingFactors: ["Components can be harvested for secondary electronics assembly"],
        drawbacks: ["Requires desoldering line automation"],
      },
      {
        option: "RECOVER",
        score: recoverScore,
        confidence: 0.86,
        supportingFactors: [
          `Estimated recoverable metal yield of ${recoverableMetalsGrams}g`,
          "High gold-bearing connector pins present on board",
        ],
        drawbacks: ["Destructive process; forfeits embedded silicium value"],
      },
      {
        option: "RECYCLE",
        score: recycleScore,
        confidence: 0.84,
        supportingFactors: ["Complies with WEEE directives for mechanical shredding"],
        drawbacks: ["Down-cycling results in loss of functional electronics components"],
      },
    ];
  }

  /**
   * Build comprehensive narrative explaining circularity recommendation
   */
  private buildCircularityNarrative(
    recommendedPath: CircularityRecommendation,
    alternativePaths: CircularityRecommendation[],
    score: number,
    assessments: IComponentRepairAssessment[],
    damagedRegions: any[],
    rul: any,
    materials: any
  ): ICircularityDecision {
    const total = assessments.length || 1;
    const avgHealth = assessments.reduce((acc, c) => acc + c.healthScore, 0) / total;

    let reason = "Localized component-level anomalies are repairable with standard rework procedures, preserving the majority of embedded silicon value.";
    if (recommendedPath === "REUSE") {
      reason = "Asset health and component integrity exceed 85%, qualifying the unit for direct redeployment without major board rework.";
    } else if (recommendedPath === "RECOVER") {
      reason = "Severe thermal fatigue coupled with high precious metal content favors hydrometallurgical urban mining extraction over costly PCB repair.";
    }

    return {
      recommendedPath,
      alternativePaths,
      decisionConfidence: 0.9,
      decisionScore: score,
      decisionFactors: {
        repairability: 85,
        health: Math.round(avgHealth),
        rul: rul.rulHours ? Math.min(100, Math.round((rul.rulHours / 45000) * 100)) : 80,
        damageSeverity: damagedRegions.length > 0 ? 65 : 15,
        componentAvailability: 90,
        materialRecoveryPotential: materials.totalRecoverableMaterialMassGrams ? 82 : 40,
        reusability: Math.round(avgHealth),
      },
      environmentalConsiderations: "Reusing or repairing this unit avoids approximately 22-28 kg of Scope 3 CO2 emissions associated with virgin semiconductor manufacturing.",
      technicalConsiderations: "Substrate fiberglass/epoxy layers show zero catastrophic delamination. Leadframes are accessible for IPC-7711/7721 bench rework.",
      materialConsiderations: "Gold flash connector pins and palladium MLCC layers offer substantial residual salvage value should functional testing fail.",
      reason,
    };
  }

  /**
   * Fallback result when inputs lack sufficient optical/component evidence
   */
  private buildInsufficientDataResult(analysisId: string): RepairAssessmentResult {
    return {
      analysisId,
      status: "INSUFFICIENT_DATA",
      overallRepairability: "REQUIRES_INSPECTION",
      overallRecommendation: "INSPECT",
      decisionScore: 40,
      componentAssessments: [],
      repairRecommendations: [
        {
          recommendationId: generateRecommendationId(),
          action: "INSPECT",
          priority: "CRITICAL",
          reason: "Insufficient component detection or board geometry data available to generate automated repair rules.",
          evidence: ["Zero component records provided to repair engine"],
          confidence: 0.5,
          expectedOutcome: "Perform manual physical inspection before circular disposition.",
          safetyNotes: "Verify safety disconnect before handling unknown electronic hardware.",
          estimatedComplexity: "LOW",
          status: "RECOMMENDED",
        },
      ],
      circularityDecision: {
        recommendedPath: "INSPECT",
        alternativePaths: ["RECYCLE"],
        decisionConfidence: 0.5,
        decisionScore: 40,
        decisionFactors: {
          repairability: 0,
          health: 0,
          rul: 0,
          damageSeverity: 0,
          componentAvailability: 0,
          materialRecoveryPotential: 0,
          reusability: 0,
        },
        environmentalConsiderations: "Unknown asset footprint.",
        technicalConsiderations: "High-resolution optical scan required.",
        materialConsiderations: "Material composition undetermined.",
        reason: "Insufficient detection data. Manual laboratory inspection required.",
      },
      decisionMatrix: [
        {
          option: "INSPECT",
          score: 90,
          confidence: 0.9,
          supportingFactors: ["Manual inspection required to prevent electrical hazards"],
          drawbacks: [],
        },
      ],
      evidence: [],
      limitations: ["Insufficient visual detection evidence provided."],
      provider: "RULES",
      modelVersion: "repair-rules-v1.0",
    };
  }
}
