import { describe, expect, it } from "vitest";
import { getFile } from "./get-file";

/**
 * The URL an attachment, a profile picture or a course material is fetched
 * from. Everything stored in MinIO is served through the API's `/files` route
 * rather than from the object store directly, so every `<img>` and `<a>` in
 * the app goes through here.
 *
 * Since ADR-0006 the API composes that whole path itself — object key, expiry
 * and signature — and this only resolves it against the API's origin. What used
 * to be built here (`files?path=` + a raw key) is gone, and with it the escaping
 * bug that came from building it by hand.
 *
 * The suite supplies VITE_BACKEND_URL through vite.config.ts, because the
 * module reads it once at import time.
 */

describe("getFile", () => {
  it("resolves the path the API handed out against the API's origin", () => {
    expect(
      getFile("/files?path=65000001%2Fprofile.png&exp=1786000000&sig=abc"),
    ).toBe(
      "http://backend.test/files?path=65000001%2Fprofile.png&exp=1786000000&sig=abc",
    );
  });

  it("leaves the signature untouched", () => {
    // The whole query is signed, so anything added or re-escaped here would be
    // answered 403. This is the case that says the helper must stay this dumb.
    const signed = "/files?path=section%2F1%2F%E0%B8%87%E0%B8%B2%E0%B8%99+%231.pdf&exp=1786000000&sig=x-_y";

    expect(getFile(signed)).toBe(`http://backend.test${signed}`);
  });

  it("passes an empty path through rather than refusing it", () => {
    // Several callers do `getFile(a.url ?? "")`, so this is a shape the helper
    // really is handed — a record whose attachment is missing. It resolves to
    // the API's root and fails as a broken image, which is what it was before.
    expect(getFile("")).toBe("http://backend.test");
  });
});
