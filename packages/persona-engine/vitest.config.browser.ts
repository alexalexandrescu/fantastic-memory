import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      headless: false, // Must run in headed mode for WebGPU support
      instances: [
        {
          browser: "chromium",
          launch: {
            args: [
              "--disable-web-security",
              "--disable-features=VizDisplayCompositor",
              "--unlimited-storage",
              "--disable-dev-shm-usage",
            ],
          },
          context: {
            ignoreHTTPSErrors: true,
          },
        },
      ],
    },
    include: ["src/**/*.e2e.test.ts"],
    globals: true,
    testTimeout: 300000, // 5 minutes for E2E tests with LLM loading
    hookTimeout: 300000,
  },
});

