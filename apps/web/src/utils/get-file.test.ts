import { describe, expect, it } from "vitest";
import { getFile } from "./get-file";

/**
 * The URL an attachment, a profile picture or a course material is fetched
 * from. Everything stored in MinIO is served through the API's `/files` route
 * rather than from the object store directly, so every `<img>` and `<a>` in
 * the app goes through here.
 *
 * The suite supplies VITE_BACKEND_URL through vite.config.ts, because the
 * module reads it once at import time.
 */

describe("getFile", () => {
  it("points at the API's files route", () => {
    expect(getFile("65000001/profile.png")).toBe(
      "http://backend.test/files?path=65000001/profile.png",
    );
  });

  it("passes an empty path through rather than refusing it", () => {
    // Several callers do `getFile(a.url ?? "")`, so this is a shape the API
    // really is asked for.
    expect(getFile("")).toBe("http://backend.test/files?path=");
  });

  it("does not escape the path", () => {
    // Pinned, not endorsed. The path is interpolated raw, so a stored name
    // containing "&" or "#" truncates the query the API receives. Every path
    // written today is composed by the API from ids, which is the only reason
    // this has not bitten.
    expect(getFile("section/1/งาน ที่ #1.pdf")).toBe(
      "http://backend.test/files?path=section/1/งาน ที่ #1.pdf",
    );
  });

  it("uses the backend URL even in a production build", () => {
    // Pinned, not endorsed. The module means to switch to a same-origin "/"
    // when built for production, but it tests `import.meta.env.NODE_ENV` —
    // which Vite never defines. Vite exposes MODE, DEV and PROD; NODE_ENV is
    // undefined in every build, so the branch is dead and the deployed app
    // always addresses VITE_BACKEND_URL. Left alone until the deployment
    // target is decided, because same-origin "/files" only works behind a
    // reverse proxy that has not been chosen yet.
    expect(getFile("a.pdf").startsWith("http://backend.test/")).toBe(true);
  });
});
