import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useGetToken } from "@/lib/auth";
import type { Order, OrderCreate, OrderStatus } from "@/types/order";

const KEY = ["orders"];

export function useOrders() {
  const getToken = useGetToken();
  return useQuery({
    queryKey: KEY,
    queryFn: async () => apiFetch<Order[]>("/orders", { token: await getToken() }),
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  const getToken = useGetToken();
  return useMutation({
    mutationFn: async (body: OrderCreate) =>
      apiFetch<Order>("/orders", {
        method: "POST",
        body: JSON.stringify(body),
        token: await getToken(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  const getToken = useGetToken();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: OrderStatus }) =>
      apiFetch<Order>(`/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        token: await getToken(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
