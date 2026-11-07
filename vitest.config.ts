import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: { TURSO_DATABASE_URL: ":memory:" },
  },
});
