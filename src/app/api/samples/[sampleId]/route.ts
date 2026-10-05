import { NextRequest } from "next/server";
import { SAMPLE_DATASETS } from "@/lib/data/sampleDatasets";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ sampleId: string }> }) {
  const { sampleId } = await params;
  const sample = SAMPLE_DATASETS[sampleId];

  if (!sample) {
    return errorResponse("SAMPLE_NOT_FOUND", `Sample '${sampleId}' not found`, 404);
  }

  return successResponse({ sample });
}
