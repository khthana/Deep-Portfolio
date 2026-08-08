import express, { NextFunction, Request, Response } from "express";
import UserService from "../services/user.service";
import { sessionUserId } from "../middlewares/auth.middleware";
import AuthService from "../services/auth.service";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { sessionCookieOptions } from "../config/cookies";

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
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้งาน" });
      }
      res.status(200).json({
        success: true,
        message: "Fetched user successfully",
        data: userDetail,
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response) {
    // The SSO cookie belongs to DEEP Core's domain, not this API's, so this
    // line has never actually removed it — a server can only clear cookies for
    // itself. Left in place until the SSO path goes away with Google OAuth (D3).
    res.clearCookie("token", {
      path: "/",
      httpOnly: true,
      secure: env.isProduction,
      domain: ".deep-core.net",
      sameSite: "lax",
    });

    // Cleared with exactly the attributes ssoLogin set them with. Anything else
    // is a no-op that looks like a logout.
    res.clearCookie("access_token", sessionCookieOptions());
    res.clearCookie("refresh_token", sessionCookieOptions());

    return res.status(200).json({ message: "Logout successful" });
  }

  async ssoLogin(req: Request, res: Response) {
    const coreToken = req.cookies.token;

    // console.log("coreToken: ", coreToken);
    if (!coreToken) {
      return res.status(401).json({ message: "No SSO token" });
    }

    try {
      const decoded = jwt.verify(
        coreToken,
        env.DEEP_CORE_SECRET,
      ) as any;

      const accessToken = jwt.sign(
        { user_id: decoded.user_id, role: decoded.role },
        env.JWT_SECRET,
        { expiresIn: "15m" },
      );

      const refreshToken = jwt.sign(
        { user_id: decoded.user_id },
        env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" },
      );

      res.cookie("access_token", accessToken, sessionCookieOptions());
      res.cookie("refresh_token", refreshToken, sessionCookieOptions());

      return res.status(200).json({ message: "login successful" });
    } catch (err) {
      return res.status(401).json({ message: "Invalid SSO token" });
    }
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token" });
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        env.JWT_REFRESH_SECRET,
      ) as any;

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

      return res.json({ success: true });
    } catch {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
  }
}
