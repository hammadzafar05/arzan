import { getPlatformProxy } from "wrangler";
import { app } from "../worker/app";
import { resetMigrationCache } from "../worker/db/migrate";
import { devOutbox } from "../worker/email";
import type { Env } from "../worker/env";

export const ORIGIN = "http://localhost:5173";

/** A fresh app with its own in-memory D1. Each client keeps its own cookies (one "browser"). */
export async function createTestApp() {
  resetMigrationCache();
  const proxy = await getPlatformProxy<Env>({ configPath: "wrangler.jsonc", persist: false });
  const env: Env = { ...proxy.env, BETTER_AUTH_SECRET: "test-secret-0123456789abcdef0123456789abcdef" };
  let ipCounter = 1;

  function client(ip = `10.0.0.${ipCounter++}`) {
    const jar = new Map<string, string>();
    // biome-ignore lint/suspicious/noExplicitAny: test responses are asserted field by field
    async function request<T = any>(method: string, path: string, body?: unknown) {
      // x-forwarded-for is attacker-controlled; cf-connecting-ip (set by Cloudflare) must win.
      const headers: Record<string, string> = {
        Origin: ORIGIN,
        "cf-connecting-ip": ip,
        "x-forwarded-for": `172.16.${ipCounter}.${Math.floor(Math.random() * 250)}`,
      };
      if (body !== undefined) headers["Content-Type"] = "application/json";
      if (jar.size) headers.Cookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
      const res = await app.request(
        ORIGIN + path,
        { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: "manual" },
        env,
      );
      for (const c of res.headers.getSetCookie()) {
        const [pair] = c.split(";");
        const i = pair!.indexOf("=");
        const k = pair!.slice(0, i);
        const v = pair!.slice(i + 1);
        if (!v || /max-age=0/i.test(c)) jar.delete(k);
        else jar.set(k, v);
      }
      const text = await res.text();
      let json: T;
      try {
        json = JSON.parse(text) as T;
      } catch {
        json = text as T;
      }
      return { status: res.status, body: json, headers: res.headers };
    }
    return {
      request,
      // biome-ignore lint/suspicious/noExplicitAny: see above
      get: <T = any>(p: string) => request<T>("GET", p),
      // biome-ignore lint/suspicious/noExplicitAny: see above
      post: <T = any>(p: string, b: unknown = {}) => request<T>("POST", p, b),
      signUp: (email: string, password = "password123", name = "Test User") =>
        request("POST", "/api/auth/sign-up/email", { email, password, name }),
      signIn: (email: string, password = "password123") =>
        request("POST", "/api/auth/sign-in/email", { email, password }),
      clearCookies: () => jar.clear(),
    };
  }

  return { env, client, dispose: () => proxy.dispose() };
}

/** The newest email sent to `to`, and the first link in it. */
export function lastEmailTo(to: string) {
  const email = [...devOutbox].reverse().find((e) => e.to === to);
  if (!email) throw new Error(`No email sent to ${to}`);
  const link = email.text.match(/https?:\/\/\S+/)?.[0];
  return { ...email, link: link ?? "" };
}

export type TestApp = Awaited<ReturnType<typeof createTestApp>>;
