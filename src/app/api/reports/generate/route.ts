import { NextRequest } from "next/server";
import { POST as mainReportPost } from "../route";

export async function POST(req: NextRequest) {
  return mainReportPost(req);
}
