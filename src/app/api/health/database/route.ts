import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

export async function GET() {
  const start = Date.now();
  try {
    await connectDB();
    const readyState = mongoose.connection.readyState;
    const latencyMs = Date.now() - start;

    return NextResponse.json({
      status: readyState === 1 ? "healthy" : "degraded",
      readyState,
      latencyMs,
      host: mongoose.connection.host ? "configured" : "unknown",
      name: mongoose.connection.name || "eco_intel",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Database connectivity check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
