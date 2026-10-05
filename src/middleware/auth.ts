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
