import { type Context, Hono } from "hono";
import { csrf } from "hono/csrf";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import { createAuth } from "./auth";
import { ensureMigrated } from "./db/migrate";
import { emailEnabled } from "./email";
import type { AppEnv } from "./env";
import { requireUser } from "./middleware";
import { dashboardRoutes } from "./routes/dashboard";

/** 503 for a deployment that isn't set up. `message` is what Better Auth's client surfaces. */
const notConfigured = (c: Context<AppEnv>, message: string) =>
  c.json({ error: message, message, code: "NOT_CONFIGURED" }, 503);

const api = new Hono<AppEnv>()
  .use(async (c, next) => {
    // Preview deployments don't inherit bindings; see "previews" in wrangler.jsonc.
    if (!c.env.DB) {
      return notConfigured(c, "No database is connected to this deployment. Add a D1 binding named DB.");
    }
    if (!c.env.BETTER_AUTH_SECRET || c.env.BETTER_AUTH_SECRET.length < 32) {
      console.error("BETTER_AUTH_SECRET is missing or shorter than 32 characters.");
      return notConfigured(c, "The BETTER_AUTH_SECRET secret isn't set (it needs 32+ characters).");
    }
    await ensureMigrated(c.env.DB);
    c.header("Cache-Control", "no-store");
    await next();
  })
  // Blocks cross-site form posts (the only cross-site writes a browser sends without a CORS
  // preflight). Cross-site JSON requests are already blocked because the API sends no CORS headers.
  .use(csrf())
  // Public info the UI needs before sign-in (e.g. whether emails can be delivered).
  .get("/health", (c) => c.json({ ok: true, emailEnabled: emailEnabled(c.env, new URL(c.req.url).origin) }))
  // Every Better Auth endpoint: sign-up, sign-in, sessions, password reset, verification...
  .on(["GET", "POST"], "/auth/*", (c) => createAuth(c.env, c.req.raw).handler(c.req.raw))
  // Everything below needs a signed-in user.
  .use(requireUser)
  .route("/dashboard", dashboardRoutes);

export const app = new Hono<AppEnv>()
  .use("/api/*", secureHeaders())
  .route("/api", api)
  .notFound((c) => c.json({ error: "Not found" }, 404))
  .onError((err, c) => {
    if (err instanceof HTTPException) return c.json({ error: err.message }, err.status);
    console.error(err);
    return c.json({ error: "Something went wrong. Please try again." }, 500);
  });

/** Typed API routes, for `hc<AppType>()` clients. */
export type AppType = typeof api;
