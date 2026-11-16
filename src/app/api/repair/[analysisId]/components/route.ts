import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import RepairAssessment from "@/models/RepairAssessment";
import AnalysisSession from "@/models/AnalysisSession";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    await connectDB();
    const authUser = await getAuthUser(req);
    const { analysisId } = await params;

    const session = await AnalysisSession.findOne({
      $or: [{ analysisId }, { sessionId: analysisId }],
    });

    if (!session) {
      return NextResponse.json(
        { error: `Analysis session '${analysisId}' not found` },
        { status: 404 }
      );
    }

    if (
      authUser &&
      authUser.role !== "ADMIN" &&
      session.organizationId &&
      authUser.organizationId &&
      String(session.organizationId) !== String(authUser.organizationId)
    ) {
      return NextResponse.json(
        { error: "Forbidden: Access denied to foreign organization analysis" },
        { status: 403 }
      );
    }

    const assessment = await RepairAssessment.findOne({ analysisId: session.analysisId });
    if (!assessment) {
      return NextResponse.json(
        { error: "Repair assessment not found for this session" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const repairability = searchParams.get("repairability");
    const priority = searchParams.get("priority");
    const componentId = searchParams.get("componentId");

    let components = assessment.componentAssessments || [];

    if (repairability) {
      components = components.filter(
        (c) => c.repairability.toUpperCase() === repairability.toUpperCase()
      );
    }

    if (priority) {
      components = components.filter(
        (c) => c.priority.toUpperCase() === priority.toUpperCase()
      );
    }

    if (componentId) {
      components = components.filter(
        (c) => c.componentId.toLowerCase() === componentId.toLowerCase()
      );
    }

    return NextResponse.json({
      success: true,
      analysisId: session.analysisId,
      total: components.length,
      components,
    });
  } catch (err: any) {
    console.error("[API Repair Components GET Error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch component assessments" },
      { status: 500 }
    );
  }
}
