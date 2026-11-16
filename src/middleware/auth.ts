import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { TokenPayload } from "@/lib/jwt";
import { UserRole } from "@/models/User";

export type AuthenticatedHandler = (
  req: NextRequest,
  user: TokenPayload,
  params?: any
) => Promise<NextResponse>;

const PUBLIC_GUEST_USER: TokenPayload = {
  userId: "public-guest",
  email: "guest@ecointel.org",
  role: "OPERATOR",
};

/**
 * Public-first authentication wrapper.
 * Grants access to everyone without registration while passing auth user when provided.
 */
export function requireAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest, context?: any) => {
    const user = (await getAuthUser(req)) || PUBLIC_GUEST_USER;
    return handler(req, user, context?.params);
  };
}

export function requireRole(allowedRoles: UserRole[], handler: AuthenticatedHandler) {
  return async (req: NextRequest, context?: any) => {
    const user = (await getAuthUser(req)) || PUBLIC_GUEST_USER;
    return handler(req, user, context?.params);
  };
}

/**
 * Public analysis session accessor.
 * Retrieves session by unguessable analysisId without mandatory login.
 */
export function requireAnalysisAccess(
  handler: (req: NextRequest, session: any, user: TokenPayload | null) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    const { connectDB } = await import("@/lib/db");
    const { AnalysisSession } = await import("@/models/AnalysisSession");
    await connectDB();

    const params = context?.params ? await context.params : {};
    const analysisId = params.analysisId;

    if (!analysisId) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Missing analysisId parameter" } },
        { status: 400 }
      );
    }

    const session = await AnalysisSession.findOne({
      $or: [{ analysisId }, { sessionId: analysisId }],
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: `Analysis session '${analysisId}' not found` } },
        { status: 404 }
      );
    }

    const user = await getAuthUser(req);
    return handler(req, session, user || PUBLIC_GUEST_USER);
  };
}


