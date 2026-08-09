import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";
import { errorResponse } from "../utils/response";
import { env } from "../config/env";

/**
 * Authentication and authorisation for every protected route.
 *
 * There used to be one middleware per role — verifyTeacher and verifyStudent,
 * the same twenty lines twice with the role name changed. Adding a third role
 * meant a third copy, and a fix to one copy was a fix to one copy. `requireRole`
 * takes the roles as arguments instead (D3).
 *
 * The rule the whole file turns on: a token is a claim about who is asking, not
 * a grant of what they may do. Both middlewares below re-read the database for
 * the request they are handling, so a token whose payload says role: "TEACHER"
 * gets exactly as far as the user_roles table says it should.
 */

/** What a verified session puts on the request. */
export interface AuthenticatedUser {
  /** users.user_id. */
  user_id: string;
  /**
   * Whatever the login flow copied into the token. Kept because controllers
   * read it, but never consulted when deciding whether a request is allowed.
   */
  role?: string;
  /**
   * The role that satisfied `requireRole` on this request. Absent under
   * `requireUser`, which does not ask for one.
   */
  current_role?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * The signed-in user's id, for a controller that is behind one of the
 * middlewares below.
 *
 * Both of them set req.user before calling next(), so its absence here is not a
 * request that failed authentication — those never reach a controller. It is a
 * route mounted without its middleware, which is a wiring mistake, and turning
 * it into a 401 would hide it behind a plausible-looking response.
 */
export function sessionUserId(req: Request): string {
  const user = (req as AuthRequest).user;

  if (!user) {
    throw new Error(
      "No session on the request — this route is missing requireUser or requireRole.",
    );
  }

  return user.user_id;
}

/**
 * Shown when there is no usable session at all — missing, expired, or forged.
 * Exported because /auth/refresh refuses on the same grounds and used to say so
 * in English, in its own words.
 */
export const NO_SESSION = "ไม่พบ Token หรือ Token หมดอายุ";

/**
 * Rejection messages reach the user as-is, so they are Thai and they name the
 * role rather than saying "forbidden". The generic line covers a route that
 * accepts several roles, where no single one of these sentences is true.
 */
const ROLE_DENIED: Record<string, string> = {
  TEACHER: "สิทธิ์การเข้าถึงเฉพาะอาจารย์เท่านั้น",
  STUDENT: "สิทธิ์การเข้าถึงเฉพาะนักศึกษาเท่านั้น",
};

function roleDeniedMessage(roles: readonly string[]): string {
  const only = roles.length === 1 ? ROLE_DENIED[roles[0]] : undefined;
  return only ?? "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้";
}

/**
 * Verifies the access-token cookie and returns who it says is asking, or null
 * for anything that is not a token this server signed and that has not expired.
 *
 * A malformed or absent user_id is a null too: everything downstream uses it as
 * a primary key, and "undefined" is not one.
 */
function readSession(req: Request): AuthenticatedUser | null {
  const token = req.cookies?.access_token;

  if (!token) {
    return null;
  }

  try {
    const claims = jwt.verify(token, env.JWT_SECRET) as Record<string, unknown>;
    const userId = claims.user_id;

    if (typeof userId !== "string" && typeof userId !== "number") {
      return null;
    }

    return {
      user_id: String(userId),
      role: typeof claims.role === "string" ? claims.role : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Signed in as somebody who actually exists, with no particular role required.
 *
 * The existence check is the point. Verifying the signature only proves this
 * server minted the token; it says nothing about whether the account it names
 * is still there. Without the lookup, a token for a deleted user stays a valid
 * session until it expires, and every controller behind this middleware has to
 * cope with a user_id that resolves to nothing.
 */
export const requireUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const session = readSession(req);

  if (!session) {
    return errorResponse(res, 401, NO_SESSION);
  }

  try {
    const user = await prisma.users.findUnique({
      where: { user_id: session.user_id },
      select: { user_id: true },
    });

    if (!user) {
      return errorResponse(res, 401, NO_SESSION);
    }

    req.user = session;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Signed in and holding at least one of the named roles, active.
 *
 *     router.get("/list", requireRole("TEACHER"), controller.list);
 *
 * The role lookup doubles as the existence check `requireUser` makes
 * explicitly: user_roles.user_id is a foreign key, so a row can only exist for
 * a user who does.
 */
export function requireRole(...roles: string[]) {
  if (roles.length === 0) {
    throw new Error("requireRole needs at least one role.");
  }

  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const session = readSession(req);

    if (!session) {
      return errorResponse(res, 401, NO_SESSION);
    }

    try {
      const granted = await prisma.user_roles.findFirst({
        where: {
          user_id: session.user_id,
          role_id: { in: roles },
          is_active: true,
        },
        select: { role_id: true },
      });

      if (!granted) {
        return errorResponse(res, 403, roleDeniedMessage(roles));
      }

      // role_id is nullable in the schema, but a null cannot have matched the
      // `in` filter above, so this branch is unreachable in practice.
      req.user = { ...session, current_role: granted.role_id ?? undefined };
      next();
    } catch (error) {
      next(error);
    }
  };
}
