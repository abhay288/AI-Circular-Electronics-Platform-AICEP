import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

export async function GET() {
  let dbStatus = "disconnected";
  try {
    await connectDB();
    if (mongoose.connection.readyState === 1) {
      dbStatus = "connected";
    }
  } catch {
    dbStatus = "error";
  }

  const redisStatus = process.env.REDIS_URL ? "configured" : "fallback_mode";

  return NextResponse.json({
    status: dbStatus === "connected" ? "ok" : "degraded",
    database: dbStatus,
    redis: redisStatus,
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
}
