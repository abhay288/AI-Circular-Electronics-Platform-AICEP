import { NextRequest } from "next/server";
import { NotificationService } from "@/services/notification.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId") || "org-default";
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const severity = searchParams.get("severity") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await NotificationService.getNotifications({
      organizationId,
      unreadOnly,
      severity,
      page,
      limit,
    });

    return successResponse(result);
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to retrieve notifications", 500);
  }
}
