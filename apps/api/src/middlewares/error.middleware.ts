import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Error:", err);

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    success: false,
    message,
    error: env.isDevelopment ? err.stack : undefined,
  });
}
