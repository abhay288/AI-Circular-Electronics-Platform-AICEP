import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Report } from "@/models/Report";
import { AnalysisSession } from "@/models/AnalysisSession";
import { generateReportId } from "@/lib/id-generator";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const { analysisId, format = "PDF" } = body;

    if (!analysisId) {
      return errorResponse("ANALYSIS_ID_REQUIRED", "analysisId is required to generate a report", 400);
    }

    const session = await AnalysisSession.findOne({
      $or: [{ analysisId }, { sessionId: analysisId }],
    });

    if (!session) {
      return errorResponse("ANALYSIS_NOT_FOUND", `Analysis session '${analysisId}' was not found`, 404);
    }

    const reportId = generateReportId(session.analysisId);

    const report = await Report.findOneAndUpdate(
      { analysisId: session.analysisId },
      {
        reportId,
        analysisId: session.analysisId,
        status: "READY",
        format,
        fileUrl: `/api/reports?analysisId=${session.analysisId}`,
        sections: [
          "Executive Summary",
          "Component Detection Breakdown",
          "High-Frequency PCB Trace Topology",
          "Degradation Physics & RUL Prediction",
          "Precious Metal Spectrometry Recovery",
          "Component Swap & Solder Refurbishment Plan",
          "Polygon Digital Product Passport Verification",
          "Scope 3 Avoided Carbon Footprint",
        ],
        summary: {
          deviceName: session.deviceName,
          overallHealthPercent: session.rulResult?.overallHealthScore || 90,
          classification: "Circularity Grade A (Industrial High-Recovery)",
          potentialValueUSD: session.metalResult?.totalEstimatedMarketValueUSD || 18.7,
          potentialValueINR: session.metalResult?.totalEstimatedMarketValueINR || 1617,
          estimatedRemainingLifeYears: session.rulResult?.predictedYears || 4.8,
          componentsDetectedCount: session.detectionResult?.componentsCount || 24,
          recommendedAction: session.repairResult?.recommendedAction || "refurbish",
        },
        version: "2.4.0",
        generatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    session.reportId = reportId;
    session.status = "COMPLETED";
    await session.save();

    return successResponse({
      reportId: report.reportId,
      status: report.status,
      format: report.format,
      generatedAt: report.generatedAt,
      report,
    });
  } catch (error: any) {
    console.error("[Report Generation Error]:", error);
    return errorResponse("PROCESSING_FAILED", error.message || "Failed to generate report", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const analysisId = searchParams.get("analysisId");

    if (!analysisId) {
      const reports = await Report.find().sort({ generatedAt: -1 }).limit(20);
      return successResponse({ reports });
    }

    const report = await Report.findOne({ analysisId });
    if (!report) {
      return errorResponse("REPORT_NOT_FOUND", `Report for analysis '${analysisId}' was not found`, 404);
    }

    return successResponse({ report });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to retrieve report", 500);
  }
}
