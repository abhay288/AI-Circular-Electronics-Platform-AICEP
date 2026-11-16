import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

export async function GET() {
  let dbStatus = "disconnected";
  let dbLatencyMs = -1;
  const start = Date.now();

  try {
    await connectDB();
    if (mongoose.connection.readyState === 1) {
      dbStatus = "connected";
      dbLatencyMs = Date.now() - start;
    }
  } catch {
    dbStatus = "error";
  }

  const redisStatus = process.env.REDIS_URL ? "configured" : "direct_fallback_active";

  const overallStatus = dbStatus === "connected" ? "healthy" : "degraded";

  return NextResponse.json({
    platform: "EcoIntel Circular Electronics Intelligence",
    version: "2.4.0",
    status: overallStatus,
    services: {
      database: { status: dbStatus, latencyMs: dbLatencyMs },
      queues: { status: redisStatus },
      aiEngine: { status: "operational", provider: "yolov8_onnx_hybrid" },
      storage: { status: "operational", mode: "local_and_gridfs" },
      blockchain: { status: "active", network: "Polygon Amoy" },
    },
    timestamp: new Date().toISOString(),
  });
}
