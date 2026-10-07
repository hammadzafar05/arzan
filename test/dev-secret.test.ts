import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const script = resolve("scripts/dev-secret.mjs");
let dir: string;
const run = () => execFileSync(process.execPath, [script], { cwd: dir, encoding: "utf8" });
const devVars = () => readFileSync(join(dir, ".dev.vars"), "utf8");
const secretIn = (text: string) => text.match(/^BETTER_AUTH_SECRET=(.*)$/m)?.[1];

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "dev-secret-"));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("npm run dev prepares .dev.vars", () => {
  it("creates it from .dev.vars.example with a random secret, keeping the other settings", () => {
    copyFileSync(".dev.vars.example", join(dir, ".dev.vars.example"));
    expect(run()).toContain("Created .dev.vars");
    expect(secretIn(devVars())).toMatch(/^[0-9a-f]{64}$/);
    expect(devVars()).toContain('EMAIL_FROM="Arzan <onboarding@resend.dev>"');
  });

  it("fills in an empty secret, and gives every app its own", () => {
    writeFileSync(join(dir, ".dev.vars"), 'BETTER_AUTH_SECRET=""\nRESEND_API_KEY=\n');
    run();
    const first = secretIn(devVars());
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(devVars()).toContain("RESEND_API_KEY=");

    writeFileSync(join(dir, ".dev.vars"), "BETTER_AUTH_SECRET=\n");
    run();
    expect(secretIn(devVars())).not.toBe(first);
  });

  it("never replaces a secret that is already set", () => {
    const vars = 'BETTER_AUTH_SECRET="my-own-secret-0123456789abcdef0123456789"\n';
    writeFileSync(join(dir, ".dev.vars"), vars);
    expect(run()).toBe("");
    expect(devVars()).toBe(vars);
  });

  it("leaves a project that keeps its settings in .env alone", () => {
    copyFileSync(".dev.vars.example", join(dir, ".dev.vars.example"));
    writeFileSync(join(dir, ".env"), "BETTER_AUTH_SECRET=from-dot-env-0123456789abcdef0123456789\n");
    expect(run()).toBe("");
    expect(existsSync(join(dir, ".dev.vars"))).toBe(false);
  });
});
