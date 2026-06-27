import { useState, useEffect } from "react";
import {
  AlertTriangle,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { useAnalyticsSummary } from "@/api/analytics";
import { useOrders } from "@/api/orders";
import { useProducts } from "@/api/products";
import { formatMoney, formatDate } from "@/lib/format";
import type { Order } from "@/types/order";
import type { Product } from "@/types/product";

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  PROCESSING: "#3b82f6",
  COMPLETED: "#22c55e",
  CANCELLED: "#9ca3af",
};

const STATUS_BG: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  PROCESSING: "bg-blue-50 text-blue-700 ring-blue-200",
  COMPLETED: "bg-green-50 text-green-700 ring-green-200",
  CANCELLED: "bg-gray-100 text-gray-500 ring-gray-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${STATUS_BG[status] ?? "bg-gray-100 text-gray-500 ring-gray-200"}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: STATUS_COLORS[status] ?? "#9ca3af" }}
      />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────

type KpiProps = {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconBg: string;
  highlight?: boolean;
};

function KpiCard({ title, value, sub, icon: Icon, iconBg, highlight }: KpiProps) {
  return (
    <div
      className={`bg-white rounded-xl border shadow-sm p-5 ${highlight ? "border-amber-300" : "border-gray-200"}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </span>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon size={14} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      {sub && (
        <p className={`text-xs mt-1 ${highlight ? "text-amber-600 font-medium" : "text-gray-400"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}

function SkeletonKpi() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
      <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
      <div className="h-7 w-32 bg-gray-100 rounded animate-pulse" />
      <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
    </div>
  );
}

// ── Section card wrapper ──────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 ${className}`}>
      <h2 className="text-sm font-semibold text-gray-700 mb-4">{title}</h2>
      {children}
    </div>
  );
}

// ── Recent Orders ─────────────────────────────────────────────────────────────

