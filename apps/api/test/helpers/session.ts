import jwt from "jsonwebtoken";
import { TEST_SECRETS } from "../config";

/**
 * Mints the same cookie the application mints, signed with the same secret the
 * application verifies with.
 *
 * There is deliberately no way to skip authentication in this suite. A test
 * that stubs out the middleware proves the controller works for a request the
 * middleware would have rejected — which is the failure mode worth catching.
 * Everything here goes through the real middleware; the shortcut is only that
 * the token is minted directly instead of by logging in, which every test in
 * auth.test.ts does the long way round.
 *
 * Note that a token alone is not authorisation: requireRole looks the role up
 * in user_roles, so a test that needs one has to insert the row as well.
 */

interface SessionOptions {
  /** users.user_id — VarChar(8). */
  userId: string;
  /** Copied into the payload by the real login flow. Not consulted by the
   *  middleware, which re-reads the role from the database. */
  role?: string;
  /** Anything jsonwebtoken accepts: "15m", "-1s" for an already-expired token. */
  expiresIn?: string;
  /** Sign with something other than the real secret, to test rejection. */
  secret?: string;
}

/** The raw JWT. Use this when the test needs the token itself. */
export function signAccessToken({
  userId,
  role,
  expiresIn = "15m",
  secret = TEST_SECRETS.JWT_SECRET,
}: SessionOptions): string {
  return jwt.sign({ user_id: userId, role }, secret, {
    expiresIn,
  } as jwt.SignOptions);
}

/**
 * A Cookie header value, ready for supertest:
 *
 *     await request(app).get("/auth").set("Cookie", sessionCookie({ userId }));
 */
export function sessionCookie(options: SessionOptions): string {
  return `access_token=${signAccessToken(options)}`;
}

/** The refresh cookie, for the POST /auth/refresh path. */
export function refreshCookie(options: Omit<SessionOptions, "role">): string {
  const {
    userId,
    expiresIn = "7d",
    secret = TEST_SECRETS.JWT_REFRESH_SECRET,
  } = options;

  const token = jwt.sign({ user_id: userId }, secret, {
    expiresIn,
  } as jwt.SignOptions);

  return `refresh_token=${token}`;
}
