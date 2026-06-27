import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { useCreateProduct, useUpdateProduct } from "@/api/products";
import type { Product } from "@/types/product";

type FormState = {
  name: string;
  sku: string;
  description: string;
  price: string;
  cost: string;
  stock_quantity: string;
  reorder_threshold: string;
  category: string;
  image_url: string;
};

const EMPTY: FormState = {
  name: "",
  sku: "",
  description: "",
  price: "",
  cost: "",
  stock_quantity: "0",
  reorder_threshold: "10",
  category: "",
  image_url: "",
};

function toForm(p: Product): FormState {
  return {
    name: p.name,
    sku: p.sku,
    description: p.description ?? "",
    price: String(p.price),
    cost: String(p.cost),
    stock_quantity: String(p.stock_quantity),
    reorder_threshold: String(p.reorder_threshold),
    category: p.category ?? "",
    image_url: p.image_url ?? "",
  };
}

type Props = {
  open: boolean;
  onClose: () => void;
  product?: Product;
};

export default function ProductModal({ open, onClose, product }: Props) {
  const isEdit = Boolean(product);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const create = useCreateProduct();
  const update = useUpdateProduct();
  const isPending = create.isPending || update.isPending;

  useEffect(() => {
    if (open) {
      setForm(product ? toForm(product) : EMPTY);
      setError(null);
    }
  }, [open, product]);

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const price = parseFloat(form.price);
    const cost = parseFloat(form.cost);
    const stock_quantity = parseInt(form.stock_quantity, 10);
    const reorder_threshold = parseInt(form.reorder_threshold, 10);

    if (!form.name.trim()) return setError("Name is required.");
    if (!form.sku.trim()) return setError("SKU is required.");
    if (isNaN(price) || price <= 0) return setError("Price must be a positive number.");
    if (isNaN(cost) || cost < 0) return setError("Cost must be 0 or greater.");
    if (isNaN(stock_quantity) || stock_quantity < 0) return setError("Stock must be 0 or greater.");
    if (isNaN(reorder_threshold) || reorder_threshold < 0)
      return setError("Reorder threshold must be 0 or greater.");

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      description: form.description.trim() || null,
      price,
      cost,
      stock_quantity,
      reorder_threshold,
      category: form.category.trim() || null,
      image_url: form.image_url.trim() || null,
    };

    try {
      if (isEdit && product) {
        const { sku: _sku, ...updatePayload } = payload;
        await update.mutateAsync({ id: product.id, ...updatePayload });
        toast.success("Product updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Product added");
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg.replace("API 409: ", "").replace(/^"/, "").replace(/"$/, ""));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {isEdit ? "Edit Product" : "Add Product"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="grid grid-cols-2 gap-4">
            {/* Name — full width */}
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="p-name">Name *</Label>
              <Input id="p-name" value={form.name} onChange={set("name")} placeholder="Wireless Headphones" />
            </div>

            {/* SKU + Category */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-sku">SKU *</Label>
              <Input
                id="p-sku"
                value={form.sku}
                onChange={set("sku")}
                placeholder="ELEC-001"
                readOnly={isEdit}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-cat">Category</Label>
              <select
                id="p-cat"
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-md border border-zinc-700 px-3 py-2 text-sm bg-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option value="">Select category…</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Home & Kitchen">Home &amp; Kitchen</option>
                <option value="Books">Books</option>
                <option value="Sports">Sports</option>
              </select>
            </div>

            {/* Price + Cost */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-price">Price *</Label>
              <Input id="p-price" type="number" min="0.01" step="0.01" value={form.price} onChange={set("price")} placeholder="79.99" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-cost">Cost *</Label>
              <Input id="p-cost" type="number" min="0" step="0.01" value={form.cost} onChange={set("cost")} placeholder="32.00" />
            </div>

            {/* Stock + Reorder */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-stock">Stock Quantity *</Label>
              <Input id="p-stock" type="number" min="0" step="1" value={form.stock_quantity} onChange={set("stock_quantity")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-reorder">Reorder Threshold *</Label>
              <Input id="p-reorder" type="number" min="0" step="1" value={form.reorder_threshold} onChange={set("reorder_threshold")} />
            </div>

            {/* Description — full width */}
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="p-desc">Description</Label>
              <Textarea id="p-desc" rows={2} value={form.description} onChange={set("description")} placeholder="Optional product description…" />
            </div>

            {/* Image URL — full width */}
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="p-img">Image URL</Label>
              <Input id="p-img" value={form.image_url} onChange={set("image_url")} placeholder="https://…" />
            </div>

            {/* Error */}
            {error && (
              <p role="alert" className="col-span-2 text-sm text-red-400 bg-red-950/50 border border-red-900/50 rounded-md px-3 py-2">
                {error}
              </p>
            )}
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving…
                </>
              ) : isEdit ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