function RecentOrders({ orders, isLoading }: { orders: Order[] | undefined; isLoading: boolean }) {
  if (isLoading) {
    return (
      <SectionCard title="Recent Orders">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 flex-1 bg-gray-100 rounded animate-pulse" />
              <div className="h-5 w-24 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </SectionCard>
    );
  }

  const recent = [...(orders ?? [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <SectionCard title="Recent Orders">
      {recent.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Order
                </th>
                <th className="pb-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Customer
                </th>
                <th className="pb-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Status
                </th>
                <th className="pb-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Total
                </th>
                <th className="pb-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recent.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 pr-4 font-mono text-xs text-gray-500">
                    #{String(order.id).padStart(5, "0")}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-800 font-medium truncate max-w-[140px]">
                    {order.customer_name}
                  </td>
                  <td className="py-2.5 pr-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="py-2.5 pr-4 text-right text-gray-800 tabular-nums font-medium">
                    {formatMoney(order.total)}
                  </td>
                  <td className="py-2.5 text-right text-gray-400 tabular-nums">
                    {formatDate(order.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

// ── Low-stock alerts ──────────────────────────────────────────────────────────

function LowStockAlerts({
  products,
  isLoading,
}: {
  products: Product[] | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <SectionCard title="Low Stock Alerts">
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="h-4 flex-1 bg-gray-100 rounded animate-pulse" />
              <div className="h-5 w-10 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </SectionCard>
    );
  }

  const lowStock = (products ?? [])
    .filter((p) => p.stock_quantity <= p.reorder_threshold)
    .sort((a, b) => a.stock_quantity - b.stock_quantity);

  return (
    <SectionCard title="Low Stock Alerts">
      {lowStock.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
          <Package size={28} className="text-green-400" />
          <p className="text-sm text-gray-400">All stocked up</p>
        </div>
      ) : (
        <ul className="space-y-0 divide-y divide-gray-50">
          {lowStock.map((product) => {
            const isOut = product.stock_quantity === 0;
            return (
              <li key={product.id} className="flex items-center justify-between py-2.5 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`shrink-0 w-1.5 h-1.5 rounded-full ${isOut ? "bg-red-500" : "bg-amber-400"}`}
                  />
                  <span className="text-sm text-gray-800 truncate">{product.name}</span>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full ${
                      isOut
                        ? "bg-red-50 text-red-600"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {product.stock_quantity} / {product.reorder_threshold}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

// ── Revenue sparkline ─────────────────────────────────────────────────────────

function RevenueSparkline({
  data,
  isLoading,
}: {
  data: Array<{ date: string; revenue: number }> | undefined;
  isLoading: boolean;
}) {
  const last7 = (data ?? []).slice(-7);

  if (isLoading) {
    return (
      <SectionCard title="Revenue — Last 7 Days">
        <div className="h-20 bg-gray-50 rounded-lg animate-pulse" />
      </SectionCard>
    );
  }

  const hasData = last7.some((d) => d.revenue > 0);

  return (
    <SectionCard title="Revenue — Last 7 Days">
      {!hasData ? (
        <p className="text-sm text-gray-400 py-4 text-center">
          No revenue data yet.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={72}>
          <AreaChart data={last7} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              formatter={(value: number) => [formatMoney(value), "Revenue"]}
              labelFormatter={(label: string) =>
                new Date(label).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
              }}
            />
            <XAxis dataKey="date" hide />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#sparkGrad)"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </SectionCard>
  );
}

// ── Dashboard page ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError } = useAnalyticsSummary();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: products, isLoading: productsLoading } = useProducts();
  const [storeName, setStoreName] = useState(
    () => localStorage.getItem("store-name") ?? "My Store"
  );

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "store-name") setStoreName(e.newValue ?? "My Store");
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const lowStockHighlight =
    !analyticsLoading && analytics ? analytics.low_stock_count > 0 : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{storeName}</h1>
        <p className="text-sm text-gray-400 mt-0.5">Your store at a glance</p>
      </div>

      {analyticsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Failed to load analytics. Make sure the backend is running.
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {analyticsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} />)
        ) : analytics ? (
          <>
            <KpiCard
              title="Total Revenue"
              value={formatMoney(analytics.total_revenue)}
              sub="From completed orders"
              icon={DollarSign}
              iconBg="bg-green-100 text-green-600"
            />
            <KpiCard
              title="Total Orders"
              value={String(analytics.total_orders)}
              sub={`${analytics.completed_orders} completed`}
              icon={ShoppingCart}
              iconBg="bg-blue-100 text-blue-600"
            />
            <KpiCard
              title="Customers"
              value={String(analytics.total_customers)}
              sub={`${analytics.total_products} products`}
              icon={Users}
              iconBg="bg-purple-100 text-purple-600"
            />
            <KpiCard
              title="Low Stock"
              value={String(analytics.low_stock_count)}
              sub={
                analytics.out_of_stock_count > 0
                  ? `${analytics.out_of_stock_count} out of stock`
                  : analytics.low_stock_count > 0
                  ? "Below reorder threshold"
                  : "All products stocked"
              }
              icon={analytics.low_stock_count > 0 ? AlertTriangle : Package}
              iconBg={
                analytics.low_stock_count > 0
                  ? "bg-amber-100 text-amber-600"
                  : "bg-gray-100 text-gray-500"
              }
              highlight={lowStockHighlight}
            />
          </>
        ) : null}
      </div>

      {/* Middle row: recent orders + low-stock list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentOrders orders={orders} isLoading={ordersLoading} />
        </div>
        <div>
          <LowStockAlerts products={products} isLoading={productsLoading} />
        </div>
      </div>

      {/* Sparkline — only rendered when analytics data is available */}
      {(analyticsLoading || (analytics && analytics.revenue_by_day.length > 0)) && (
        <RevenueSparkline
          data={analytics?.revenue_by_day}
          isLoading={analyticsLoading}
        />
      )}
    </div>
  );
}
