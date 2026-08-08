import { randomBytes } from "node:crypto";
import { afterAll } from "vitest";
import { Client } from "pg";
import * as Minio from "minio";
import { emptyAndRemoveBucket } from "./bucket";
import {
  MINIO,
  POSTGRES,
  TEMPLATE_DATABASE,
  TEST_GOOGLE_CLIENT_ID,
  TEST_SECRETS,
  postgresUrl,
} from "./config";

/**
 * Runs once per test file, before that file's own imports are evaluated. That
 * ordering is the whole point: src/config/env.ts validates process.env the
 * first time it is imported, and all three `new PrismaClient()` sites read
 * DATABASE_URL at construction. Setting the environment here — and awaiting the
 * database creation at the top level — means the application under test is
 * built against this file's private database, with no need for the application
 * to know it is being tested.
 *
 * Isolation is per file, not per test. Cheaper, and it matches how the suite
 * runs: files in parallel, tests within a file in order.
 */

/** Suffix shared by this file's database and bucket, so the two are traceable
 *  to each other in a stuck container. */
const runId = randomBytes(6).toString("hex");

const DATABASE_NAME = `dp_test_${runId}`;
const BUCKET_NAME = `dp-test-${runId}`;

/**
 * An arbitrary but fixed key. Postgres refuses CREATE DATABASE ... TEMPLATE
 * while any other session is connected to the template, and every test file
 * starts by connecting to the same one — so without this, files racing at
 * startup knock each other over. The lock is held for the length of one file
 * copy, which is milliseconds.
 */
const TEMPLATE_LOCK_KEY = 8_675_309;

async function withMaintenanceClient<T>(
  fn: (client: Client) => Promise<T>,
): Promise<T> {
  const client = new Client({
    host: POSTGRES.host,
    port: POSTGRES.port,
    user: POSTGRES.user,
    password: POSTGRES.password,
    database: POSTGRES.maintenanceDatabase,
  });

  await client.connect();

  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function createDatabaseFromTemplate(): Promise<void> {
  await withMaintenanceClient(async (client) => {
    await client.query("SELECT pg_advisory_lock($1)", [TEMPLATE_LOCK_KEY]);

    try {
      await client.query(
        `CREATE DATABASE "${DATABASE_NAME}" TEMPLATE "${TEMPLATE_DATABASE}"`,
      );
    } finally {
      await client.query("SELECT pg_advisory_unlock($1)", [TEMPLATE_LOCK_KEY]);
    }
  });
}

async function dropDatabase(): Promise<void> {
  await withMaintenanceClient(async (client) => {
    // FORCE terminates whatever is still attached. Prisma's pool does not
    // always close instantly, and a leaked connection would otherwise leave the
    // database behind forever.
    await client.query(`DROP DATABASE IF EXISTS "${DATABASE_NAME}" WITH (FORCE)`);
  });
}

const minio = new Minio.Client(MINIO);

// Every variable src/config/env.ts requires, set before anything imports it.
// dotenv does not overwrite what is already in process.env, so a developer's
// apps/api/.env cannot bleed into a test run.
process.env.TZ = "UTC";
// Neither "production" nor "development". Both branches in the code are about
// how a deployed server behaves — cookie domains, stack traces in responses —
// and a test asserting either would be asserting the deployment, not the app.
process.env.NODE_ENV = "test";
process.env.CLIENT_URL = "http://localhost:3000";
process.env.JWT_SECRET = TEST_SECRETS.JWT_SECRET;
process.env.JWT_REFRESH_SECRET = TEST_SECRETS.JWT_REFRESH_SECRET;
process.env.GOOGLE_CLIENT_ID = TEST_GOOGLE_CLIENT_ID;
process.env.MINIO_ENDPOINT = MINIO.endPoint;
process.env.MINIO_PORT = String(MINIO.port);
process.env.MINIO_ACCESS_KEY = MINIO.accessKey;
process.env.MINIO_SECRET_KEY = MINIO.secretKey;
process.env.MINIO_BUCKET = BUCKET_NAME;
// Identical on purpose: the suite talks to MinIO over the published port, so
// there is no in-network address to rewrite. A test that wants to prove the
// INTERNAL -> PUBLIC rewrite happens should override these itself.
process.env.MINIO_INTERNAL_HOST = `${MINIO.endPoint}:${MINIO.port}`;
process.env.MINIO_PUBLIC_HOST = `${MINIO.endPoint}:${MINIO.port}`;
process.env.EMAIL_USER = "";
process.env.EMAIL_PASS = "";

await Promise.all([
  createDatabaseFromTemplate(),
  minio.makeBucket(BUCKET_NAME, "us-east-1"),
]);

process.env.DATABASE_URL = postgresUrl(DATABASE_NAME);

// Nothing is exported. A test that needs the database or the bucket should
// reach them the way the application does — src/config/prisma and
// src/config/minio are already pointed here by the variables set above.

afterAll(async () => {
  // Dynamic, and after the fact: a static import here would construct a
  // PrismaClient before DATABASE_URL is set, in every test file, including the
  // ones that never touch the database.
  const { default: prisma } = await import("../src/config/prisma");
  await prisma.$disconnect();

  await Promise.all([
    dropDatabase(),
    emptyAndRemoveBucket(minio, BUCKET_NAME),
  ]);
});
