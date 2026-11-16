import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { MaterialRecovery } from "@/models/MaterialRecovery";
import { Component } from "@/models/Component";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    await connectDB();
    const { analysisId } = await params;
    const { searchParams } = new URL(req.url);
    const priorityFilter = searchParams.get("priority");
    const metalFilter = searchParams.get("metal");

    const materialDoc = await MaterialRecovery.findOne({ analysisId }).lean();
    if (!materialDoc) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Material recovery record for '${analysisId}' was not found.`,
          },
        },
        { status: 404 }
      );
    }

    let contributions = materialDoc.componentContributions || [];

    if (priorityFilter && priorityFilter !== "all") {
      contributions = contributions.filter(
        (c: any) => (c.recoveryPriority || "").toUpperCase() === priorityFilter.toUpperCase()
      );
    }

    if (metalFilter && metalFilter !== "all") {
      contributions = contributions.filter((c: any) =>
        (c.materials || []).some(
          (m: any) =>
            m.material.toLowerCase() === metalFilter.toLowerCase() ||
            m.symbol.toLowerCase() === metalFilter.toLowerCase()
        )
      );
    }

    // High priority count
    const highPriorityCount = (materialDoc.componentContributions || []).filter(
      (c: any) => c.recoveryPriority === "HIGH"
    ).length;

    return NextResponse.json({
      success: true,
      analysisId,
      totalComponents: (materialDoc.componentContributions || []).length,
      filteredCount: contributions.length,
      highPriorityCount,
      components: contributions,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: error.message || "Failed to fetch component contributions" },
      },
      { status: 500 }
    );
  }
}
