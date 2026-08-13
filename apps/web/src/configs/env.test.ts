import { describe, expect, it } from "vitest";
import { readEnv } from "./env";

/**
 * `readEnv` is split out from the module's own `env` so the rules can be tested
 * without importing the app under a different environment — the values Vite
 * substitutes are fixed at build time, and this suite has exactly one build.
 *
 * What it is protecting is a build that ships with a variable missing. Vite
 * replaces `import.meta.env.VITE_X` with the literal it had at build time, so a
 * forgotten variable is not a wrong value at runtime, it is `undefined` baked
 * into the bundle — every API call goes to a URL beginning "undefined" and the
 * login button asks Google to authorise a client that does not exist.
 */

const complete = {
  VITE_BACKEND_URL: "http://localhost:4001",
  VITE_GOOGLE_CLIENT_ID: "1234.apps.googleusercontent.com",
};

describe("readEnv", () => {
  it("reads the variables the app needs", () => {
    expect(readEnv(complete)).toEqual({
      BACKEND_URL: "http://localhost:4001",
      GOOGLE_CLIENT_ID: "1234.apps.googleusercontent.com",
    });
  });

  it("names every missing variable at once, not just the first", () => {
    // One run, one list. Reporting them one at a time means finding out about
    // the second only after fixing the first and rebuilding.
    expect(() => readEnv({})).toThrow(
      /VITE_BACKEND_URL, VITE_GOOGLE_CLIENT_ID/,
    );
  });

  it("points at the file that says what to fill in", () => {
    expect(() => readEnv({})).toThrow(/\.env\.example/);
  });

  it("treats a variable that is present but blank as missing", () => {
    // How it actually goes wrong: .env is copied from .env.example, which
    // leaves VITE_GOOGLE_CLIENT_ID empty for the reader to fill in.
    expect(() => readEnv({ ...complete, VITE_GOOGLE_CLIENT_ID: "" })).toThrow(
      /VITE_GOOGLE_CLIENT_ID/,
    );
  });

  it("ignores everything else Vite puts on import.meta.env", () => {
    // MODE, DEV, PROD, BASE_URL and any other VITE_ variable a developer has
    // in their .env all arrive here. The app reads two, and reads them by name.
    expect(readEnv({ ...complete, MODE: "test", VITE_SOMETHING: "x" })).toEqual(
      {
        BACKEND_URL: "http://localhost:4001",
        GOOGLE_CLIENT_ID: "1234.apps.googleusercontent.com",
      },
    );
  });
});
