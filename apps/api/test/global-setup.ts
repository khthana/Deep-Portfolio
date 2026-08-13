import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import * as Minio from "minio";
import { emptyAndRemoveBucket } from "./bucket";
import { seedBaseline } from "./seed";
import { MINIO, POSTGRES, TEMPLATE_DATABASE, postgresUrl } from "./config";

/**
 * Runs once per `vitest` invocation, before any test file.
 *
 * Two jobs: make sure the backing containers are up, and build the template
 * database that every test file will be copied from.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const apiDir = path.resolve(here, "..");

/**
 * Set to skip `docker compose up` — for CI, where the services are provisioned
 * by the job rather than by the test run.
 */
const skipDocker = process.env.TEST_SKIP_DOCKER === "1";

function composeUp(): void {
  execFileSync(
    "docker",
    ["compose", "-f", "docker-compose.test.yml", "up", "-d", "--wait"],
    { cwd: repoRoot, stdio: "inherit" },
  );
}

async function connect(database: string): Promise<Client> {
  const client = new Client({
    host: POSTGRES.host,
    port: POSTGRES.port,
    user: POSTGRES.user,
    password: POSTGRES.password,
    database,
  });
  await client.connect();
  return client;
}

/** Neither CREATE DATABASE nor DROP DATABASE can run from inside the database
 *  it is about, so both are issued from this connection instead. */
function connectMaintenance(): Promise<Client> {
  return connect(POSTGRES.maintenanceDatabase);
}

/**
 * `--wait` returns when the container reports healthy, which is not quite the
 * same as Postgres accepting connections from outside the container. A short
 * poll closes that gap rather than letting the first test file fail on a race.
 */
async function waitForPostgres(): Promise<void> {
  const deadline = Date.now() + 60_000;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      const client = await connectMaintenance();
      await client.end();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw new Error(
    `Test Postgres never became reachable on ${POSTGRES.host}:${POSTGRES.port}. ` +
      `Last error: ${String(lastError)}`,
  );
}

async function waitForMinio(): Promise<void> {
  const client = new Minio.Client(MINIO);
  const deadline = Date.now() + 60_000;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      await client.listBuckets();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw new Error(
    `Test MinIO never became reachable on ${MINIO.endPoint}:${MINIO.port}. ` +
      `Last error: ${String(lastError)}`,
  );
}

/**
 * Rebuilt on every run rather than reused. Migrating 72 tables takes a couple
 * of seconds, and the alternative — keeping a template around between runs —
 * means a stale template silently outliving the migration that should have
 * invalidated it.
 *
 * The baseline seed goes in here rather than into each test file, so the
 * reference data is inserted once per run and arrives everywhere else as part
 * of the file copy.
 */
async function buildTemplateDatabase(): Promise<void> {
  const client = await connectMaintenance();

  try {
    await client.query(
      `DROP DATABASE IF EXISTS "${TEMPLATE_DATABASE}" WITH (FORCE)`,
    );
    await client.query(`CREATE DATABASE "${TEMPLATE_DATABASE}"`);
  } finally {
    await client.end();
  }

  // Spawned rather than imported: the Prisma CLI is not a library, and running
  // it in its own process guarantees it holds no connection to the template
  // afterwards. CREATE DATABASE ... TEMPLATE fails while anyone is connected.
  const require_ = createRequire(import.meta.url);
  const prismaCli = require_.resolve("prisma/build/index.js");

  execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    cwd: apiDir,
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: postgresUrl(TEMPLATE_DATABASE),
    },
  });

  const template = await connect(TEMPLATE_DATABASE);

  try {
    await seedBaseline(template);
  } finally {
    // Not optional: leaving this open would make every test file's
    // CREATE DATABASE ... TEMPLATE fail.
    await template.end();
  }
}

/**
 * Per-file cleanup lives in an afterAll, which does not run when a test run is
 * killed. The containers outlive the run by design, so without this the debris
 * from every interrupted run accumulates until someone notices. Safe to do
 * here: global setup finishes before the first test file starts, so nothing
 * this deletes can belong to the run about to happen.
 */
async function removeDebrisFromInterruptedRuns(): Promise<void> {
  const client = await connectMaintenance();

  try {
    const { rows } = await client.query<{ datname: string }>(
      "SELECT datname FROM pg_database WHERE datname LIKE 'dp\\_test\\_%'",
    );

    for (const { datname } of rows) {
      await client.query(`DROP DATABASE IF EXISTS "${datname}" WITH (FORCE)`);
    }
  } finally {
    await client.end();
  }

  const minio = new Minio.Client(MINIO);
  const buckets = await minio.listBuckets();

  for (const bucket of buckets) {
    if (!bucket.name.startsWith("dp-test-")) {
      continue;
    }

    await emptyAndRemoveBucket(minio, bucket.name);
  }
}

export async function setup(): Promise<void> {
  if (!skipDocker) {
    composeUp();
  }

  await Promise.all([waitForPostgres(), waitForMinio()]);
  await removeDebrisFromInterruptedRuns();
  await buildTemplateDatabase();
}

export async function teardown(): Promise<void> {
  // The containers are left running on purpose: the next run reuses them and
  // starts in about a second instead of ten. `npm run test:down` stops them.
  const client = await connectMaintenance();

  try {
    await client.query(
      `DROP DATABASE IF EXISTS "${TEMPLATE_DATABASE}" WITH (FORCE)`,
    );
  } finally {
    await client.end();
  }
}
