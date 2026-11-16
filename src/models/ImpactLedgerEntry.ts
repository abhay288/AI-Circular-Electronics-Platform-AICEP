import mongoose, { Schema, Document, Model } from "mongoose";

export interface IImpactLedgerEntry extends Document {
  entryId: string;
  analysisId: string;
  organizationId?: string;
  sourceType: "COMPONENT" | "MATERIAL" | "REPAIR" | "MARKETPLACE" | "PROCESS" | "TRANSPORT";
  sourceId: string;
  impactType:
    | "AVOIDED_MANUFACTURING"
    | "MATERIAL_DISPLACEMENT"
    | "REPAIR_OFFSET"
    | "TRANSPORT_EMISSION"
    | "PROCESS_EMISSION"
    | "WASTE_DIVERSION";
  quantity: number;
  unit: string;
  factor: number;
  factorUnit: string;
  impactValue: number; // Positive = avoided benefit, Negative = additional process burden
  methodology: string;
  scenario: string;
  status: "POTENTIAL" | "REALIZED";
  isExclusive: boolean; // Flag to prevent concurrent material double-crediting
  metadata?: Record<string, any>;
  createdAt: Date;
}

const ImpactLedgerEntrySchema = new Schema<IImpactLedgerEntry>(
  {
    entryId: { type: String, required: true, unique: true, index: true },
    analysisId: { type: String, required: true, index: true },
    organizationId: { type: String, index: true },
    sourceType: {
      type: String,
      enum: ["COMPONENT", "MATERIAL", "REPAIR", "MARKETPLACE", "PROCESS", "TRANSPORT"],
      required: true,
      index: true,
    },
    sourceId: { type: String, required: true, index: true },
    impactType: {
      type: String,
      enum: [
        "AVOIDED_MANUFACTURING",
        "MATERIAL_DISPLACEMENT",
        "REPAIR_OFFSET",
        "TRANSPORT_EMISSION",
        "PROCESS_EMISSION",
        "WASTE_DIVERSION",
      ],
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    factor: { type: Number, required: true },
    factorUnit: { type: String, required: true },
    impactValue: { type: Number, required: true },
    methodology: { type: String, required: true },
    scenario: { type: String, required: true, default: "REPAIR" },
    status: {
      type: String,
      enum: ["POTENTIAL", "REALIZED"],
      default: "POTENTIAL",
      index: true,
    },
    isExclusive: { type: Boolean, default: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

// Compound index to detect and prevent double counting
ImpactLedgerEntrySchema.index(
  { analysisId: 1, sourceId: 1, scenario: 1 },
  { background: true }
);

export const ImpactLedgerEntry: Model<IImpactLedgerEntry> =
  mongoose.models.ImpactLedgerEntry ||
  mongoose.model<IImpactLedgerEntry>("ImpactLedgerEntry", ImpactLedgerEntrySchema);

export default ImpactLedgerEntry;
