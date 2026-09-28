import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { createAuth } from "./auth";
import type { AppEnv } from "./env";

/** Rejects the request with 401 unless there is a valid session; sets c.var.user. */
export const requireUser = createMiddleware<AppEnv>(async (c, next) => {
  const session = await createAuth(c.env, c.req.raw).api.getSession({ headers: c.req.raw.headers });
  if (!session) throw new HTTPException(401, { message: "Please sign in to continue." });
  c.set("user", session.user);
  await next();
});
