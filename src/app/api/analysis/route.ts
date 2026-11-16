import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { AnalysisSession } from "@/models/AnalysisSession";
import { CreateAnalysisSchema } from "@/lib/validation";
import { generateAnalysisId } from "@/lib/id-generator";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import { SAMPLE_DATASETS } from "@/lib/data/sampleDatasets";
import { SessionStore } from "@/lib/sessionStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const parseResult = CreateAnalysisSchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse("VALIDATION_ERROR", parseResult.error.issues[0]?.message || "Invalid analysis data", 400);
    }

    const { sourceType, mode, deviceName, deviceType, sampleId, imageUrl } = parseResult.data;
    const authUser = await getAuthUser(req);

    const analysisId = generateAnalysisId();

    // If sampleId provided, pre-populate default sample image if not provided
    let finalImage = imageUrl || "";
    let finalName = deviceName;
    let finalType = deviceType;

    if (sampleId && SAMPLE_DATASETS[sampleId]) {
      const sample = SAMPLE_DATASETS[sampleId];
      if (!finalImage) finalImage = sample.image;
      if (!finalName) finalName = sample.name;
      if (!finalType) finalType = sample.deviceType;
    }

    const sessionPayload = {
      analysisId,
      userId: authUser?.userId,
      organizationId: authUser?.organizationId,
      sourceType: sourceType.toUpperCase(),
      mode: mode.toUpperCase(),
      deviceName: finalName,
      deviceType: finalType,
      imageUrl: finalImage,
      sampleId,
      status: finalImage ? "READY" : "DRAFT",
      progress: 0,
      currentStage: "INITIALIZATION",
      stageStatuses: {
        quality: "completed",
        detection: "pending",
        pcb: "pending",
        damage: "pending",
        ocr: "pending",
        summary: "pending",
      },
    };

    // Store in fast in-memory resilient store immediately
    const memorySession = SessionStore.set(analysisId, sessionPayload);

    // Persist to MongoDB if available
    try {
      await connectDB();
      await AnalysisSession.create(sessionPayload);
    } catch (dbErr: any) {
      console.warn("[Create Analysis] MongoDB sync deferred, in-memory active:", dbErr.message);
    }

    return successResponse(
      {
        analysisId: memorySession.analysisId,
        status: memorySession.status,
        session: memorySession,
      },
      201
    );
  } catch (error: any) {
    console.error("[Create Analysis Error]:", error);
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to create analysis session", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
    const status = searchParams.get("status");

    const query: Record<string, any> = {};
    if (status) query.status = status.toUpperCase();

    const authUser = await getAuthUser(req);
    if (authUser && authUser.userId && authUser.userId !== "guest-public-user" && authUser.role !== "ADMIN") {
      query.$or = [{ userId: authUser.userId }, { userId: "guest-public-user" }];
    }

    const sessions = await AnalysisSession.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    return successResponse({ sessions });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to list analysis sessions", 500);
  }
}
