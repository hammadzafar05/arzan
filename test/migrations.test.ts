import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getPlatformProxy } from "wrangler";
import { MIGRATIONS, migrate } from "../worker/db/migrate";
import type { Env } from "../worker/env";

describe("migrations", () => {
  it("bundles every drizzle/*.sql file, in order and up to date (run `npm run db:generate`)", () => {
    const files = readdirSync("drizzle")
      .filter((f) => f.endsWith(".sql"))
      .sort();
    expect(MIGRATIONS.map((m) => m.name)).toEqual(files);
    for (const m of MIGRATIONS) expect(m.sql).toBe(readFileSync(`drizzle/${m.name}`, "utf8"));
  });

  it("applies cleanly to an empty database and is safe to run twice", async () => {
    const proxy = await getPlatformProxy<Env>({ configPath: "wrangler.jsonc", persist: false });
    try {
      await migrate(proxy.env.DB);
      await migrate(proxy.env.DB);
      const { results } = await proxy.env.DB.prepare("SELECT name FROM _migrations").all();
      expect(results).toHaveLength(MIGRATIONS.length);
      const tables = await proxy.env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all<{
        name: string;
      }>();
      for (const t of ["user", "session", "account", "verification", "rate_limit"])
        expect(tables.results.map((r) => r.name)).toContain(t);
    } finally {
      await proxy.dispose();
    }
  });
});
