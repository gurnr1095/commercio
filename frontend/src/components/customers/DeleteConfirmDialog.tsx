import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteCustomer } from "@/api/customers";
import type { Customer } from "@/types/customer";

type Props = {
  customer: Customer | null;
  onClose: () => void;
};

export default function DeleteConfirmDialog({ customer, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const del = useDeleteCustomer();

  async function handleDelete() {
    if (!customer) return;
    setError(null);
    try {
      await del.mutateAsync(customer.id);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg.replace("API 409: ", "").replace(/^"/, "").replace(/"$/, ""));
    }
  }

  return (
    <Dialog open={Boolean(customer)} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Delete Customer</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-medium text-gray-900">{customer?.name}</span>? This cannot be
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
