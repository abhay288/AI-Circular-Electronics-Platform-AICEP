import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { AnalysisSession } from "@/lib/db/models/AnalysisSession";

// In-memory fallback if MongoDB connection fails or in local development
const memorySessions = new Map<string, any>();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const sessionId = searchParams.get("sessionId");

    try {
      await connectToDatabase();
      if (sessionId) {
        const session = await AnalysisSession.findOne({ sessionId });
        if (session) return NextResponse.json({ success: true, session });
      } else {
        const sessions = await AnalysisSession.find().sort({ createdAt: -1 }).limit(limit);
        return NextResponse.json({ success: true, sessions });
      }
    } catch (dbErr) {
      console.warn("MongoDB connection warning in GET /api/sessions, using fallback cache:", dbErr);
    }

    if (sessionId) {
      const cached = memorySessions.get(sessionId);
      if (cached) return NextResponse.json({ success: true, session: cached });
      return NextResponse.json({ success: false, message: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      sessions: Array.from(memorySessions.values()).slice(0, limit),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId = body.sessionId || `ECI-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const sessionPayload = {
      ...body,
      sessionId,
      updatedAt: new Date(),
      createdAt: body.createdAt || new Date(),
    };

    memorySessions.set(sessionId, sessionPayload);

    try {
      await connectToDatabase();
      const updated = await AnalysisSession.findOneAndUpdate(
        { sessionId },
        { $set: sessionPayload },
        { upsert: true, new: true }
      );
      return NextResponse.json({ success: true, session: updated });
    } catch (dbErr) {
      console.warn("MongoDB connection warning in POST /api/sessions, stored in cache:", dbErr);
      return NextResponse.json({ success: true, session: sessionPayload });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save session" },
      { status: 500 }
    );
  }
}
