import {
  AlertTriangle,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAnalyticsSummary } from "@/api/analytics";
import { formatMoney } from "@/lib/format";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  PROCESSING: "#3b82f6",
  COMPLETED: "#22c55e",
  CANCELLED: "#9ca3af",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

type KpiProps = {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconBg: string;
};

function KpiCard({ title, value, sub, icon: Icon, iconBg }: KpiProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </span>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon size={14} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function ChartCard({
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
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function formatDateTick(isoDate: string) {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
      <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
      <div className="h-7 w-32 bg-gray-100 rounded animate-pulse" />
    </div>
  );
}

export default function Analytics() {
  const { data, isLoading, isError } = useAnalyticsSummary();

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          Failed to load analytics. Make sure the backend is running.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <KpiCard
              title="Total Revenue"
              value={formatMoney(data!.total_revenue)}
              sub="From completed orders"
              icon={DollarSign}
              iconBg="bg-green-100 text-green-600"
            />
            <KpiCard
              title="Total Orders"
              value={String(data!.total_orders)}
              sub={`${data!.completed_orders} completed`}
              icon={ShoppingCart}
              iconBg="bg-blue-100 text-blue-600"
            />
            <KpiCard
              title="Avg Order Value"
              value={formatMoney(data!.avg_order_value)}
              sub="Completed orders only"
              icon={TrendingUp}
              iconBg="bg-purple-100 text-purple-600"
            />
            <KpiCard
              title="Customers"
              value={String(data!.total_customers)}
              sub={`${data!.total_products} products`}
              icon={Users}
              iconBg="bg-orange-100 text-orange-600"
            />
            <KpiCard
              title="Low Stock"
              value={String(data!.low_stock_count)}
              sub={`${data!.out_of_stock_count} out of stock`}
              icon={data!.low_stock_count > 0 ? AlertTriangle : Package}
              iconBg={
                data!.low_stock_count > 0
                  ? "bg-amber-100 text-amber-600"
                  : "bg-gray-100 text-gray-500"
              }
            />
          </>
        )}
      </div>

      {/* Charts row: Revenue trend + Orders by status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Revenue — Last 30 Days" className="lg:col-span-2">
          {isLoading ? (
            <div className="h-56 bg-gray-50 rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data!.revenue_by_day} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateTick}
                  interval={4}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) =>
                    v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`
                  }
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  formatter={(value: number) => [formatMoney(value), "Revenue"]}
                  labelFormatter={formatDateTick}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Orders by Status">
          {isLoading ? (
            <div className="h-56 bg-gray-50 rounded-lg animate-pulse" />
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={data!.orders_by_status}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={2}
                  >
                    {data!.orders_by_status.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] ?? "#9ca3af"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value,
                      STATUS_LABELS[name] ?? name,
                    ]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-1">
                {data!.orders_by_status.map((entry) => (
                  <div key={entry.status} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[entry.status] ?? "#9ca3af" }}
                    />
                    {STATUS_LABELS[entry.status] ?? entry.status} ({entry.count})
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Top products */}
      <ChartCard title="Top 5 Products by Revenue">
        {isLoading ? (
          <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />
        ) : data!.top_products.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No completed orders yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={data!.top_products}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v) =>
                  v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`
                }
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 12, fill: "#374151" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [formatMoney(value), "Revenue"]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
              <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
