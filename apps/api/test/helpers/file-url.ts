import { expect } from "vitest";
import { assertSignedFileUrl } from "../../src/utils/file-url";

/**
 * Reading the addresses the API hands attachments out at.
 *
 * Since ADR-0006 a response never carries a bare object key: what comes back is
 * `/files?path=…&exp=…&sig=…`, signed and good for an hour. A case cannot
 * therefore compare against a literal — the expiry is a wall-clock second and
 * the signature moves with it — so it asks these two things instead: which file
 * is this, and is the URL one the API really signed.
 *
 * The signature is checked with the application's own verifier rather than
 * recomputed here, for the same reason the suite writes objects with the
 * application's own MinIO client: a second copy of the algorithm would agree
 * with the first one right up until it mattered.
 */

/**
 * The object key a signed URL names, having first insisted that the URL is one
 * this API issued and has not expired. Throws otherwise, so a case that reaches
 * for the key of something unsigned fails where it asked.
 */
export function signedFileKey(url: unknown): string {
  if (typeof url !== "string") {
    throw new Error(`Expected a signed /files URL, got ${JSON.stringify(url)}`);
  }

  const [route, query] = url.split("?");

  if (route !== "/files") {
    throw new Error(`Expected a URL onto /files, got "${url}"`);
  }

  const params = new URLSearchParams(query);
  const path = params.get("path") ?? "";

  assertSignedFileUrl({
    path,
    exp: params.get("exp") ?? undefined,
    sig: params.get("sig") ?? undefined,
  });

  return path;
}

/**
 * The same check as a matcher, for the cases that assert a whole response
 * object in one piece and would otherwise have to take the attachment apart.
 */
export const signedFileUrl = (objectKey: string) =>
  expect.toSatisfy((url: unknown) => {
    try {
      return signedFileKey(url) === objectKey;
    } catch {
      return false;
    }
  }, `a signed /files URL for "${objectKey}"`);
