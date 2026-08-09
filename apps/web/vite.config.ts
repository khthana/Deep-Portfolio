import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    strictPort: true,
  },
  test: {
    // Node, not jsdom. What this suite covers is pure logic — the utils and
    // the slice reducers — and a DOM environment would only slow that down.
    // Component tests are deliberately out of scope; whoever adds them will
    // need jsdom and can switch this then.
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    env: {
      // One zone for everyone, as in the API suite, so a failure reads the
      // same on two developers' laptops. The date cases do not lean on it —
      // they are written from local parts and pass under Bangkok, New York and
      // Kiritimati alike — which is what #19 asked for.
      TZ: "UTC",
      // Read at module load by src/configs/env.ts, which every module that
      // wants either of them goes through — and which throws when one is
      // missing, so a test importing anything downstream of it needs both.
      // Named here rather than left to a local .env so the suite states the
      // values it asserts against.
      VITE_BACKEND_URL: "http://backend.test",
      VITE_GOOGLE_CLIENT_ID: "test-client-id.apps.googleusercontent.com",
    },
  },
});
