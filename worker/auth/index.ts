import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { appConfig } from "../../shared/config";
import { getDb, schema } from "../db";
import { sendEmail } from "../email";
import * as templates from "../email/templates";
import type { Env } from "../env";
import { hashPassword, verifyPassword } from "./password";

/**
 * Better Auth for this request's Worker bindings and origin, created once per isolate and
 * reused (building it costs CPU, and a protected request needs it twice).
 * Docs: https://www.better-auth.com/docs
 */
const cache = new WeakMap<Env, Map<string, ReturnType<typeof buildAuth>>>();

export function createAuth(env: Env, request: Request) {
  const origin = new URL(request.url).origin;
  let byOrigin = cache.get(env);
  if (!byOrigin) {
    byOrigin = new Map();
    cache.set(env, byOrigin);
  }
  let auth = byOrigin.get(origin);
  if (!auth) {
    auth = buildAuth(env, origin);
    byOrigin.set(origin, auth);
  }
  return auth;
}

function buildAuth(env: Env, origin: string) {
  return betterAuth({
    appName: appConfig.name,
    baseURL: origin,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [origin],
    database: drizzleAdapter(getDb(env.DB), { provider: "sqlite", schema }),

    emailAndPassword: {
      enabled: true,
      minPasswordLength: appConfig.minPasswordLength,
      requireEmailVerification: appConfig.requireEmailVerification,
      revokeSessionsOnPasswordReset: true,
      password: { hash: hashPassword, verify: verifyPassword },
      sendResetPassword: async ({ user, url }) => sendEmail(env, templates.resetPassword(user.email, url), origin),
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => sendEmail(env, templates.verifyEmail(user.email, url), origin),
    },
    user: { deleteUser: { enabled: true } },

    // Stored in D1 so limits hold across Worker isolates. Tighter limits on credential endpoints.
    rateLimit: {
      enabled: true,
      storage: "database",
      modelName: "rateLimit",
      window: 60,
      max: 100,
      customRules: {
        // Session checks run on every page load; limiting them would cost a D1 write each.
        "/get-session": false,
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 5 },
        "/request-password-reset": { window: 60, max: 3 },
        "/send-verification-email": { window: 60, max: 3 },
      },
    },
    advanced: {
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"] },
      database: { generateId: () => crypto.randomUUID() },
    },
  });
}

export type Auth = ReturnType<typeof buildAuth>;
export type SessionUser = Auth["$Infer"]["Session"]["user"];
