export interface Env {
  DB: D1Database;
  /** Random string, at least 32 characters. `npx wrangler secret put BETTER_AUTH_SECRET` */
  BETTER_AUTH_SECRET: string;
  /** Optional. When set, emails are sent through Resend; otherwise they are printed to the log. */
  RESEND_API_KEY?: string;
  /** Optional. Sender for outgoing email, e.g. "Acme <hello@acme.com>". */
  EMAIL_FROM?: string;
}

export type AppEnv = {
  Bindings: Env;
  Variables: { user: import("./auth").SessionUser | null };
};
