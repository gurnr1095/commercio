import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useGetToken } from "@/lib/auth";
import type { InventoryAnalysis, SalesSummary } from "@/types/ai";

export function useInventoryAnalysis() {
  const getToken = useGetToken();
  return useMutation({
    mutationFn: async () =>
      apiFetch<InventoryAnalysis>("/ai/inventory-analysis", {
        method: "POST",
        token: await getToken(),
      }),
  });
}

export function useSalesSummary() {
  const getToken = useGetToken();
  return useMutation({
    mutationFn: async () =>
      apiFetch<SalesSummary>("/ai/sales-summary", {
        method: "POST",
        token: await getToken(),
      }),
  });
}
