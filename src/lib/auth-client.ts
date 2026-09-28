import { queryOptions } from "@tanstack/react-query";
import { createAuthClient } from "better-auth/react";
import { ServerError } from "./server-error";
import { toSession } from "./session";

/** Better Auth client. Talks to /api/auth on the same origin. */
export const authClient = createAuthClient();

export type Session = typeof authClient.$Infer.Session;

export { ServerError };

export const sessionQuery = queryOptions({
  queryKey: ["session"],
  queryFn: async (): Promise<Session | null> => {
    const { data, error } = await authClient.getSession();
    if (error) {
      throw new ServerError(error.message || error.statusText || `Request failed (${error.status})`, error.status);
    }
    // Guard the shape: a bad response must redirect to login or show a clear error, never crash.
    return toSession<Session>(data);
  },
  staleTime: 60_000,
  // A misconfigured server won't fix itself on retry; show the problem straight away.
  retry: (count, err) => !(err instanceof ServerError && err.status === 503) && count < 1,
});

/**
 * Call after anything that changes who is signed in (sign-in, sign-up, profile update).
 * Fetches the session now, so route guards see the new state immediately.
 */
export function refreshSession(queryClient: import("@tanstack/react-query").QueryClient) {
  return queryClient.fetchQuery({ ...sessionQuery, staleTime: 0 });
}
