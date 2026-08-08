/// <reference types="vitest/config" />
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
    // Node, not jsdom. What is testable here today is pure logic — the utils —
    // and a DOM environment would only slow that down. Component tests (#19)
    // will need jsdom and can switch this then.
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // The frontend formats Thai dates and converts Buddhist-era years, so a
    // suite that inherited the machine's timezone would not mean the same
    // thing on two developers' laptops. Same reasoning as the API suite.
    env: { TZ: "UTC" },
  },
});
