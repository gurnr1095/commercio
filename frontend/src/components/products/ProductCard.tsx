import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/product";

const CATEGORY_COLOR: Record<string, string> = {
  Electronics: "#3b82f6",
  Clothing: "#a855f7",
  "Home & Kitchen": "#f59e0b",
  Books: "#22c55e",
  Sports: "#f97316",
};

const CATEGORY_BADGE: Record<string, string> = {
  Electronics: "bg-blue-100 text-blue-700",
  Clothing: "bg-purple-100 text-purple-700",
  "Home & Kitchen": "bg-amber-100 text-amber-800",
  Books: "bg-green-100 text-green-700",
  Sports: "bg-orange-100 text-orange-700",
};

function stockBadge(qty: number, threshold: number) {
  if (qty === 0) return { label: "Out of Stock", variant: "destructive" as const };
  if (qty <= threshold) return { label: "Low Stock", variant: "warning" as const };
  return { label: "In Stock", variant: "success" as const };
}

type Props = {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

export default function ProductCard({ product, onEdit, onDelete }: Props) {
  const stock = stockBadge(product.stock_quantity, product.reorder_threshold);
  const barColor = product.category ? (CATEGORY_COLOR[product.category] ?? "#9ca3af") : "#9ca3af";
  const badgeClass = product.category
    ? (CATEGORY_BADGE[product.category] ?? "bg-gray-100 text-gray-700")
    : "bg-gray-100 text-gray-700";

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Category colour bar */}
      <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: barColor }} />

      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Category + stock badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {product.category && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
              {product.category}
            </span>
          )}
          <Badge variant={stock.variant} className="ml-auto shrink-0">
            {stock.label}
          </Badge>
        </div>

        {/* Name + SKU */}
        <div>
          <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">{product.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">{product.sku}</p>
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-3">
          <span className="text-lg font-bold text-gray-900">
            ${Number(product.price).toFixed(2)}
          </span>
          <span className="text-xs text-gray-400">
            Cost ${Number(product.cost).toFixed(2)}
          </span>
        </div>

        {/* Stock */}
        <div className="flex gap-4 text-sm mt-auto">
          <div>
            <p className="text-xs text-gray-400">Stock</p>
            <p className="font-semibold text-gray-900">{product.stock_quantity}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Reorder at</p>
            <p className="font-semibold text-gray-900">{product.reorder_threshold}</p>
          </div>
        </div>
      </div>

      {/* Action row */}
      <div className="flex border-t border-gray-100 shrink-0">
        <button
          onClick={() => onEdit(product)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Pencil size={13} />
          Edit
        </button>
        <div className="w-px bg-gray-100" />
        <button
          onClick={() => onDelete(product)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={13} />
          Delete
        </button>
      </div>
    </div>
  );
}
