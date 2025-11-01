import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      // Run in headed mode with xvfb for WebGPU support
      // WebGPU requires a display server, so we use xvfb to provide a virtual X server
      // This allows WebGPU to work in CI/headless environments
      headless: false,
      instances: [
        {
          browser: "chromium",
          launch: {
            args: [
              "--disable-web-security",
              "--disable-features=VizDisplayCompositor",
              "--unlimited-storage",
              "--disable-dev-shm-usage",
              // Enable WebGPU with software rendering (Swiftshader)
              "--enable-features=UseSkiaRenderer,CanvasOopRasterization,Vulkan,UseAngle,WebGPU,WebGPUDeveloperFeatures",
              "--use-angle=swiftshader",
              "--use-gl=angle",
              "--enable-webgpu-developer-features",
              "--enable-unsafe-webgpu",
              "--ignore-gpu-blacklist",
              "--ignore-gpu-blocklist",
              "--enable-gpu-rasterization",
              // Additional flags for WebGPU in headless
              "--use-fake-ui-for-media-stream",
              "--autoplay-policy=no-user-gesture-required",
              // Ensure WebGPU adapter is available
              "--enable-webgpu-dawn",
            ],
          },
          context: {
            ignoreHTTPSErrors: true,
            permissions: ["webgpu"],
          },
          launchOptions: {
            // Additional options that might help
            channel: undefined,
          },
        },
      ],
    },
    include: ["src/**/*.e2e.test.ts"],
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    testTimeout: 300000, // 5 minutes for E2E tests with LLM loading
    hookTimeout: 300000,
  },
});

