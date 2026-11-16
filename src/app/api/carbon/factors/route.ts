import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { FactorManagementService } from "@/services/carbon/factorManagement.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const CreateFactorSchema = z.object({
  material: z.string().min(1, "Material name is required"),
  region: z.string().optional(),
  process: z.string().min(1, "Process is required"),
  factor: z.number().min(0, "Factor must be non-negative"),
  unit: z.string().min(1, "Unit is required"),
  source: z.string().min(1, "Documented source is required"),
  sourceType: z.enum([
    "AUTHORITATIVE_DATABASE",
    "LITERATURE",
    "GOVERNMENT",
    "INDUSTRY_STANDARD",
    "ORGANIZATION_CONFIGURED",
    "INTERNAL_DATABASE",
    "USER_PROVIDED",
    "SYNTHETIC_DEMO",
  ]).optional(),
  sourceReference: z.string().optional(),
  methodology: z.string().optional(),
  version: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;
    const material = searchParams.get("material") || undefined;
    const status = searchParams.get("status") || undefined;
    const organizationId = searchParams.get("organizationId") || undefined;

    const factors = await FactorManagementService.listFactors({
      material,
      status,
      organizationId,
    });

    return successResponse({
      count: factors.length,
      factors,
    });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to list emission factors", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const parsed = CreateFactorSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid input", 400);
    }

    const userId = req.headers.get("x-user-id") || "admin";
    const userRole = req.headers.get("x-user-role") || "ADMIN";
    const organizationId = req.headers.get("x-organization-id") || undefined;

    const newFactor = await FactorManagementService.createFactor(
      parsed.data,
      { userId, role: userRole, organizationId }
    );

    return successResponse(
      {
        message: "Emission factor created successfully",
        factor: newFactor,
      },
      201
    );
  } catch (error: any) {
    if (error.message?.includes("Forbidden")) {
      return errorResponse("FORBIDDEN", error.message, 403);
    }
    return errorResponse("CREATION_FAILED", error.message || "Failed to create emission factor", 400);
  }
}
