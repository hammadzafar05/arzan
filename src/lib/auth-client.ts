import { queryOptions } from "@tanstack/react-query";
import { createAuthClient } from "better-auth/react";

/** Better Auth client. Talks to /api/auth on the same origin. */
export const authClient = createAuthClient();

export type Session = typeof authClient.$Infer.Session;

/** An API error that carries the HTTP status (e.g. 503 = this deployment isn't set up). */
export class ServerError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export const sessionQuery = queryOptions({
  queryKey: ["session"],
  queryFn: async (): Promise<Session | null> => {
    const { data, error } = await authClient.getSession();
    if (error) {
      throw new ServerError(error.message || error.statusText || `Request failed (${error.status})`, error.status);
    }
    return data ?? null;
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
