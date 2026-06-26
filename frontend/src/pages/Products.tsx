import { useState } from "react";
import { Package, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/products/ProductCard";
import ProductModal from "@/components/products/ProductModal";
import DeleteConfirmDialog from "@/components/products/DeleteConfirmDialog";
import { useProducts } from "@/api/products";
import type { Product } from "@/types/product";

export default function Products() {
  const { data: products, isLoading, isError } = useProducts();
  const [search, setSearch] = useState("");
  const [editProduct, setEditProduct] = useState<Product | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  function openCreate() {
    setEditProduct(undefined);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditProduct(product);
    setModalOpen(true);
  }

  const filtered = (products ?? []).filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          {products && (
            <p className="text-sm text-gray-500 mt-0.5">{products.length} products total</p>
          )}
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, SKU, or category…"
          className="pl-9"
        />
      </div>

      {/* States */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-56 rounded-xl border border-gray-200 bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          Failed to load products. Make sure the backend is running.
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <Package size={40} className="text-gray-300 mb-3" />
          {search ? (
            <p className="text-sm text-gray-500">No products match "{search}".</p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">No products yet</p>
              <p className="text-sm text-gray-400 mt-1">Add your first product to get started.</p>
              <Button className="mt-4" onClick={openCreate}>
                <Plus size={16} /> Add Product
              </Button>
            </>
          )}
        </div>
      )}

      {/* Card grid */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={editProduct}
      />
      <DeleteConfirmDialog
        product={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
