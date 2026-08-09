/**
 * An error that already knows which status the caller should see, and whose
 * message was written for them.
 *
 * Being one of these is what earns a message its way out: the middleware
 * forwards the text of an `HttpError` and replaces everybody else's. The status
 * is read more widely than that, off anything carrying one — see `statusOf`.
 */
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

/**
 * The `status` an error carries, when it carries one this handler can use.
 *
 * It looks past `HttpError` because Express's own middleware refuses some
 * requests before any of ours runs — `express.json()` marks a body it cannot
 * parse 400 — and answering those 500 would say the server broke when the
 * request did. Only the status is taken from them; the wording is not.
 */
export function statusOf(error: unknown): number | undefined {
  if (error instanceof HttpError) {
    return error.status;
  }

  if (typeof error !== "object" || error === null || !("status" in error)) {
    return undefined;
  }

  const status = (error as { status: unknown }).status;

  return typeof status === "number" && status >= 400 && status <= 599
    ? status
    : undefined;
}
