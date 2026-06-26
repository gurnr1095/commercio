import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useGetToken } from "@/lib/auth";
import type { AnalyticsSummary } from "@/types/analytics";

export function useAnalyticsSummary() {
  const getToken = useGetToken();
  return useQuery({
    queryKey: ["analytics"],
    queryFn: async () =>
      apiFetch<AnalyticsSummary>("/analytics/summary", { token: await getToken() }),
  });
}
