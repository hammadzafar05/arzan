import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type ServerInfo = { ok: boolean; emailEnabled: boolean };

export const serverInfoQuery = queryOptions({
  queryKey: ["server-info"],
  queryFn: () => api<ServerInfo>("/health"),
  staleTime: Number.POSITIVE_INFINITY,
});

/** True/false once known; `undefined` while loading (treat as enabled to avoid flashing warnings). */
export function useEmailEnabled(): boolean {
  const { data } = useQuery(serverInfoQuery);
  return data?.emailEnabled ?? true;
}
