import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { AnalyticsSummary } from "@/types/analytics";

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: () => apiFetch<AnalyticsSummary>("/analytics/summary"),
  });
}
