import { NextResponse } from "next/server";

export async function GET() {
  const isRedisConfigured = Boolean(process.env.REDIS_URL);

  const queueNames = [
    "detection",
    "pcb",
    "rul",
    "material",
    "repair",
    "carbon",
    "report",
  ];

  const queues = queueNames.map((name) => ({
    name,
    mode: isRedisConfigured ? "redis_bullmq" : "in_process_fallback",
    status: "ready",
  }));

  return NextResponse.json({
    status: "healthy",
    redisConfigured: isRedisConfigured,
    fallbackSupport: "active",
    queues,
    timestamp: new Date().toISOString(),
  });
}
