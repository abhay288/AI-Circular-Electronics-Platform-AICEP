import bcrypt from "bcryptjs";
import { verifyAccessToken, TokenPayload } from "@/lib/jwt";
import { NextRequest } from "next/server";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function extractAuthToken(req: Request | NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Also check cookies if present
  if ("cookies" in req && typeof (req as any).cookies?.get === "function") {
    const cookieToken = (req as any).cookies.get("token")?.value;
    if (cookieToken) return cookieToken;
  }

  return null;
}

export async function getAuthUser(req: Request | NextRequest): Promise<TokenPayload | null> {
  const token = extractAuthToken(req);
  if (!token) return null;
  return verifyAccessToken(token);
}
