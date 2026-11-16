import { NextRequest } from "next/server";
import { NotificationService } from "@/services/notification.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const organizationId = body.organizationId || "org-default";
    const count = await NotificationService.markAllAsRead(organizationId);
    return successResponse({ markedReadCount: count });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to mark notifications read", 500);
  }
}
