import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Component } from "@/models/Component";
import { successResponse, errorResponse } from "@/lib/api-response";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ componentId: string }> }
) {
  try {
    await connectDB();
    const { componentId } = await params;

    // Search by serialNumber, _id (if valid ObjectId), or partNumber
    const query: Record<string, any> = {
      $or: [
        { serialNumber: componentId },
        { partNumber: componentId },
      ],
    };

    if (mongoose.Types.ObjectId.isValid(componentId)) {
      query.$or.push({ _id: componentId });
    }

    const component = await Component.findOne(query);
    if (!component) {
      return errorResponse("NOT_FOUND", `Component '${componentId}' not found`, 404);
    }

    return successResponse(component);
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to fetch component", 500);
  }
}
