/**
 * The sentence a failed request leaves behind, and what to show when it left
 * none.
 *
 * The API answers every rejection in one envelope, `{ success: false, message
 * }`, and the message is Thai written for the person at the screen — an
 * activity with no score ratio is told so by name. Getting it there is what
 * these two are for, and between them they hold one invariant:
 *
 * > After a request fails, `error.message` is the API's own sentence, or it is
 * > empty. It is never a string axios wrote.
 *
 * `messageToCarry` establishes that, in the response interceptor, which is the
 * last place the body still exists. `messageToShow` is what a component calls
 * in a `catch`, and it can be one line because of it. Every service in this app
 * calls through `axiosInstance`, so there is no failed request that skips the
 * first step.
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
function apiErrorMessage(error: unknown): string | undefined {
  const data = (error as { response?: { data?: unknown } } | null | undefined)
    ?.response?.data;

  if (typeof data !== "object" || data === null) {
    return undefined;
  }

  return shownIfWritten((data as { message?: unknown }).message);
}

/**
 * The message a failed request carries onward: the sentence from the body, or
 * the empty string.
 *
 * The empty string is the half with teeth. A request that never reached the
 * server is an `AxiosError` saying `"Network Error"`, a timeout says `"timeout
 * of 5000ms exceeded"`, and a proxy answering with an HTML page gives
 * `"Request failed with status code 502"`. All three are English written for a
 * developer, none of them tells the user anything to do, and once `unwrap()`
 * has thrown away the body there is nothing left downstream to tell them apart
 * from a sentence the API meant for the screen. So the caller replaces the
 * message outright rather than only filling it in.
 *
 * Erasing it costs nothing that matters: `code` says in one token
 * (`ERR_NETWORK`, `ECONNABORTED`) what the English said in a phrase, and it,
 * the status, the stack and the whole response stay on the error for the log.
 * What it buys is that a reader downstream needs no rule beyond "empty means
 * the API had nothing to say" — including a reader that predates this file and
 * writes `error.message || "…"` for itself.
 */
export function messageToCarry(error: unknown): string {
  return apiErrorMessage(error) ?? "";
}

/**
 * What to put in front of the user for a caught error.
 *
 * One read, because of the invariant above: whatever survives on `message` is
 * either the API's sentence or an error thrown by hand in the app itself, and
 * both are Thai meant for this screen. What axios wrote is already gone.
 *
 * `fallback` is the caller's own words for its own screen, and is worth passing
 * wherever the failure has a better name than "something went wrong": it is
 * what the user sees when the request never reached the server.
 */
export function messageToShow(
  error: unknown,
  fallback: string = GENERIC_ERROR_MESSAGE,
): string {
  return (
    shownIfWritten(
      (error as { message?: unknown } | null | undefined)?.message,
    ) ?? fallback
  );
}
