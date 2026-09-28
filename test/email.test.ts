import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { app } from "../worker/app";
import { devOutbox } from "../worker/email";
import { createTestApp, type TestApp } from "./helpers";

const PROD = "https://myapp.example.workers.dev";
let t: TestApp;
beforeAll(async () => {
  t = await createTestApp();
});
afterAll(() => t.dispose());
afterEach(() => vi.restoreAllMocks());

function prodRequest(path: string, body: unknown, env = t.env) {
  return app.request(
    `${PROD}${path}`,
    {
      method: "POST",
      headers: {
        Origin: PROD,
        "Content-Type": "application/json",
        "cf-connecting-ip": `10.4.${Math.floor(Math.random() * 250)}.1`,
      },
      body: JSON.stringify(body),
    },
    env,
  );
}

describe("email on a deployed site", () => {
  it("reports whether email can be delivered", async () => {
    const health = async (url: string, env = t.env) =>
      (await app.request(url, {}, env)).json() as Promise<{ emailEnabled: boolean }>;
    expect((await health("http://localhost:5173/api/health")).emailEnabled).toBe(true);
    expect((await health(`${PROD}/api/health`)).emailEnabled).toBe(false);
    expect((await health(`${PROD}/api/health`, { ...t.env, RESEND_API_KEY: "re_test" })).emailEnabled).toBe(true);
  });

  it("without a provider: never puts reset links in logs, and doesn't reveal whether the account exists", async () => {
    const logs: string[] = [];
    for (const level of ["log", "warn", "error", "info"] as const)
      vi.spyOn(console, level).mockImplementation((...args: unknown[]) => void logs.push(args.join(" ")));
    const before = devOutbox.length;

    expect(
      (await prodRequest("/api/auth/sign-up/email", { name: "P", email: "prod@example.com", password: "password123" }))
        .status,
    ).toBe(200);
    const res = await prodRequest("/api/auth/request-password-reset", {
      email: "prod@example.com",
      redirectTo: `${PROD}/reset-password`,
    });
    expect(res.status).toBe(200);

    expect(devOutbox.length).toBe(before);
    const joined = logs.join("\n");
    expect(joined).not.toMatch(/token=|reset-password\/|verify-email\?/);
    expect(joined).toMatch(/RESEND_API_KEY/);
  });

  it("with RESEND_API_KEY: sends through Resend with the configured sender", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: "email_1" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const env = { ...t.env, RESEND_API_KEY: "re_test_key", EMAIL_FROM: "Acme <hi@acme.test>" };
    const res = await prodRequest(
      "/api/auth/request-password-reset",
      { email: "prod@example.com", redirectTo: `${PROD}/reset-password` },
      env,
    );
    vi.unstubAllGlobals();
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test_key");
    const payload = JSON.parse(String(init.body));
    expect(payload).toMatchObject({ from: "Acme <hi@acme.test>", to: "prod@example.com" });
    expect(payload.text).toContain(`${PROD}/api/auth/reset-password/`);
  });
});
