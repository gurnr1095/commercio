import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useGetToken } from "@/lib/auth";
import type { AnalyticsSummary } from "@/types/analytics";

export function useAnalyticsSummary(days?: number) {
  const getToken = useGetToken();
  return useQuery({
    queryKey: ["analytics", days ?? "all"],
    queryFn: async () => {
      const url = days != null ? `/analytics/summary?days=${days}` : "/analytics/summary";
      return apiFetch<AnalyticsSummary>(url, { token: await getToken() });
    },
  });
}
