import type { Response } from "express";
import type { FieldError } from "../validation/validation-error";

/**
 * The two envelopes every endpoint answers in.
 *
 * `success` is the field a caller branches on, and it is present either way —
 * before #20 a rejection from the auth middleware had no `success` at all while
 * one from the error handler did, so the frontend could not read a response
 * without knowing which layer had produced it.
 */
export type ApiResponse<T> = {
  success: true;
  message: string;
  data?: T;
};

export type ApiError = {
  success: false;
  message: string;
  /** Present only when the request was refused field by field. */
  errors?: FieldError[];
};

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
