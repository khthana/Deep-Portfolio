import { NextFunction, Request, Response } from "express";
import { NO_SESSION, sessionUserId } from "../middlewares/auth.middleware";
import AuthService from "../services/auth.service";
import { identityProvider } from "../services/identity.service";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { sessionCookieOptions } from "../config/cookies";
import { errorResponse, successResponse } from "../utils/response";
import { validated } from "../validation/validate";
import { googleLoginBody } from "../validation/identity.schema";

/** Google would not vouch for the token: expired, tampered with, or not ours. */
const GOOGLE_REJECTED = "ยืนยันตัวตนกับ Google ไม่สำเร็จ";

/**
 * Google knows them, this system does not. Says what to do about it, because
 * there is nothing the person can fix by trying again — accounts are created
 * by whoever maintains the user list, not by logging in.
 */
const NOT_REGISTERED =
  "ไม่พบบัญชีผู้ใช้ของอีเมลนี้ในระบบ กรุณาติดต่อผู้ดูแลระบบ";

export default class AuthController {
  private readonly authService = new AuthService();

  constructor() {
    this.authService = new AuthService();
  }

  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user_id = sessionUserId(req);

      const userDetail = await this.authService.getUserDetail(user_id);
      if (!userDetail) {
        return errorResponse(res, 404, "ไม่พบข้อมูลผู้ใช้งาน");
      }

      successResponse(res, userDetail, "Fetched user successfully");
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response) {
    // Cleared with exactly the attributes googleLogin set them with. Anything
    // else is a no-op that looks like a logout.
    res.clearCookie("access_token", sessionCookieOptions());
    res.clearCookie("refresh_token", sessionCookieOptions());

    successResponse(res, undefined, "Logout successful");
  }

  /**
   * Trades a Google ID token for a session of ours.
   *
   * Two questions, asked in this order and never merged: Google answers who
   * the caller is, and the `users` table answers whether that person may come
   * in. A verified address that is not in `users` is refused — no row is
   * created, because `user_id` is a VarChar(8) issued by the university and
   * this server has no business making one up.
   *
   * The session itself does not change shape: the same httpOnly access/refresh
   * pair as before, and roles still read live from `user_roles` on every
   * request. Nothing about who-may-do-what moved into the token.
   */
  async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { credential } = validated(req, googleLoginBody);

      const identity = await identityProvider().verifyIdToken(credential);

      if (!identity) {
        return errorResponse(res, 401, GOOGLE_REJECTED);
      }

      const user = await this.authService.findUserByEmail(identity.email);

      if (!user) {
        return errorResponse(res, 403, NOT_REGISTERED);
      }

      // user_id only. The role used to ride along in the access token and was
      // never read — requireRole re-reads user_roles, because a claim minted
      // fifteen minutes ago is not authorisation.
      const accessToken = jwt.sign({ user_id: user.user_id }, env.JWT_SECRET, {
        expiresIn: "15m",
      });

      const refreshToken = jwt.sign(
        { user_id: user.user_id },
        env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" },
      );

      res.cookie("access_token", accessToken, sessionCookieOptions());
      res.cookie("refresh_token", refreshToken, sessionCookieOptions());

      successResponse(res, undefined, "login successful");
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return errorResponse(res, 401, NO_SESSION);
    }

    try {
      // Verified, then read as a payload of our own making — the only tokens
      // that get past jwt.verify are ones this server signed, and it signs
      // exactly this shape. `as any` here used to make decoded.anything legal.
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
        user_id: string;
      };

      const newAccessToken = jwt.sign(
        { user_id: decoded.user_id },
        env.JWT_SECRET,
        { expiresIn: "15m" },
      );

      // Setting it is enough — a cookie of the same name, domain and path
      // replaces the old one. The clearCookie that used to run first cleared a
      // different domain, and the replacement was then set without a path, so
      // it landed scoped to /auth/refresh and was never sent to anything else.
      res.cookie("access_token", newAccessToken, sessionCookieOptions());

      successResponse(res, undefined, "Refreshed session successfully");
    } catch {
      errorResponse(res, 401, NO_SESSION);
    }
  }
}
