import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", "dist"],
    testTimeout: 300000, // 5 minutes for E2E tests with LLM (Ollama can be slow)
    hookTimeout: 300000,
  },
});

