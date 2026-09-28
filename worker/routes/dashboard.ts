import { Hono } from "hono";
import type { AppEnv } from "../env";

/** Example protected route. Replace with your app's own API. */
export const dashboardRoutes = new Hono<AppEnv>().get("/", (c) => {
  const user = c.get("user")!;
  return c.json({
    greeting: `Welcome back, ${user.name.split(" ")[0]}!`,
    memberSince: user.createdAt,
    emailVerified: user.emailVerified,
  });
});
