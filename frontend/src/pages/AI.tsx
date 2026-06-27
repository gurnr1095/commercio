import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  PackageSearch,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Minus,
  BarChart2,
} from "lucide-react";
import { useInventoryAnalysis, useSalesSummary } from "@/api/ai";
import type { InventoryAnalysis, SalesSummary, StockAlert } from "@/types/ai";

function parseApiError(err: unknown): string {
  if (!(err instanceof Error)) return "Unknown error";
  const match = err.message.match(/^API \d+: (.+)$/s);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (typeof parsed.detail === "string") return parsed.detail;
      if (Array.isArray(parsed.detail))
        return parsed.detail.map((d: { msg: string }) => d.msg).join("; ");
    } catch {
      return match[1];
    }
  }
  return err.message;
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="p-2 rounded-lg bg-violet-950/40 text-violet-400 mt-0.5">
        <Icon size={18} />
      </div>
      <div>
        <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
        <p className="text-sm text-zinc-400 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function GenerateButton({
  loading,
  hasResult,
  onClick,
}: {
  loading: boolean;
  hasResult: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
        bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed
        transition-colors"
    >
      {loading ? (
        <>
          <Loader2 size={15} className="animate-spin" />
          Analysing…
        </>
      ) : hasResult ? (
        <>
          <RefreshCw size={15} />
          Regenerate
        </>
      ) : (
        <>
          <Sparkles size={15} />
          Generate
        </>
      )}
    </button>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/50 px-4 py-3 text-sm text-red-400">
      {message}
    </div>
  );
}

function AlertCard({ alert, variant }: { alert: StockAlert; variant: "critical" | "warning" }) {
  const colors =
    variant === "critical"
      ? "border-red-900/50 bg-red-950/50"
      : "border-amber-900/50 bg-amber-950/50";
  const badgeColors =
    variant === "critical"
      ? "bg-red-950/60 text-red-400"
      : "bg-amber-950/60 text-amber-400";

  return (
    <div className={`rounded-lg border p-3 ${colors}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-zinc-100">{alert.product_name}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColors}`}>
          {alert.current_stock === 0 ? "Out of stock" : `Stock: ${alert.current_stock}`}
        </span>
      </div>
      <p className="text-xs text-zinc-500 mb-1.5">Threshold: {alert.threshold}</p>
      <p className="text-xs text-zinc-300 leading-snug">{alert.recommendation}</p>
    </div>
  );
}

function TrendBadge({ trend }: { trend: SalesSummary["trend"] }) {
  if (trend === "growing") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-950/60 text-green-400">
        <TrendingUp size={12} /> Growing
      </span>
    );
  }
  if (trend === "declining") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-950/60 text-red-400">
        <TrendingDown size={12} /> Declining
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400">
      <Minus size={12} /> Stable
    </span>
  );
}

function InventoryResult({ data }: { data: InventoryAnalysis }) {
  return (
    <div className="mt-5 space-y-4">
      {/* Summary */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-800 px-4 py-3">
        <p className="text-sm text-zinc-300 leading-relaxed">{data.summary}</p>
      </div>

      {/* Critical + Reorder columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.critical_items.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-red-400 mb-2 flex items-center gap-1">
              <AlertTriangle size={11} /> Critical ({data.critical_items.length})
            </h4>
            <div className="space-y-2">
              {data.critical_items.map((a) => (
                <AlertCard key={a.product_name} alert={a} variant="critical" />
              ))}
            </div>
          </div>
        )}
        {data.reorder_recommendations.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-400 mb-2 flex items-center gap-1">
              <AlertTriangle size={11} /> Reorder Soon ({data.reorder_recommendations.length})
            </h4>
            <div className="space-y-2">
              {data.reorder_recommendations.map((a) => (
                <AlertCard key={a.product_name} alert={a} variant="warning" />
              ))}
            </div>
          </div>
        )}
        {data.critical_items.length === 0 && data.reorder_recommendations.length === 0 && (
          <div className="col-span-2 text-sm text-green-400 bg-green-950/50 border border-green-900/50 rounded-lg px-4 py-3">
            All products are well-stocked — no immediate action required.
          </div>
        )}
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
            Insights
          </h4>
          <ul className="space-y-1.5">
            {data.insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SalesResult({ data }: { data: SalesSummary }) {
  return (
    <div className="mt-5 space-y-4">
      {/* Headline + trend */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-800 px-4 py-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="text-sm font-semibold text-zinc-100 leading-snug">{data.headline}</p>
          <TrendBadge trend={data.trend} />
        </div>
        <p className="text-sm text-zinc-400">{data.total_revenue_insight}</p>
      </div>

      {/* Top performer */}
      <div className="flex items-start gap-2 rounded-lg border border-violet-900/50 bg-violet-950/30 px-4 py-3">
        <BarChart2 size={16} className="text-violet-400 mt-0.5 shrink-0" />
        <div>
          <span className="text-xs font-semibold text-violet-400 uppercase tracking-wide">Top Performer</span>
          <p className="text-sm text-zinc-200 mt-0.5">{data.top_performer}</p>
        </div>
      </div>

      {/* Insights + Recommendations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.key_insights.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
              Key Insights
            </h4>
            <ul className="space-y-1.5">
              {data.key_insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.recommendations.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
              Recommendations
            </h4>
            <ul className="space-y-1.5">
              {data.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                  <ArrowRight size={14} className="text-violet-400 mt-0.5 shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AI() {
  const inventory = useInventoryAnalysis();
  const sales = useSalesSummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">AI Insights</h1>
        <p className="text-sm text-zinc-400 mt-1">
          On-demand analysis powered by Mistral AI. Results are generated fresh each time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Analysis */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm p-6">
          <SectionHeader
            icon={PackageSearch}
            title="Inventory Analysis"
            description="Identifies low-stock risks, reorder needs, and inventory patterns across all products."
          />
          <GenerateButton
            loading={inventory.isPending}
            hasResult={!!inventory.data}
            onClick={() => inventory.mutate()}
          />
          {inventory.isError && (
            <ErrorBanner message={parseApiError(inventory.error)} />
          )}
          {inventory.data && <InventoryResult data={inventory.data} />}
        </div>

        {/* Sales Summary */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm p-6">
          <SectionHeader
            icon={TrendingUp}
            title="Sales Summary"
            description="Summarises revenue performance, top products, and growth trends from completed orders."
          />
          <GenerateButton
            loading={sales.isPending}
            hasResult={!!sales.data}
            onClick={() => sales.mutate()}
          />
          {sales.isError && (
            <ErrorBanner message={parseApiError(sales.error)} />
          )}
          {sales.data && <SalesResult data={sales.data} />}
        </div>
      </div>
    </div>
  );
}
