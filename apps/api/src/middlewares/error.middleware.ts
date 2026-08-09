import { NextFunction, Request, Response } from "express";
import { HttpError, statusOf } from "../utils/http-error";
import { HEADLINE, ValidationError } from "../validation/validation-error";
import { errorResponse } from "../utils/response";

/**
 * The last handler in the chain, and the only place a failure becomes a
 * response.
 *
 * Two rules it exists to keep. Every error leaves in the same envelope as every
 * other, so a caller can read `message` without first working out which layer
 * refused it. And nothing internal leaves with it: the stack trace, the SQL a
 * Prisma error quotes, and the message of an error nobody meant to show a user
 * all stay in the log. A 500 says only that the server failed — the detail is
 * on the server, where the person who can act on it is.
 */

/** What a caller is told when the failure was not one the code anticipated. */
const UNEXPECTED = "เกิดข้อผิดพลาดภายในระบบ";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error("Error:", err);

  if (err instanceof ValidationError) {
    return errorResponse(res, err.status, err.message, err.errors);
  }

  const status = statusOf(err) ?? 500;

  errorResponse(res, status, messageFor(err, status));
}

/**
 * The sentence that leaves with the response.
 *
 * A message is safe to forward only when somebody wrote it for the caller,
 * which is what `HttpError` says and nothing else does. A status alone is not
 * enough: `express.json()` refuses a malformed body with a 400 of its own, and
 * that status is worth keeping — but its message quotes the bytes it choked on,
 * so the caller would be shown a fragment of their own request in English. A
 * 4xx nobody authored gets the same headline a failed schema does, because it
 * is the same news: the request could not be read.
 */
function messageFor(err: unknown, status: number): string {
  if (err instanceof HttpError) {
    return err.message;
  }

  return status < 500 ? HEADLINE : UNEXPECTED;
}

/*
 * A stack trace used to be attached to every response whenever NODE_ENV was
 * "development", and the message of any error at all was forwarded whatever it
 * said. The first made the shape of an error response depend on the deployment
 * it came from, so no caller could be written against one shape; the second
 * sent Prisma's account of the failing query, table names and all, to whoever
 * had triggered it. Development still gets both, from the console.error above,
 * where no client can read them.
 */
