import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestApp, lastEmailTo, ORIGIN, type TestApp } from "./helpers";

let t: TestApp;
beforeAll(async () => {
  t = await createTestApp();
});
afterAll(() => t.dispose());

describe("sign up and sign in", () => {
  it("creates an account, starts a session and protects the API", async () => {
    const browser = t.client();
    expect((await browser.get("/api/dashboard")).status).toBe(401);

    const res = await browser.signUp("ada@example.com", "password123", "Ada Lovelace");
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("ada@example.com");

    const dash = await browser.get("/api/dashboard");
    expect(dash.status).toBe(200);
    expect(dash.body.greeting).toBe("Welcome, Ada!");

    const stored = await t.env.DB.prepare(
      "SELECT a.password FROM account a JOIN user u ON u.id = a.user_id WHERE u.email = ?",
    )
      .bind("ada@example.com")
      .first<{ password: string }>();
    expect(stored?.password.startsWith("pbkdf2-sha256$")).toBe(true);
  });

  it("rejects a duplicate email and a short password", async () => {
    const browser = t.client();
    expect((await browser.signUp("ada@example.com")).status).toBeGreaterThanOrEqual(400);
    const short = await browser.signUp("short@example.com", "abc");
    expect(short.status).toBe(400);
  });

  it("signs out, rejects a wrong password, signs back in", async () => {
    const browser = t.client();
    await browser.signUp("grace@example.com");
    expect((await browser.post("/api/auth/sign-out")).status).toBe(200);
    expect((await browser.get("/api/dashboard")).status).toBe(401);

    expect((await browser.signIn("grace@example.com", "wrong-password")).status).toBe(401);
    expect((await browser.signIn("grace@example.com")).status).toBe(200);
    expect((await browser.get("/api/dashboard")).status).toBe(200);
  });
});

describe("email verification", () => {
  it("sends a link on sign-up that verifies the address", async () => {
    const browser = t.client();
    await browser.signUp("linus@example.com");
    expect((await browser.get("/api/dashboard")).body.emailVerified).toBe(false);

    const { link, subject } = lastEmailTo("linus@example.com");
    expect(subject).toMatch(/verify/i);
    const url = new URL(link);
    const res = await browser.get(url.pathname + url.search);
    expect([200, 302]).toContain(res.status);
    expect((await browser.get("/api/dashboard")).body.emailVerified).toBe(true);
  });
});

describe("password reset", () => {
  it("emails a reset link, sets a new password and signs out every session", async () => {
    const laptop = t.client();
    await laptop.signUp("margaret@example.com", "old-password-1");

    const anon = t.client();
    const req = await anon.post("/api/auth/request-password-reset", {
      email: "margaret@example.com",
      redirectTo: `${ORIGIN}/reset-password`,
    });
    expect(req.status).toBe(200);

    const { link } = lastEmailTo("margaret@example.com");
    const res = await anon.get(new URL(link).pathname + new URL(link).search);
    expect(res.status).toBe(302);
    const token = new URL(res.headers.get("location")!, ORIGIN).searchParams.get("token");
    expect(token).toBeTruthy();

    expect((await anon.post("/api/auth/reset-password", { token, newPassword: "new-password-2" })).status).toBe(200);
    expect((await laptop.get("/api/dashboard")).status).toBe(401);
    expect((await anon.signIn("margaret@example.com", "old-password-1")).status).toBe(401);
    expect((await anon.signIn("margaret@example.com", "new-password-2")).status).toBe(200);
  });

  it("does not reveal whether an email has an account", async () => {
    const res = await t.client().post("/api/auth/request-password-reset", {
      email: "nobody@example.com",
      redirectTo: `${ORIGIN}/reset-password`,
    });
    expect(res.status).toBe(200);
  });
});

