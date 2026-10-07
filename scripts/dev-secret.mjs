// Gives local dev its BETTER_AUTH_SECRET, like Laravel's `key:generate`. Runs before `npm run dev`
// and `npm run preview`. Creates .dev.vars from .dev.vars.example if it's missing, and fills in an
// empty BETTER_AUTH_SECRET. It never replaces a secret that is already set.
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const created = !existsSync(".dev.vars");
// Wrangler ignores .env once .dev.vars exists, so leave projects that use .env alone.
if (created && existsSync(".env")) process.exit(0);
const source = created ? ".dev.vars.example" : ".dev.vars";
let vars = existsSync(source) ? readFileSync(source, "utf8") : "";

const line = vars.match(/^BETTER_AUTH_SECRET=(.*)$/m);
const value = line?.[1]?.trim().replace(/^(["'])(.*)\1$/, "$2");
if (!value) {
  const secret = `BETTER_AUTH_SECRET=${randomBytes(32).toString("hex")}`;
  vars = line ? vars.replace(line[0], secret) : `${vars}${vars && !vars.endsWith("\n") ? "\n" : ""}${secret}\n`;
  console.log(`${created ? "Created" : "Updated"} .dev.vars with a random BETTER_AUTH_SECRET.`);
}
if (created || !value) writeFileSync(".dev.vars", vars);
