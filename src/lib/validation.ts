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

