import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 4000,
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // Externalize Node.js-specific modules that aren't available in browser
        if (id === "node:async_hooks" || id.startsWith("node:")) {
          return true;
        }
        return false;
      },
      output: {
        // Provide empty polyfills for Node.js modules
        banner: `
          // Polyfill for Node.js async_hooks
          if (typeof window !== 'undefined') {
            try {
              // @ts-ignore
              globalThis.AsyncLocalStorage = class AsyncLocalStorage {
                constructor() {}
                run(store, callback) { return callback(); }
                getStore() { return undefined; }
                disable() {}
                enterWith() {}
                exit() {}
                static snapshot() { return 0; }
              };
            } catch (e) {}
          }
        `,
      },
    },
    // Define replacements for Node.js modules
    define: {
      "node:async_hooks": "undefined",
    },
  },
  optimizeDeps: {
    exclude: ["@langchain/langgraph", "@langchain/core"],
  },
});
