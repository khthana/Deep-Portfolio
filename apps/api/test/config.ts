/**
 * Everything the test harness needs to reach its backing services, in one
 * place. The defaults match docker-compose.test.yml; the overrides exist so CI
 * can point the suite at services it provisioned itself.
 *
 * None of these values are secret. They are placeholders for containers that
 * hold throwaway fixtures and listen on loopback only. Real secrets never have
 * a default anywhere in this repo — see src/config/env.ts.
 */

function fromEnv(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

export const POSTGRES = {
  host: fromEnv("TEST_PGHOST", "127.0.0.1"),
  port: Number(fromEnv("TEST_PGPORT", "55432")),
  user: fromEnv("TEST_PGUSER", "postgres"),
  password: fromEnv("TEST_PGPASSWORD", "test-only-not-a-real-secret"),
  /** Maintenance database. Never the target of a test — CREATE/DROP DATABASE
   *  has to be issued from a connection that is not to the database involved. */
  maintenanceDatabase: "postgres",
} as const;

/**
 * Migrated once per run, then never written to. Every test file gets its own
 * copy via CREATE DATABASE ... TEMPLATE, which Postgres does by copying files
 * rather than replaying 1,400 lines of DDL.
 */
export const TEMPLATE_DATABASE = fromEnv(
  "TEST_TEMPLATE_DB",
  "deep_portfolio_test_template",
);

export const MINIO = {
  endPoint: fromEnv("TEST_MINIO_HOST", "127.0.0.1"),
  port: Number(fromEnv("TEST_MINIO_PORT", "59000")),
  useSSL: false,
  accessKey: fromEnv("TEST_MINIO_ACCESS_KEY", "testminio"),
  secretKey: fromEnv("TEST_MINIO_SECRET_KEY", "test-only-not-a-real-secret"),
} as const;

/**
 * The secrets the application is given during a test run. They are fixed rather
 * than random so a failing test can be reproduced by hand, and the session
 * helper signs with the same value the middleware verifies with — the point
 * being that tests go through the real auth middleware rather than around it.
 */
export const TEST_SECRETS = {
  JWT_SECRET: "test-only-not-a-real-secret",
  JWT_REFRESH_SECRET: "test-only-not-a-real-refresh-secret",
} as const;

/**
 * Stands in for a real Google OAuth client id, which the suite does not need:
 * no test ever reaches Google. The identity provider is swapped for a fake one
 * (test/helpers/identity.ts), and this value exists only so that importing
 * src/config/env.ts does not fail the run for a missing variable.
 */
export const TEST_GOOGLE_CLIENT_ID =
  "test-only-not-a-real-client-id.apps.googleusercontent.com";

export function postgresUrl(database: string): string {
  const { user, password, host, port } = POSTGRES;
  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}?schema=public`;
}
