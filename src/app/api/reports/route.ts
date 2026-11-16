import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Report, ReportType } from "@/models/Report";
import { AnalysisSession } from "@/models/AnalysisSession";
import { ReportService } from "@/services/reporting/report.service";
import { enqueueReportJob } from "@/queues/report.queue";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const {
      analysisId,
      reportType = "ASSET",
      format = "PDF",
      organizationId = "org-default",
      generatedBy = "system",
      async = false,
      branding,
    } = body;

    if (reportType !== "EXECUTIVE" && !analysisId) {
      return errorResponse("ANALYSIS_ID_REQUIRED", "analysisId is required for this report type", 400);
    }

    if (analysisId) {
      const session = await AnalysisSession.findOne({
        $or: [{ analysisId }, { sessionId: analysisId }],
      });
      if (!session) {
        return errorResponse("ANALYSIS_NOT_FOUND", `Analysis session '${analysisId}' was not found`, 404);
      }
    }

    if (async) {
      const enqueued = await enqueueReportJob({
        analysisId,
        organizationId,
        reportType: reportType as ReportType,
        format,
        generatedBy,
      });

      return successResponse({
        status: "GENERATING",
        message: "Report generation job queued successfully.",
        jobId: enqueued.jobId,
      });
    }

    // Direct synchronous generation via ReportService
    let report;
    switch (reportType) {
      case "TECHNICAL":
        report = await ReportService.generateTechnicalReport(analysisId, { organizationId, format, generatedBy, branding });
        break;
      case "CIRCULARITY":
        report = await ReportService.generateCircularityReport(analysisId, { organizationId, format, generatedBy, branding });
        break;
      case "ENVIRONMENTAL":
        report = await ReportService.generateEnvironmentalReport(analysisId, { organizationId, format, generatedBy, branding });
        break;
      case "EXECUTIVE":
        report = await ReportService.generateExecutiveReport(organizationId, { format, generatedBy, branding });
        break;
      case "ASSET":
      default:
        report = await ReportService.generateAssetReport(analysisId, { organizationId, format, generatedBy, branding });
        break;
    }

    return successResponse({
      reportId: report.reportId,
      status: report.status,
      format: report.format,
      version: report.version,
      completeness: report.completeness,
      generatedAt: report.generatedAt,
      report,
    });
  } catch (error: any) {
    console.error("[Report Generation API Error]:", error);
    return errorResponse("PROCESSING_FAILED", error.message || "Failed to generate report", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const analysisId = searchParams.get("analysisId");
    const organizationId = searchParams.get("organizationId");
    const reportType = searchParams.get("reportType");
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (analysisId) query.analysisId = analysisId;
    if (organizationId && organizationId !== "all") query.organizationId = organizationId;
    if (reportType && reportType !== "all") query.reportType = reportType;
    if (status && status !== "all") query.status = status;

    const [total, reports] = await Promise.all([
      Report.countDocuments(query),
      Report.find(query)
        .sort({ generatedAt: -1, version: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return successResponse({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to retrieve reports", 500);
  }
}
