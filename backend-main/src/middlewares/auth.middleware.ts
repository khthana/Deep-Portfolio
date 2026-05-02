import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: any;
}

const getDecodedToken = (req: Request) => {
  const token = req.cookies.access_token;
  if (!token) return null;

  try {
    const secret = process.env.JWT_SECRET || "your_secret_key";
    return jwt.verify(token, secret) as any;
  } catch (error) {
    return null;
  }
};

export const verifyTeacher = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const decoded = getDecodedToken(req);

  if (!decoded) {
    return res.status(401).json({ message: "ไม่พบ Token หรือ Token หมดอายุ" });
  }

  try {
    const userRole = await prisma.user_roles.findFirst({
      where: {
        user_id: decoded.user_id,
        role_id: "TEACHER",
        is_active: true,
      },
    });

    if (!userRole) {
      return res
        .status(403)
        .json({ message: "สิทธิ์การเข้าถึงเฉพาะอาจารย์เท่านั้น" });
    }

    req.user = { ...decoded, current_role: userRole.role_id };
    next();
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyStudent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const decoded = getDecodedToken(req);

  if (!decoded) {
    return res.status(401).json({ message: "ไม่พบ Token หรือ Token หมดอายุ" });
  }

  try {
    const userRole = await prisma.user_roles.findFirst({
      where: {
        user_id: decoded.user_id,
        role_id: "STUDENT",
        is_active: true,
      },
    });

    if (!userRole) {
      return res
        .status(403)
        .json({ message: "สิทธิ์การเข้าถึงเฉพาะนักศึกษาเท่านั้น" });
    }

    req.user = { ...decoded, current_role: userRole.role_id };
    next();
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyAnyRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const decoded = getDecodedToken(req);
  if (!decoded) return res.status(401).json({ message: "Unauthorized" });

  req.user = decoded;
  next();
};
