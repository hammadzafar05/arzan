import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Each test file gets its own in-memory D1 through wrangler's platform proxy.
    fileParallelism: false,
  },
});
