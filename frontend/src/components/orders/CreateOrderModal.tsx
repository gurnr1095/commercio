import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateOrder } from "@/api/orders";
import { useCustomers } from "@/api/customers";
import { useProducts } from "@/api/products";
import { formatMoney } from "@/lib/format";

type LineItem = {
  product_id: string;
  quantity: string;
};

const EMPTY_LINE: LineItem = { product_id: "", quantity: "1" };

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CreateOrderModal({ open, onClose }: Props) {
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ ...EMPTY_LINE }]);
  const [error, setError] = useState<string | null>(null);

  const create = useCreateOrder();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();

  useEffect(() => {
    if (open) {
      setCustomerId("");
      setItems([{ ...EMPTY_LINE }]);
      setError(null);
    }
  }, [open]);

  function addLine() {
    setItems((prev) => [...prev, { ...EMPTY_LINE }]);
  }

  function removeLine(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: keyof LineItem, value: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  // Computed running total from selected products
  const runningTotal = items.reduce((sum, item) => {
    const product = products?.find((p) => p.id === Number(item.product_id));
    const qty = parseInt(item.quantity, 10);
    if (!product || isNaN(qty) || qty <= 0) return sum;
    return sum + product.price * qty;
  }, 0);

  // Products not yet selected in other rows (to avoid duplicates in UI)
  function availableProducts(currentProductId: string) {
    const selectedIds = new Set(
      items.map((i) => i.product_id).filter((id) => id && id !== currentProductId),
    );
    return (products ?? []).filter((p) => !selectedIds.has(String(p.id)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerId) return setError("Please select a customer.");

    const validItems = items.filter((i) => i.product_id && i.quantity);
    if (validItems.length === 0) return setError("Add at least one item.");

    for (const item of validItems) {
      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty < 1) return setError("All quantities must be at least 1.");
    }

    try {
      await create.mutateAsync({
        customer_id: Number(customerId),
        items: validItems.map((i) => ({
          product_id: Number(i.product_id),
          quantity: parseInt(i.quantity, 10),
        })),
      });
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg.replace("API 422: ", "").replace("API 404: ", "").replace(/^"/, "").replace(/"$/, ""));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Create Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-5">
            {/* Customer */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="o-customer">Customer *</Label>
              <select
                id="o-customer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="">Select a customer…</option>
                {(customers ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Line items */}
            <div className="flex flex-col gap-2">
              <Label>Items *</Label>
              <div className="space-y-2">
                {items.map((item, index) => {
                  const product = products?.find((p) => p.id === Number(item.product_id));
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <select
                        value={item.product_id}
                        onChange={(e) => updateLine(index, "product_id", e.target.value)}
                        className="flex-1 h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      >
                        <option value="">Select product…</option>
                        {availableProducts(item.product_id).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {p.stock_quantity} in stock
                          </option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        min="1"
                        max={product?.stock_quantity ?? undefined}
                        value={item.quantity}
                        onChange={(e) => updateLine(index, "quantity", e.target.value)}
                        className="w-20 text-center"
                        placeholder="Qty"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          className="rounded-md p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors self-start"
              >
                <Plus size={14} />
                Add item
              </button>
            </div>

            {/* Running total */}
            {runningTotal > 0 && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-500">Estimated total</span>
                <span className="font-semibold text-gray-900">{formatMoney(runningTotal)}</span>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
            )}
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={create.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
