import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { connectDB } from "@/lib/db";
import { ReportService } from "@/services/reporting/report.service";
import { Report, IReport } from "@/models/Report";
import { REPORT_QUEUE_NAME, ReportJobData } from "./report.queue";

/**
 * Direct execution worker runner (handles queue jobs or direct invocation).
 */
export async function runReportWorkerJob(data: ReportJobData): Promise<IReport> {
  await connectDB();
  const { analysisId, organizationId = "org-default", reportType = "ASSET", format = "PDF", generatedBy = "system" } = data;

  try {
    let report: IReport;

    switch (reportType) {
      case "TECHNICAL":
        if (!analysisId) throw new Error("analysisId required for TECHNICAL report");
        report = await ReportService.generateTechnicalReport(analysisId, { organizationId, format, generatedBy });
        break;
      case "CIRCULARITY":
        if (!analysisId) throw new Error("analysisId required for CIRCULARITY report");
        report = await ReportService.generateCircularityReport(analysisId, { organizationId, format, generatedBy });
        break;
      case "ENVIRONMENTAL":
        if (!analysisId) throw new Error("analysisId required for ENVIRONMENTAL report");
        report = await ReportService.generateEnvironmentalReport(analysisId, { organizationId, format, generatedBy });
        break;
      case "EXECUTIVE":
        report = await ReportService.generateExecutiveReport(organizationId, { format, generatedBy });
        break;
      case "ASSET":
      default:
        if (!analysisId) throw new Error("analysisId required for ASSET report");
        report = await ReportService.generateAssetReport(analysisId, { organizationId, format, generatedBy });
        break;
    }

    return report;
  } catch (error: any) {
    console.error(`[Report Worker Job Failed] Analysis: ${analysisId}, Type: ${reportType}:`, error.message);
    if (data.reportId) {
      await Report.updateOne({ reportId: data.reportId }, { $set: { status: "FAILED" } });
    }
    throw error;
  }
}

let reportWorkerInstance: Worker | null = null;

export function initReportWorker(): Worker | null {
  const REDIS_URL = process.env.REDIS_URL;
  if (!REDIS_URL) {
    return null;
  }

  if (!reportWorkerInstance) {
    const connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    reportWorkerInstance = new Worker<ReportJobData>(
      REPORT_QUEUE_NAME,
      async (job: Job<ReportJobData>) => {
        return runReportWorkerJob(job.data);
      },
      {
        connection,
        concurrency: 3,
      }
    );

    reportWorkerInstance.on("completed", (job) => {
      console.log(`[BullMQ ReportWorker] Job ${job.id} completed successfully.`);
    });

    reportWorkerInstance.on("failed", (job, err) => {
      console.error(`[BullMQ ReportWorker] Job ${job?.id} failed:`, err.message);
    });
  }

  return reportWorkerInstance;
}
