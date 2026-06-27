import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/product";

const CATEGORY_COLOR: Record<string, string> = {
  Electronics: "#3b82f6",
  Clothing: "#f43f5e",
  "Home & Kitchen": "#f59e0b",
  Books: "#14b8a6",
  Sports: "#f97316",
};

const CATEGORY_BADGE: Record<string, string> = {
  Electronics: "bg-blue-950/60 text-blue-400",
  Clothing: "bg-rose-950/60 text-rose-400",
  "Home & Kitchen": "bg-amber-950/60 text-amber-400",
  Books: "bg-teal-950/60 text-teal-400",
  Sports: "bg-orange-950/60 text-orange-400",
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
  const [imgFailed, setImgFailed] = useState(false);
  const stock = stockBadge(product.stock_quantity, product.reorder_threshold);
  const barColor = product.category ? (CATEGORY_COLOR[product.category] ?? "#71717a") : "#71717a";
  const badgeClass = product.category
    ? (CATEGORY_BADGE[product.category] ?? "bg-zinc-800 text-zinc-400")
    : "bg-zinc-800 text-zinc-400";
  const showImage = Boolean(product.image_url) && !imgFailed;

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 shadow-sm overflow-hidden hover:shadow-lg hover:border-zinc-700 transition-all">
      {showImage ? (
        <div className="h-36 w-full shrink-0 overflow-hidden bg-zinc-800">
          <img
            src={product.image_url!}
            alt={product.name}
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        </div>
      ) : (
        <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: barColor }} />
      )}

      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Category + stock badges */}
        <div className="flex items-center justify-between gap-2">
          {product.category ? (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full truncate ${badgeClass}`}>
              {product.category}
            </span>
          ) : (
            <span />
          )}
          <Badge variant={stock.variant} className="shrink-0">
            {stock.label}
          </Badge>
        </div>

        {/* Name + SKU */}
        <div>
          <h3 className="font-semibold text-zinc-100 leading-snug line-clamp-2">{product.name}</h3>
          <p className="text-xs text-zinc-500 mt-0.5 font-mono">{product.sku}</p>
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-3">
          <span className="text-lg font-bold text-zinc-100">
            ${Number(product.price).toFixed(2)}
          </span>
          <span className="text-xs text-zinc-500">
            Cost ${Number(product.cost).toFixed(2)}
          </span>
        </div>

        {/* Margin */}
        {product.cost > 0 && (
          <div className="text-xs">
            <span className="text-zinc-500">Margin </span>
            <span className="font-medium text-zinc-300">
              ${(product.price - product.cost).toFixed(2)}{" "}
              ({Math.round(((product.price - product.cost) / product.price) * 100)}%)
            </span>
          </div>
        )}

        {/* Stock */}
        <div className="flex gap-4 text-sm mt-auto">
          <div>
            <p className="text-xs text-zinc-500">Stock</p>
            <p className="font-semibold text-zinc-100">{product.stock_quantity}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Reorder at</p>
            <p className="font-semibold text-zinc-100">{product.reorder_threshold}</p>
          </div>
        </div>
      </div>

      {/* Action row */}
      <div className="flex border-t border-zinc-800 shrink-0">
        <button
          onClick={() => onEdit(product)}
          aria-label={`Edit ${product.name}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
        >
          <Pencil size={13} />
          Edit
        </button>
        <div className="w-px bg-zinc-800" />
        <button
          onClick={() => onDelete(product)}
          aria-label={`Delete ${product.name}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-red-500 hover:bg-red-950/50 hover:text-red-400 transition-colors"
        >
          <Trash2 size={13} />
          Delete
        </button>
      </div>
    </div>
  );
}
