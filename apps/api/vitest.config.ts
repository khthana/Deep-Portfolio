import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],

    // Runs once per `vitest` invocation: starts the containers and migrates the
    // template database every test file is copied from.
    globalSetup: ["./test/global-setup.ts"],

    // Runs once per test file, before that file's imports. This is what gives
    // each file its own database — see the comment at the top of test/setup.ts.
    setupFiles: ["./test/setup.ts"],

    // Forks, not threads. The application under test opens Prisma connection
    // pools and reads process.env at import time; separate processes keep those
    // genuinely separate rather than sharing one process's environment.
    pool: "forks",
    isolate: true,
    fileParallelism: true,

    // Creating a database, migrating nothing, and dropping it is still slower
    // than a unit test. The default 5s timeout is not enough for the first file
    // in a cold run.
    testTimeout: 30_000,
    hookTimeout: 60_000,

    env: {
      // Set here as well as in test/setup.ts so it is in place before the
      // worker process evaluates anything at all.
      TZ: "UTC",
    },
  },
});
