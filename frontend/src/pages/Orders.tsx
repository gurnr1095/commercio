import { useState } from "react";
import { Plus, Search, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OrderDrawer from "@/components/orders/OrderDrawer";
import CreateOrderModal from "@/components/orders/CreateOrderModal";
import { useOrders } from "@/api/orders";
import { formatDate, formatMoney } from "@/lib/format";
import type { Order, OrderStatus } from "@/types/order";

type FilterTab = "ALL" | OrderStatus;

const TABS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const STATUS_BADGE: Record<OrderStatus, { variant: "warning" | "info" | "success" | "default"; label: string }> = {
  PENDING: { variant: "warning", label: "Pending" },
  PROCESSING: { variant: "info", label: "Processing" },
  COMPLETED: { variant: "success", label: "Completed" },
  CANCELLED: { variant: "default", label: "Cancelled" },
};

const COLS = ["Order", "Customer", "Status", "Items", "Total", "Date", ""];

export default function Orders() {
  const { data: orders, isLoading, isError } = useOrders();
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const counts: Record<FilterTab, number> = {
    ALL: orders?.length ?? 0,
    PENDING: orders?.filter((o) => o.status === "PENDING").length ?? 0,
    PROCESSING: orders?.filter((o) => o.status === "PROCESSING").length ?? 0,
    COMPLETED: orders?.filter((o) => o.status === "COMPLETED").length ?? 0,
    CANCELLED: orders?.filter((o) => o.status === "CANCELLED").length ?? 0,
  };

  const filtered = (orders ?? []).filter((o) => {
    const matchesTab = activeTab === "ALL" || o.status === activeTab;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      String(o.id).includes(q) ||
      o.customer_name.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  // Keep drawer in sync when the order is updated via status transitions
  const liveSelected = selectedOrder
    ? (orders?.find((o) => o.id === selectedOrder.id) ?? selectedOrder)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          {orders && (
            <p className="text-sm text-gray-500 mt-0.5">{orders.length} orders total</p>
          )}
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          New Order
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.value
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {counts[tab.value] > 0 && (
              <span
                className={`text-xs rounded-full px-1.5 py-0.5 ${
                  activeTab === tab.value
                    ? "bg-violet-600 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {counts[tab.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order # or customer…"
          className="pl-9"
        />
      </div>

      {/* Error */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          Failed to load orders. Make sure the backend is running.
        </div>
      )}

      {/* Table */}
      {!isError && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-violet-100 bg-violet-50">
                  {COLS.map((col) => (
                    <th
                      key={col}
                      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-violet-600 whitespace-nowrap ${
                        col === "Items" || col === "Total" ? "text-right" : "text-left"
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Loading skeletons */}
                {isLoading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      {[20, 50, 30, 15, 25, 40, 15].map((w, j) => (
                        <td key={j} className="px-4 py-3">
                          <div
                            className="h-4 rounded bg-gray-100 animate-pulse"
                            style={{ width: `${w}%` }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}

                {/* Rows */}
                {!isLoading &&
                  filtered.map((order) => {
                    const badge = STATUS_BADGE[order.status];
                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 font-mono text-sm text-gray-700 whitespace-nowrap">
                          #{order.id}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                          {order.customer_name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
                          {order.items.length}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 tabular-nums whitespace-nowrap">
                          {formatMoney(order.total)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs text-gray-400 hover:text-gray-600">View →</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingCart size={40} className="text-gray-300 mb-3" />
              {search || activeTab !== "ALL" ? (
                <p className="text-sm text-gray-500">No orders match the current filter.</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700">No orders yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Create your first order to get started.
                  </p>
                  <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                    <Plus size={16} /> New Order
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Drawer + Modal */}
      <OrderDrawer order={liveSelected} onClose={() => setSelectedOrder(null)} />
      <CreateOrderModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
