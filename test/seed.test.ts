import { spawnSync } from "node:child_process";
import { expect, test } from "vitest";

test("npm run seed refuses to touch the hosted database", () => {
  const result = spawnSync("node_modules/.bin/tsx", ["scripts/seed.ts"], {
    env: { ...process.env, TURSO_DATABASE_URL: "libsql://luminary-db.turso.io" },
    encoding: "utf8",
  });

  expect(result.status).toBe(1);
  expect(result.stderr).toContain("Refusing to seed the hosted database. This would delete every report.");
});
