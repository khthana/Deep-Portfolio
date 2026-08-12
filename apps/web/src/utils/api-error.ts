/**
 * The sentence a failed request leaves behind, and what to show when it left
 * none.
 *
 * The API answers every rejection in one envelope, `{ success: false, message
 * }`, and the message is Thai written for the person at the screen — an
 * activity with no score ratio is told so by name. Getting it there is what
 * these two are for. `apiErrorMessage` is the one that knows the envelope, and
 * it is called in exactly one place, the axios interceptor. `messageToShow` is
 * what a component calls in a `catch`, and it works whether the error came
 * straight from axios or by way of a thunk that failed.
 */

/** What the user is told when nothing that failed had anything to say. */
export const GENERIC_ERROR_MESSAGE = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";

/** A string worth showing: present, and not only spaces. Anything else is the
 *  same as nothing, because an empty toast tells the user less than the
 *  caller's own fallback does. */
function shownIfWritten(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

/**
 * The sentence in the response body, if the server sent one.
 *
 * Reads structurally rather than through `isAxiosError`, because the body is
 * whatever came back over the wire: a proxy's HTML page, a Blob from a download
 * route that answered with an error, `undefined` when the request never
 * arrived. Only an object with a non-blank string `message` is a sentence
 * somebody wrote for the caller; everything else is nothing.
 */
export function apiErrorMessage(error: unknown): string | undefined {
  const data = (error as { response?: { data?: unknown } } | null | undefined)
    ?.response?.data;

  if (typeof data !== "object" || data === null) {
    return undefined;
  }

  return shownIfWritten((data as { message?: unknown }).message);
}

/**
 * What to put in front of the user for a caught error.
 *
 * The body comes first and `message` second, which matters for a component
 * that called a service directly: there, `message` is still axios's own
 * `"Request failed with status code 400"`, which names no problem and suggests
 * no action. A rejected thunk has no body to read — `unwrap()` throws a
 * `SerializedError`, which is `name`, `message`, `stack` and `code` and nothing
 * else — so it is the second read that finds the sentence, put on the error by
 * the interceptor before Redux ever saw it.
 *
 * `fallback` is the caller's own words for its own screen, and is worth
 * passing wherever the failure has a better name than "something went wrong":
 * it is what the user sees when the network never reached the server.
 */
export function messageToShow(
  error: unknown,
  fallback: string = GENERIC_ERROR_MESSAGE,
): string {
  return (
    apiErrorMessage(error) ??
    shownIfWritten(
      (error as { message?: unknown } | null | undefined)?.message,
    ) ??
    fallback
  );
}
