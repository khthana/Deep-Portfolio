import dotenv from "dotenv";

dotenv.config();

/**
 * The single place this application reads process.env.
 *
 * Everything is resolved and validated once, when this module is first
 * imported — which happens during startup, before the server listens. A
 * misconfigured deployment therefore fails immediately with a list of what is
 * missing, instead of failing later on whichever request happens to touch the
 * missing value first.
 *
 * Secrets never have a fallback. A default secret turns a misconfigured
 * deployment into a silently insecure one: tokens keep being signed and
 * verified, just with a value an attacker can guess. Crashing is the safer
 * outcome. See D5 in docs/spec-refactor-redeploy.md.
 */

const missing: string[] = [];

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    missing.push(name);
    return "";
  }

  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

function optionalNumber(name: string, fallback: number): number {
  const value = process.env[name];

  if (value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    throw new Error(
      `Environment variable ${name} must be an integer, got "${value}".`,
    );
  }

  return parsed;
}

/**
 * Deliberately no default. Every previous call site compared process.env.NODE_ENV
 * against a literal, so an unset NODE_ENV was neither production nor development
 * — and that is the safe reading: the error handler does not leak stack traces,
 * and cookies are not marked secure on a plain-http localhost. Defaulting this
 * to "development" would start leaking stack traces from any deployment that
 * forgot to set it.
 */
const NODE_ENV = optional("NODE_ENV", "");

export const env = {
  NODE_ENV,
  isProduction: NODE_ENV === "production",
  isDevelopment: NODE_ENV === "development",

  PORT: optionalNumber("PORT", 4001),

  /** Origin allowed by CORS, and the base of links sent in invite emails. */
  CLIENT_URL: optional("CLIENT_URL", "http://localhost:3000"),

  /** Read by Prisma itself; validated here so startup fails with a clear message. */
  DATABASE_URL: required("DATABASE_URL"),

  JWT_SECRET: required("JWT_SECRET"),
  JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET"),

  /**
   * Domain attribute of the session cookies. Blank means host-only, which is
   * what a local server wants — see src/config/cookies.ts for why this is one
   * value rather than one at each call site.
   */
  COOKIE_DOMAIN: optional("COOKIE_DOMAIN", ""),

  /** Verifies the SSO cookie minted by DEEP Core. Goes away with Google OAuth (D3). */
  DEEP_CORE_SECRET: required("DEEP_CORE_SECRET"),

  MINIO_ENDPOINT: required("MINIO_ENDPOINT"),
  MINIO_ACCESS_KEY: required("MINIO_ACCESS_KEY"),
  MINIO_SECRET_KEY: required("MINIO_SECRET_KEY"),
  MINIO_PORT: optionalNumber("MINIO_PORT", 9000),
  MINIO_BUCKET: optional("MINIO_BUCKET", "deep-portfolio"),

  /**
   * Presigned URLs come back pointing at the in-network MinIO host, which a
   * browser cannot resolve. INTERNAL is rewritten to PUBLIC before returning.
   */
  MINIO_INTERNAL_HOST: required("MINIO_INTERNAL_HOST"),
  MINIO_PUBLIC_HOST: required("MINIO_PUBLIC_HOST"),

  /**
   * Optional on purpose. Group-invite emails are sent inside a try/catch, so
   * leaving these blank means invites are never delivered — it does not stop a
   * group from being created, and must not stop the server from starting.
   */
  EMAIL_USER: optional("EMAIL_USER", ""),
  EMAIL_PASS: optional("EMAIL_PASS", ""),
} as const;

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variable${missing.length > 1 ? "s" : ""}: ` +
      `${missing.join(", ")}. See apps/api/.env.example.`,
  );
}
