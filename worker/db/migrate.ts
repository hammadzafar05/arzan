/**
 * Applies drizzle/*.sql on the first request after a deploy, so deploying is the only step
 * (no `wrangler d1 migrations apply` needed, and the "Deploy to Cloudflare" button just works).
 *
 * Each migration runs in one D1 batch (one transaction) together with its bookkeeping row,
 * so it is all-or-nothing. If two isolates race, the loser's batch fails and rolls back;
 * we then see the migration as applied and carry on.
 */
import { MIGRATION_FILES } from "./migrations.gen";

export const MIGRATIONS = [...MIGRATION_FILES].sort((a, b) => a.name.localeCompare(b.name));

const split = (sql: string) =>
  sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

async function applied(db: D1Database): Promise<Set<string>> {
  const { results } = await db.prepare("SELECT name FROM _migrations").all<{ name: string }>();
  return new Set(results.map((r) => r.name));
}

export async function migrate(db: D1Database): Promise<void> {
  await db.prepare("CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)").run();
  let done = await applied(db);
  for (const m of MIGRATIONS) {
    if (done.has(m.name)) continue;
    try {
      await db.batch([
        ...split(m.sql).map((s) => db.prepare(s)),
        db.prepare("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)").bind(m.name, Date.now()),
      ]);
    } catch (err) {
      done = await applied(db);
      if (!done.has(m.name)) throw err;
    }
  }
}

let ready: Promise<void> | null = null;

/** Runs migrations once per isolate; retries on the next request if it failed. */
export function ensureMigrated(db: D1Database): Promise<void> {
  ready ??= migrate(db).catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

/** Tests: force the next request to check migrations again. */
export function resetMigrationCache() {
  ready = null;
}
