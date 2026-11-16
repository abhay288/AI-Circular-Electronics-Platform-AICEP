import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z
    .enum([
      "ADMIN",
      "RESEARCHER",
      "REPAIR_CENTER",
      "MANUFACTURER",
      "RECYCLER",
      "LAB_OPERATOR",
      "MARKETPLACE_SELLER",
    ])
    .default("RESEARCHER"),
  organizationName: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const CreateAnalysisSchema = z.object({
  sourceType: z.enum(["CAMERA", "UPLOAD", "SAMPLE", "camera", "upload", "sample"]).default("SAMPLE"),
  mode: z.enum(["LIVE", "DEMO", "live", "demo"]).default("DEMO"),
  deviceName: z.string().min(1, "Device name is required"),
  deviceType: z.string().min(1, "Device type is required"),
  sampleId: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const StartAnalysisSchema = z.object({
  mode: z.enum(["LIVE", "DEMO"]).optional(),
  batchGrade: z.string().optional(),
});

export const MarketplaceListingSchema = z.object({
  analysisId: z.string().min(1, "analysisId is required"),
  componentIds: z.array(z.string()).min(1, "At least one componentId is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  condition: z.enum(["MINT", "EXCELLENT", "REFURBISHED", "TESTED_WORKING"]).default("TESTED_WORKING"),
  priceINR: z.number().min(0, "Price in INR must be non-negative"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  location: z.string().default("Bangalore, India"),
});

export const ReportGenerationSchema = z.object({
  analysisId: z.string().min(1, "analysisId is required"),
  format: z.enum(["PDF", "JSON", "CSV"]).default("PDF"),
  sections: z.array(z.string()).optional(),
});

export const RULPredictRequestSchema = z.object({
  analysisId: z.string().min(1, "analysisId is required"),
  componentId: z.string().optional(),
  operatingHours: z.number().min(0).optional(),
  operatingCycles: z.number().min(0).optional(),
  temperatureC: z.number().min(-40).max(150).optional(),
  voltageV: z.number().min(0).max(100).optional(),
  currentA: z.number().min(0).max(50).optional(),
  loadPercentage: z.number().min(0).max(100).optional(),
  componentAgeYears: z.number().min(0).max(50).optional(),
});

export const RULScenarioSimulationSchema = z.object({
  temperatureC: z.number().min(-40).max(150).optional(),
  voltageV: z.number().min(0).max(100).optional(),
  currentA: z.number().min(0).max(50).optional(),
  loadPercentage: z.number().min(0).max(100).optional(),
  operatingHours: z.number().min(0).optional(),
  operatingCycles: z.number().min(0).optional(),
  componentAgeYears: z.number().min(0).max(50).optional(),
});

export const MaterialAnalyzeRequestSchema = z.object({
  analysisId: z.string().min(1, "analysisId is required"),
  boardMassGrams: z.number().positive("boardMassGrams must be positive").optional(),
  boardAreaCm2: z.number().positive("boardAreaCm2 must be positive").optional(),
  manufacturer: z.string().optional(),
  partNumber: z.string().optional(),
  additionalMetadata: z.record(z.string(), z.unknown()).optional(),
});

export const MaterialScenarioRequestSchema = z.object({
  scenario: z.enum(["conservative", "typical", "optimistic"]).default("typical"),
});

export const CreatePassportSchema = z.object({
  analysisId: z.string().min(1, "analysisId is required"),
  assetType: z
    .enum([
      "PCB",
      "ELECTRONIC_DEVICE",
      "COMPONENT",
      "RECOVERED_COMPONENT",
      "REFURBISHED_DEVICE",
      "REPAIRED_DEVICE",
    ])
    .default("PCB"),
  assetName: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  partNumber: z.string().optional(),
  boardRevision: z.string().optional(),
  manufacturingDate: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  notes: z.string().optional(),
  autoAnchor: z.boolean().optional(),
});

export const AddPassportEventSchema = z.object({
  eventType: z.enum([
    "CREATED",
    "ANALYZED",
    "INSPECTED",
    "REPAIRED",
    "REFURBISHED",
    "TRANSFERRED",
    "LISTED",
    "SOLD",
    "RECOVERED",
    "RECYCLED",
    "REUSED",
    "RETIRED",
    "REVOKED",
    "CORRECTION_ISSUED",
  ]),
  description: z.string().min(3, "Description must be at least 3 characters"),
  location: z.string().optional(),
  evidence: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const TransferPassportSchema = z.object({
  newOwner: z.string().min(2, "newOwner is required"),
  reason: z.string().optional(),
});

export const RevokePassportSchema = z.object({
  reason: z.string().min(5, "Revocation reason must be at least 5 characters"),
});

export const AddPassportDocumentSchema = z.object({
  documentName: z.string().min(2, "documentName is required"),
  documentType: z.enum([
    "INSPECTION_REPORT",
    "REPAIR_REPORT",
    "MATERIAL_REPORT",
    "MANUFACTURER_DOC",
    "DATASHEET",
    "CERTIFICATE",
    "IMAGE_EVIDENCE",
    "OTHER",
  ]),
  storageReference: z.string().min(1, "storageReference is required"),
  documentContentOrHash: z.string().min(1, "documentContentOrHash is required"),
});



