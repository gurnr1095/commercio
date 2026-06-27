import { useState } from "react";
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

type RangeOption = { label: string; days: number | undefined };
const RANGE_OPTIONS: RangeOption[] = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "All", days: undefined },
];

type KpiProps = {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconBg: string;
};

function KpiCard({ title, value, sub, icon: Icon, iconBg }: KpiProps) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {title}
        </span>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon size={14} />
        </div>
      </div>
      <p className="text-2xl font-bold text-zinc-100 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
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
    <div className={`bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">{title}</h3>
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
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm p-5 space-y-3">
      <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse" />
      <div className="h-7 w-32 bg-zinc-800 rounded animate-pulse" />
    </div>
  );
}

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 8,
  background: "#18181b",
  border: "1px solid #27272a",
  color: "#f4f4f5",
};

export default function Analytics() {
  const [activeDays, setActiveDays] = useState<number | undefined>(30);
  const { data, isLoading, isError } = useAnalyticsSummary(activeDays);

  const chartDataLen = data?.revenue_by_day.length ?? 30;
  const xAxisInterval =
    chartDataLen <= 7 ? 0 : chartDataLen <= 30 ? 4 : chartDataLen <= 90 ? 9 : 29;

  const chartTitle =
    activeDays === 7
      ? "Revenue — Last 7 Days"
      : activeDays === 30
      ? "Revenue — Last 30 Days"
      : activeDays === 90
      ? "Revenue — Last 90 Days"
      : "Revenue — All Time";

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Analytics</h1>
        <div className="rounded-lg border border-red-900/50 bg-red-950/50 p-6 text-sm text-red-400">
          Failed to load analytics. Make sure the backend is running.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + range toggle */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Analytics</h1>
        <div className="flex items-center bg-zinc-800 rounded-lg p-1 gap-0.5">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setActiveDays(opt.days)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeDays === opt.days
                  ? "bg-zinc-700 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

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
              iconBg="bg-green-950/50 text-green-400"
            />
            <KpiCard
              title="Total Orders"
              value={String(data!.total_orders)}
              sub={`${data!.completed_orders} completed`}
              icon={ShoppingCart}
              iconBg="bg-blue-950/50 text-blue-400"
            />
            <KpiCard
              title="Avg Order Value"
              value={formatMoney(data!.avg_order_value)}
              sub="Completed orders only"
              icon={TrendingUp}
              iconBg="bg-violet-950/50 text-violet-400"
            />
            <KpiCard
              title="Customers"
              value={String(data!.total_customers)}
              sub={`${data!.total_products} products`}
              icon={Users}
              iconBg="bg-orange-950/50 text-orange-400"
            />
            <KpiCard
              title="Low Stock"
              value={String(data!.low_stock_count)}
              sub={`${data!.out_of_stock_count} out of stock`}
              icon={data!.low_stock_count > 0 ? AlertTriangle : Package}
              iconBg={
                data!.low_stock_count > 0
                  ? "bg-amber-950/50 text-amber-400"
                  : "bg-zinc-800 text-zinc-500"
              }
            />
          </>
        )}
      </div>

      {/* Charts row: Revenue trend + Orders by status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title={chartTitle} className="lg:col-span-2">
          {isLoading ? (
            <div className="h-56 bg-zinc-800 rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data!.revenue_by_day} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateTick}
                  interval={xAxisInterval}
                  tick={{ fontSize: 11, fill: "#71717a" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) =>
                    v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`
                  }
                  tick={{ fontSize: 11, fill: "#71717a" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  formatter={(value: number) => [formatMoney(value), "Revenue"]}
                  labelFormatter={formatDateTick}
                  contentStyle={tooltipStyle}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#7c3aed"
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
            <div className="h-56 bg-zinc-800 rounded-lg animate-pulse" />
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
                        fill={STATUS_COLORS[entry.status] ?? "#71717a"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value,
                      STATUS_LABELS[name] ?? name,
                    ]}
                    contentStyle={tooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-1">
                {data!.orders_by_status.map((entry) => (
                  <div key={entry.status} className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[entry.status] ?? "#71717a" }}
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
          <div className="h-48 bg-zinc-800 rounded-lg animate-pulse" />
        ) : data!.top_products.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-8">
            No completed orders yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={data!.top_products}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v) =>
                  v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`
                }
                tick={{ fontSize: 11, fill: "#71717a" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 12, fill: "#d4d4d8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [formatMoney(value), "Revenue"]}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="revenue" fill="#7c3aed" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
