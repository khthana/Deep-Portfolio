import express, { NextFunction, Request, Response } from "express";
import UserService from "../services/user.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import AuthService from "../services/auth.service";
import jwt from "jsonwebtoken";

export default class AuthController {
  private readonly authService = new AuthService();

  constructor() {
    this.authService = new AuthService();
  }

  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user_id = (req as AuthRequest).user?.user_id;

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
    res.clearCookie("token", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      domain: ".deep-core.net",
      sameSite: "lax",
    });
    res.clearCookie("access_token", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      domain: "portfolio-api.deep-core.net",
      sameSite: "lax",
    });
    res.clearCookie("refresh_token", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      domain: "portfolio-api.deep-core.net",
      sameSite: "lax",
    });

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
        process.env.DEEP_CORE_SECRET!,
      ) as any;

      const accessToken = jwt.sign(
        { user_id: decoded.user_id, role: decoded.role },
        process.env.JWT_SECRET!,
        { expiresIn: "15m" },
      );

      const refreshToken = jwt.sign(
        { user_id: decoded.user_id },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: "7d" },
      );

      res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",

        sameSite: "lax",
        domain:
          process.env.NODE_ENV === "production"
            ? "portfolio-api.deep-core.net"
            : "localhost",
        path: "/",
      });

      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",

        sameSite: "lax",
        domain:
          process.env.NODE_ENV === "production"
            ? "portfolio-api.deep-core.net"
            : "localhost",
        path: "/",
      });

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
        process.env.JWT_REFRESH_SECRET!,
      ) as any;

      res.clearCookie("access_token", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        domain: "portfolio-api.deep-core.net",
        sameSite: "lax",
      });

      const newAccessToken = jwt.sign(
        { user_id: decoded.user_id },
        process.env.JWT_SECRET!,
        { expiresIn: "15m" },
      );

      res.cookie("access_token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        domain:
          process.env.NODE_ENV === "production"
            ? "portfolio-api.deep-core.net"
            : "localhost",
      });

      return res.json({ success: true });
    } catch {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
  }
}
