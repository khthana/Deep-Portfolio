import { afterEach, describe, expect, it, vi } from "vitest";
import { TEST_SECRETS } from "./config";

/**
 * That a missing secret stops the server rather than being papered over.
 *
 * The original code read `process.env.JWT_SECRET || "secret"`, which meant a
 * deployment that forgot to set it did not fail — it came up signing and
 * verifying tokens with a value anyone could guess, and looked healthy while
 * doing it. Crashing on the way up is the whole point, so it is worth a test
 * that fails if someone reintroduces a fallback for a quiet local run.
 *
 * The module resolves everything once at import, so each case has to import it
 * afresh against a different environment.
 */

async function importEnvFresh(): Promise<typeof import("../src/config/env")> {
  vi.resetModules();
  return import("../src/config/env");
}

describe("src/config/env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws on import when JWT_SECRET is missing", async () => {
    vi.stubEnv("JWT_SECRET", "");

    await expect(importEnvFresh()).rejects.toThrow(/JWT_SECRET/);
  });

  it("throws on import when JWT_REFRESH_SECRET is missing", async () => {
    vi.stubEnv("JWT_REFRESH_SECRET", "");

    await expect(importEnvFresh()).rejects.toThrow(/JWT_REFRESH_SECRET/);
  });

  it("names every missing variable at once", async () => {
    // Deliberate: a deployment being configured for the first time gets one
    // list, rather than one restart per missing value.
    vi.stubEnv("JWT_SECRET", "");
    vi.stubEnv("DATABASE_URL", "");

    await expect(importEnvFresh()).rejects.toThrow(
      /DATABASE_URL[\s\S]*JWT_SECRET|JWT_SECRET[\s\S]*DATABASE_URL/,
    );
  });

  it("accepts no substitute for the real value", async () => {
    const { env } = await importEnvFresh();

    expect(env.JWT_SECRET).toBe(TEST_SECRETS.JWT_SECRET);
  });

  it("leaves the cookie domain unset unless it is configured", async () => {
    // Blank means host-only, which is what a local server wants. See
    // src/config/cookies.ts.
    const { env } = await importEnvFresh();

    expect(env.COOKIE_DOMAIN).toBe("");
  });
});
