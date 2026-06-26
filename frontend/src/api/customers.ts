import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useGetToken } from "@/lib/auth";
import type { Customer, CustomerCreate, CustomerUpdate } from "@/types/customer";

const KEY = ["customers"];

export function useCustomers() {
  const getToken = useGetToken();
  return useQuery({
    queryKey: KEY,
    queryFn: async () => apiFetch<Customer[]>("/customers", { token: await getToken() }),
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  const getToken = useGetToken();
  return useMutation({
    mutationFn: async (body: CustomerCreate) =>
      apiFetch<Customer>("/customers", {
        method: "POST",
        body: JSON.stringify(body),
        token: await getToken(),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  const getToken = useGetToken();
  return useMutation({
    mutationFn: async ({ id, ...body }: CustomerUpdate & { id: number }) =>
      apiFetch<Customer>(`/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
        token: await getToken(),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  const getToken = useGetToken();
  return useMutation({
    mutationFn: async (id: number) =>
      apiFetch<void>(`/customers/${id}`, { method: "DELETE", token: await getToken() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
