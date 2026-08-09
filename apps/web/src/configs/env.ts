/**
 * Where this app reads the `VITE_*` variables it needs. One other site reads
 * `import.meta.env` directly — `utils/get-file.ts`, for a `NODE_ENV` Vite never
 * defines; that read is pinned by a test and explained there, and is not a
 * second place to add variables.
 *
 * Vite does not read these at runtime — it substitutes the literal each
 * `import.meta.env.VITE_*` had when the bundle was built, and anything not
 * prefixed `VITE_` is never exposed to the browser at all. A variable that was
 * missing at build time is therefore `undefined` in the shipped bundle, and
 * shows up as a request to "undefined/student/…" rather than as anything that
 * names the real problem. Reading them in one place, once, turns that into a
 * message that says which variable and where to put it.
 *
 * Nothing here is a secret. Everything in this file is in the bundle and
 * readable by anyone who opens the app — which is fine for both values, and is
 * the reason no third can be added without thinking about it first.
 */

/** What the app needs, and the name it is written under in `.env`. */
const REQUIRED = {
  BACKEND_URL: "VITE_BACKEND_URL",
  GOOGLE_CLIENT_ID: "VITE_GOOGLE_CLIENT_ID",
} as const;

export type Env = Record<keyof typeof REQUIRED, string>;

/**
 * Takes the source rather than reading `import.meta.env` itself, so the rules
 * can be tested against an environment this build does not have.
 */
export function readEnv(source: Record<string, unknown>): Env {
  const values = {} as Record<string, string>;
  const missing: string[] = [];

  for (const [key, variable] of Object.entries(REQUIRED)) {
    const value = source[variable];

    if (typeof value !== "string" || value === "") {
      missing.push(variable);
      continue;
    }

    values[key] = value;
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing web environment variable${missing.length > 1 ? "s" : ""}: ` +
        `${missing.join(", ")}. See apps/web/.env.example.`,
    );
  }

  return values as Env;
}

export const env = readEnv(import.meta.env);
