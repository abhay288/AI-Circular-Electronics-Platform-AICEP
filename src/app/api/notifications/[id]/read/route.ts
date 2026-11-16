import { NextRequest } from "next/server";
import { NotificationService } from "@/services/notification.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updated = await NotificationService.markAsRead(id);
    return successResponse({ success: updated, notificationId: id });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to mark notification as read", 500);
  }
}
