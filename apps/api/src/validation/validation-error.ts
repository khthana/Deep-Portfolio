import type { FieldError } from "@deep-portfolio/api-types";
import { HttpError } from "../utils/http-error";

/**
 * A request that never reached a controller because its input was not usable.
 *
 * `message` is assembled here rather than at the point of rendering because the
 * frontend prints it as-is and reads nothing else — `errors` is for a caller
 * that wants to mark up the offending inputs, and every one of its entries is
 * already named in the sentence.
 */
export class ValidationError extends HttpError {
  readonly errors: FieldError[];

  constructor(errors: FieldError[]) {
    super(400, summarise(errors));
    this.name = "ValidationError";
    this.errors = errors;
  }
}

/**
 * What a caller is told when the request itself was not usable.
 *
 * Exported because the error middleware says the same thing for the requests
 * that never reach a schema — a body Express could not parse is the same kind
 * of refusal as a field that failed one, and should not read differently.
 */
export const HEADLINE = "ข้อมูลที่ส่งมาไม่ถูกต้อง";

function summarise(errors: FieldError[]): string {
  const sentences = errors.map(({ field, message }) =>
    field === "" ? message : `${field} ${message}`,
  );

  return sentences.length === 0
    ? HEADLINE
    : `${HEADLINE}: ${sentences.join(", ")}`;
}
