import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests run against the source modules directly, so the Cloudflare and
// vinext plugins from `vite.config.ts` are intentionally not loaded here.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["lib/**/*.ts", "app/api/**/*.ts", "app/chatgpt-auth.ts"],
    },
  },
});
