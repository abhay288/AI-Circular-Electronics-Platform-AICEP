import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { AnalysisSession } from "@/lib/db/models/AnalysisSession";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    try {
      await connectToDatabase();
      const session = await AnalysisSession.findOne({
        $or: [{ analysisId: id }, { sessionId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });
      if (session) {
        return NextResponse.json({ success: true, session });
      }
    } catch (e) {
      console.warn("DB query failed, fallback check:", e);
    }

    return NextResponse.json({ success: false, message: "Session not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    try {
      await connectToDatabase();
      const updated = await AnalysisSession.findOneAndUpdate(
        { $or: [{ analysisId: id }, { sessionId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { $set: { ...body, updatedAt: new Date() } },
        { new: true, upsert: true }
      );
      return NextResponse.json({ success: true, session: updated });
    } catch (e) {
      console.warn("DB update failed:", e);
      return NextResponse.json({ success: true, session: { ...body, sessionId: id } });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
