import { SAMPLE_DATASETS } from "@/lib/data/sampleDatasets";
import { successResponse } from "@/lib/api-response";

export async function GET() {
  const samples = Object.values(SAMPLE_DATASETS).map((s) => ({
    sampleId: s.id,
    name: s.name,
    deviceType: s.deviceType,
    category: s.category,
    componentCount: s.componentCount,
    imageUrl: s.image,
    description: s.description,
    hardwareSpecs: s.hardwareSpecs,
  }));

  return successResponse({ samples });
}
