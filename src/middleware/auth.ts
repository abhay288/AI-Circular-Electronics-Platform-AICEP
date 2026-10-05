import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { TokenPayload } from "@/lib/jwt";
import { UserRole } from "@/models/User";

export type AuthenticatedHandler = (
  req: NextRequest,
  user: TokenPayload,
  params?: any
) => Promise<NextResponse>;

export function requireAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest, context?: any) => {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "AUTH_REQUIRED",
            message: "Authentication is required to access this resource",
          },
        },
        { status: 401 }
      );
    }

    return handler(req, user, context?.params);
  };
}

export function requireRole(allowedRoles: UserRole[], handler: AuthenticatedHandler) {
  return async (req: NextRequest, context?: any) => {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "AUTH_REQUIRED",
            message: "Authentication is required to access this resource",
          },
        },
        { status: 401 }
      );
    }

    if (!allowedRoles.includes(user.role as UserRole) && user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: `User role '${user.role}' is not authorized for this action`,
          },
        },
        { status: 403 }
      );
    }

    return handler(req, user, context?.params);
  };
}

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

    // If session is demo or unassigned, allow read access
    if (session.mode === "DEMO" || !session.userId) {
      return handler(req, session, user);
    }

    // If session has an owner, require auth and verify ownership or ADMIN role
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_REQUIRED", message: "Authentication required to access this session" } },
        { status: 401 }
      );
    }

    if (String(session.userId) !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "You do not have access to this analysis session" } },
        { status: 403 }
      );
    }

    return handler(req, session, user);
  };
}

