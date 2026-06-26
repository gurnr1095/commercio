import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { InventoryAnalysis, SalesSummary } from "@/types/ai";

export function useInventoryAnalysis() {
  return useMutation({
    mutationFn: () =>
      apiFetch<InventoryAnalysis>("/ai/inventory-analysis", { method: "POST" }),
  });
}

export function useSalesSummary() {
  return useMutation({
    mutationFn: () =>
      apiFetch<SalesSummary>("/ai/sales-summary", { method: "POST" }),
  });
}
