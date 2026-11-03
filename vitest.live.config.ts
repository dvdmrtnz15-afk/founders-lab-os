import { defineConfig } from "vitest/config";

// Only the live tests, which call the real Claude API and cost money.
export default defineConfig({
  test: {
    include: ["**/*.live.test.ts"],
    exclude: ["**/node_modules/**"],
    testTimeout: 600_000,
  },
});
