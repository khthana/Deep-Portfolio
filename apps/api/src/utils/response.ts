import type { Response } from "express";
import type {
  ApiError,
  ApiResponse,
  FieldError,
} from "@deep-portfolio/api-types";

/**
 * The two envelopes every endpoint answers in are declared in
 * @deep-portfolio/api-types, where the frontend reads them from too. The
 * `satisfies` clauses below are what holds this file to them.
 */
export function successResponse<T>(
  res: Response,
  data: T,
  message = "Success",
  status = 200,
) {
  res.status(status).json({
    success: true,
    message,
    data,
  } satisfies ApiResponse<T>);
}

export function errorResponse(
  res: Response,
  status: number,
  message: string,
  errors?: FieldError[],
) {
  res.status(status).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  } satisfies ApiError);
}
