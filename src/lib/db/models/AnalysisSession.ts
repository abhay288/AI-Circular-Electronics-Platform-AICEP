import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDetectedComponent {
  id: string;
  name: string;
  type: string;
  manufacturer: string;
  package: string;
  confidence: number;
  health: number;
  remainingLifeHours: number;
  remainingLifeYears: number;
  material: string;
  coordinates: { x: number; y: number; width: number; height: number };
  status: string;
  passportId?: string;
  repairRecommendation?: string;
}

export interface IAnalysisSession extends Document {
  sessionId: string;
  userId?: mongoose.Types.ObjectId | string;
  deviceId: string;
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
  detectionResult?: {
    model: string;
    inferenceTimeMs: number;
    componentsCount: number;
    components: IDetectedComponent[];
    confidenceAvg: number;
  };
  reconstructionResult?: {
    pcbId: string;
    boardModel: string;
    layerCount: number;
    traceIntegrityPercent: number;
    severedTracesRepaired: number;
    reconstructionConfidence: number;
    schematics?: {
      kicadFileUrl?: string;
      gerberZipUrl?: string;
      netlistRaw?: string;
    };
  };
  rulResult?: {
    overallHealthScore: number;
    predictedYears: number;
    predictedHours: number;
    failureProbability: number;
    confidence: number;
    parameters: {
      operatingTempCelsius: number;
      inputVoltageVolts: number;
      operatingCycles: number;
      ageYears: number;
    };
  };
  metalResult?: {
    pcbWeightKg: number;
    recoveryEfficiencyPercent: number;
    totalEstimatedMarketValueUSD: number;
    yields: Array<{
      metal: string;
      symbol: string;
      yieldGrams: number;
      marketRateUSD: number;
      estimatedValueUSD: number;
    }>;
  };
  repairResult?: {
    reportId: string;
    recommendedAction: "reuse" | "repair" | "refurbish" | "recover" | "recycle";
    primaryFault: string;
    estimatedRepairCostUSD: number;
    estimatedCO2SavingsKg: number;
    feasibilityIndexPercent: number;
    issues: Array<{
      component: string;
      issue: string;
      severity: "low" | "medium" | "high" | "critical";
      recommendation: string;
      action: string;
    }>;
  };
  passportId?: string;
  passportResult?: {
    passportId: string;
    tokenId?: string;
    blockchainStatus: "Verified on Polygon" | "Passport Ready" | "Verification Pending";
    polygonTransactionHash?: string;
    contractAddress?: string;
    isVerified: boolean;
    qrDataUri?: string;
  };
  carbonResult?: {
    co2AvoidedKg: number;
    energySavedKWh: number;
    waterSavedLiters: number;
    eWasteDivertedKg: number;
    circularityScorePercent: number;
  };
  reportId?: string;
  executiveSummary?: {
    overallHealthPercent: number;
    classification: string;
    potentialValueUSD: number;
    estimatedRemainingLifeYears: number;
    componentsDetectedCount: number;
    recommendedAction: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AnalysisSessionSchema: Schema<IAnalysisSession> = new Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.Mixed },
    deviceId: { type: String, required: true },
    deviceName: { type: String, required: true },
    deviceType: { type: String, required: true },
    sourceType: {
      type: String,
      enum: ["upload", "camera", "sample"],
      default: "sample",
    },
    sampleId: { type: String },
    image: { type: String, required: true },
    imageQuality: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ["draft", "ready", "processing", "completed", "failed"],
      default: "draft",
    },
    dataClassification: {
      type: String,
      enum: ["measured", "detected", "predicted", "estimated", "simulated", "sample"],
      default: "sample",
    },
    detectionResult: { type: Schema.Types.Mixed },
    reconstructionResult: { type: Schema.Types.Mixed },
    rulResult: { type: Schema.Types.Mixed },
    metalResult: { type: Schema.Types.Mixed },
    repairResult: { type: Schema.Types.Mixed },
    passportId: { type: String },
    passportResult: { type: Schema.Types.Mixed },
    carbonResult: { type: Schema.Types.Mixed },
    reportId: { type: String },
    executiveSummary: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const AnalysisSession: Model<IAnalysisSession> =
  mongoose.models.AnalysisSession ||
  mongoose.model<IAnalysisSession>("AnalysisSession", AnalysisSessionSchema);
