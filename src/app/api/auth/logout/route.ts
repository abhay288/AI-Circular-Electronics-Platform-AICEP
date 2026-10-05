import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";

export async function POST() {
  const res = successResponse({ message: "Successfully logged out" });
  res.cookies.delete("token");
  return res;
}
