import { configDefaults, defineConfig } from "vitest/config";

// Live tests call paid APIs. They never run in `pnpm test` or CI; run them
// deliberately with `pnpm test:live` (see vitest.live.config.ts).
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "**/*.live.test.ts"],
  },
});
