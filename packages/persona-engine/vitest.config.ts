import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", "dist", "**/*.e2e.test.ts"],
    testTimeout: 120000, // 2 minutes for E2E tests with LLM
    hookTimeout: 120000,
  },
});

