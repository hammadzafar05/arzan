import { ServerError } from "./server-error";

export const API_RETURNED_HTML =
  "The API returned a web page instead of data. /api/* isn't reaching the Worker: check run_worker_first in wrangler.jsonc and any routes on your domain.";

/**
 * Checks what /api/auth/get-session returned. A real session is an object with `user` and
 * `session`; anything else counts as signed out. A string means an HTML page came back instead of
 * JSON (the request never reached the Worker), which is a deployment problem worth saying clearly
 * instead of crashing the app shell.
 */
export function toSession<T extends { user: unknown; session: unknown }>(data: unknown): T | null {
  if (typeof data === "string") throw new ServerError(API_RETURNED_HTML, 502);
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (!d.user || typeof d.user !== "object" || !d.session || typeof d.session !== "object") return null;
  return data as T;
}
