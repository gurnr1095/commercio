import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useGetToken } from "@/lib/auth";
import type { Product, ProductCreate, ProductUpdate } from "@/types/product";

const KEY = ["products"];

export function useProducts() {
  const getToken = useGetToken();
  return useQuery({
    queryKey: KEY,
    queryFn: async () => apiFetch<Product[]>("/products", { token: await getToken() }),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  const getToken = useGetToken();
  return useMutation({
    mutationFn: async (body: ProductCreate) =>
      apiFetch<Product>("/products", {
        method: "POST",
        body: JSON.stringify(body),
        token: await getToken(),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  const getToken = useGetToken();
  return useMutation({
    mutationFn: async ({ id, ...body }: ProductUpdate & { id: number }) =>
      apiFetch<Product>(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
        token: await getToken(),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  const getToken = useGetToken();
  return useMutation({
    mutationFn: async (id: number) =>
      apiFetch<void>(`/products/${id}`, { method: "DELETE", token: await getToken() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
