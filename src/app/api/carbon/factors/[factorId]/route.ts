import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { FactorManagementService } from "@/services/carbon/factorManagement.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const UpdateFactorStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ factorId: string }> }
) {
  try {
    await connectDB();
    const { factorId } = await params;
    const body = await req.json();
    const parsed = UpdateFactorStatusSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid status", 400);
    }

    const userId = req.headers.get("x-user-id") || "admin";
    const userRole = req.headers.get("x-user-role") || "ADMIN";
    const organizationId = req.headers.get("x-organization-id") || undefined;

    const updated = await FactorManagementService.updateFactorStatus(
      factorId,
      parsed.data.status,
      { userId, role: userRole, organizationId }
    );

    return successResponse({
      message: `Factor '${factorId}' status updated to ${parsed.data.status}`,
      factor: updated,
    });
  } catch (error: any) {
    if (error.message?.includes("Forbidden")) {
      return errorResponse("FORBIDDEN", error.message, 403);
    }
    return errorResponse("UPDATE_FAILED", error.message || "Failed to update factor", 400);
  }
}
