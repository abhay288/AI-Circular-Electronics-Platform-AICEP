import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  let storageWritable = false;

  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const testFile = path.join(uploadsDir, `.health-${Date.now()}.tmp`);
    fs.writeFileSync(testFile, "ok");
    fs.unlinkSync(testFile);
    storageWritable = true;
  } catch {
    storageWritable = false;
  }

  return NextResponse.json({
    status: storageWritable ? "healthy" : "degraded",
    storageType: "local_filesystem_and_gridfs",
    writable: storageWritable,
    timestamp: new Date().toISOString(),
  });
}
