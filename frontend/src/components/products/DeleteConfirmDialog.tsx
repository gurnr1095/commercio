import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteProduct } from "@/api/products";
import type { Product } from "@/types/product";
import { useState } from "react";

type Props = {
  product: Product | null;
  onClose: () => void;
};

export default function DeleteConfirmDialog({ product, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const del = useDeleteProduct();

  async function handleDelete() {
    if (!product) return;
    setError(null);
    try {
      await del.mutateAsync(product.id);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg.replace("API 409: ", ""));
    }
  }

  return (
    <Dialog open={Boolean(product)} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Delete Product</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-medium text-gray-900">{product?.name}</span>? This cannot be
            undone.
          </p>
          {error && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={del.isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={del.isPending}>
            {del.isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