describe("account settings", () => {
  it("updates the profile name", async () => {
    const browser = t.client();
    await browser.signUp("barbara@example.com", "password123", "Barbara");
    expect((await browser.post("/api/auth/update-user", { name: "Barbara Liskov" })).status).toBe(200);
    expect((await browser.get("/api/auth/get-session")).body.user.name).toBe("Barbara Liskov");
  });

  it("changes the password and can sign out other devices", async () => {
    const phone = t.client();
    await phone.signUp("edsger@example.com", "password123");
    const laptop = t.client();
    await laptop.signIn("edsger@example.com", "password123");

    const bad = await phone.post("/api/auth/change-password", {
      currentPassword: "nope-nope",
      newPassword: "x".repeat(10),
    });
    expect(bad.status).toBeGreaterThanOrEqual(400);

    const ok = await phone.post("/api/auth/change-password", {
      currentPassword: "password123",
      newPassword: "brand-new-pass",
      revokeOtherSessions: true,
    });
    expect(ok.status).toBe(200);
    expect((await phone.get("/api/dashboard")).status).toBe(200);
    expect((await laptop.get("/api/dashboard")).status).toBe(401);
  });

  it("lists sessions and revokes one", async () => {
    const phone = t.client();
    await phone.signUp("donald@example.com");
    const laptop = t.client();
    await laptop.signIn("donald@example.com");

    const list = await phone.get("/api/auth/list-sessions");
    expect(list.body).toHaveLength(2);
    const current = (await phone.get("/api/auth/get-session")).body.session.token;
    const other = list.body.find((s: { token: string }) => s.token !== current);
    expect((await phone.post("/api/auth/revoke-session", { token: other.token })).status).toBe(200);
    expect((await laptop.get("/api/dashboard")).status).toBe(401);
    expect((await phone.get("/api/dashboard")).status).toBe(200);
  });

  it("deletes the account only with the right password", async () => {
    const browser = t.client();
    await browser.signUp("alan@example.com", "password123");
    expect((await browser.post("/api/auth/delete-user", { password: "wrong-one!" })).status).toBeGreaterThanOrEqual(
      400,
    );
    expect((await browser.post("/api/auth/delete-user", { password: "password123" })).status).toBe(200);
    expect((await browser.get("/api/dashboard")).status).toBe(401);
    const row = await t.env.DB.prepare("SELECT id FROM user WHERE email = ?").bind("alan@example.com").first();
    expect(row).toBeNull();
  });
});

describe("CSRF protection", () => {
  const send = async (path: string, origin: string, contentType: string, body: string) => {
    const { app } = await import("../worker/app");
    return app.request(
      `${ORIGIN}${path}`,
      {
        method: "POST",
        headers: { Origin: origin, "Content-Type": contentType, "cf-connecting-ip": "10.5.5.5" },
        body,
      },
      t.env,
    );
  };

  it("blocks a cross-site form post to the app's own API", async () => {
    const res = await send("/api/dashboard", "https://evil.example", "application/x-www-form-urlencoded", "a=1");
    expect(res.status).toBe(403);
  });

  it("allows the same request from our own origin", async () => {
    const res = await send("/api/dashboard", ORIGIN, "text/plain", "a=1");
    expect(res.status).not.toBe(403);
  });

  it("blocks login CSRF: a hidden cross-site form posting JSON as text/plain", async () => {
    const body = JSON.stringify({ email: "ada@example.com", password: "password123" });
    const res = await send("/api/auth/sign-in/email", "https://evil.example", "text/plain", body);
    expect(res.status).toBe(403);
    expect(res.headers.getSetCookie()).toHaveLength(0);
  });

  it("sends no CORS headers, so browsers block cross-site JSON requests", async () => {
    const { app } = await import("../worker/app");
    const res = await app.request(
      `${ORIGIN}/api/auth/sign-in/email`,
      { method: "OPTIONS", headers: { Origin: "https://evil.example", "Access-Control-Request-Method": "POST" } },
      t.env,
    );
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });
});

describe("configuration", () => {
  it("explains a missing database binding (e.g. a preview without its own D1)", async () => {
    const { app } = await import("../worker/app");
    const res = await app.request("/api/health", {}, { ...t.env, DB: undefined as unknown as D1Database });
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string; message: string; code: string };
    expect(body.error).toMatch(/No database/);
    // `message` is what the Better Auth client shows; the UI uses `code` / 503 for its setup page.
    expect(body.message).toBe(body.error);
    expect(body.code).toBe("NOT_CONFIGURED");
  });

  it("refuses to run without a strong BETTER_AUTH_SECRET", async () => {
    const { app } = await import("../worker/app");
    const res = await app.request("/api/health", {}, { ...t.env, BETTER_AUTH_SECRET: "short" });
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: string }).error).toMatch(/BETTER_AUTH_SECRET/);
  });
});

describe("rate limiting", () => {
  it("blocks repeated sign-in attempts from one IP", async () => {
    const attacker = t.client("10.9.9.9");
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) statuses.push((await attacker.signIn("ada@example.com", `guess-${i}-xx`)).status);
    expect(statuses.slice(0, 5).every((s) => s === 401)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
  });

  it("doesn't rate limit (or write to D1 for) session checks on page loads", async () => {
    const browser = t.client("10.6.6.6");
    await browser.signUp("pageloads@example.com");
    const statuses = new Set<number>();
    for (let i = 0; i < 120; i++) statuses.add((await browser.get("/api/auth/get-session")).status);
    expect([...statuses]).toEqual([200]);
    const rows = await t.env.DB.prepare("SELECT COUNT(*) AS n FROM rate_limit WHERE key LIKE '%get-session%'").first<{
      n: number;
    }>();
    expect(rows?.n).toBe(0);
  });

  it("can't be bypassed by spoofing X-Forwarded-For behind Cloudflare", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      const res = await t
        .client("10.8.8.8")
        .request("POST", "/api/auth/sign-in/email", { email: "ada@example.com", password: `guess-${i}-yy` });
      statuses.push(res.status);
    }
    expect(statuses.at(-1)).toBe(429);
  });
});
