import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  ShoppingCart,
  Download,
  Plus,
  FileText,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { getInventorySummary } from "../../api/inventory";
import { getInsights } from "../../api/ai";
import PageHeader from "../../components/PageHeader";
import FigureTile from "../../components/FigureTile";
import StatusChip from "../../components/StatusChip";
import RiskBadge from "../../components/RiskBadge";
import Spinner from "../../components/Spinner";
import ErrorState from "../../components/ErrorState";
import { formatCurrency, formatNumber, formatDateTime } from "../../lib/format";
import clsx from "clsx";

export default function Dashboard() {
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ["inventory", "summary"],
    queryFn: () => getInventorySummary(),
    staleTime: 30000,
  });

  const { data: insightsData } = useQuery({
    queryKey: ["ai", "insights"],
    queryFn: () => getInsights(),
    staleTime: 60000,
  });

  if (isSummaryLoading) {
    return (
      <div>
        <PageHeader title="Today at a glance" description="Store inventory, stock risks and today's activity." />
        <div className="p-16 flex flex-col items-center justify-center bg-surface border border-border rounded-card">
          <Spinner size="lg" />
          <span className="text-[14px] text-text-muted mt-3">Loading store overview…</span>
        </div>
      </div>
    );
  }

  if (isSummaryError) {
    return (
      <div>
        <PageHeader title="Today at a glance" description="Store inventory, stock risks and today's activity." />
        <ErrorState message={summaryError?.message} onRetry={() => refetchSummary()} />
      </div>
    );
  }

  const topAdviceItems = (insightsData?.insights || []).slice(0, 5);

  const getMovementMeta = (type) => {
    switch (type) {
      case "STOCK_IN":
        return { label: "Stock in", variant: "ok" };
      case "SOLD":
        return { label: "Sold", variant: "info" };
      case "PRODUCED":
        return { label: "Produced", variant: "ok" };
      case "USED_IN_PRODUCTION":
        return { label: "Used in production", variant: "neutral" };
      case "DAMAGED":
        return { label: "Damaged", variant: "danger" };
      case "CORRECTION":
        return { label: "Correction", variant: "warning" };
      default:
        return { label: type, variant: "neutral" };
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Today at a glance"
        description="Store inventory, replenishment needs, and live movement history."
      />

      {/* 1. Six Figure Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <FigureTile
          label="Active products"
          value={formatNumber(summary.active_products)}
          hint="Tracked catalog items"
          to="/products"
        />
        <FigureTile
          label="Stock value"
          value={formatCurrency(summary.stock_value)}
          hint="Inventory cost valuation"
          to="/reports/current_stock"
        />
        <FigureTile
          label="Low stock"
          value={formatNumber(summary.low_stock)}
          hint="At or below reorder level"
          to="/products"
          variant={summary.low_stock > 0 ? "warning" : "default"}
        />
        <FigureTile
          label="Out of stock"
          value={formatNumber(summary.out_of_stock)}
          hint="Zero units in store"
          to="/products"
          variant={summary.out_of_stock > 0 ? "danger" : "default"}
        />
        <FigureTile
          label="Expiring soon"
          value={formatNumber(summary.expiring_soon)}
          hint="Expiring within 7 days"
          to="/alerts"
          variant={summary.expiring_soon > 0 ? "warning" : "default"}
        />
        <FigureTile
          label="Deliveries pending"
          value={formatNumber(summary.pending_deliveries)}
          hint="Open purchase orders"
          to="/purchase-orders"
        />
      </div>

      {/* 5. Quick Actions Strip */}
      <div className="p-4 bg-surface border border-border rounded-card flex flex-wrap items-center gap-3">
        <span className="text-[13px] font-semibold uppercase tracking-wider text-text-muted mr-1">
          Quick actions:
        </span>
        <Link
          to="/stock/sale"
          className="inline-flex items-center gap-2 h-10 px-4 text-[14px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-btn transition-colors shadow-sm"
        >
          <ShoppingCart className="w-4 h-4 stroke-[2]" />
          <span>Record a sale</span>
        </Link>
        <Link
          to="/stock/receive"
          className="inline-flex items-center gap-2 h-10 px-3.5 text-[14px] font-medium text-text bg-surface border border-border-strong hover:bg-surface-muted rounded-btn transition-colors"
        >
          <Download className="w-4 h-4 stroke-[1.75]" />
          <span>Receive stock</span>
        </Link>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 h-10 px-3.5 text-[14px] font-medium text-text bg-surface border border-border-strong hover:bg-surface-muted rounded-btn transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[1.75]" />
          <span>Add product</span>
        </Link>
        <Link
          to="/purchase-orders"
          className="inline-flex items-center gap-2 h-10 px-3.5 text-[14px] font-medium text-text bg-surface border border-border-strong hover:bg-surface-muted rounded-btn transition-colors"
        >
          <FileText className="w-4 h-4 stroke-[1.75]" />
          <span>Create purchase order</span>
        </Link>
      </div>

      {/* 2 & 4. Needs Attention & Stock by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Needs Attention Table (top 5 from stock advice) */}
        <div className="lg:col-span-7 bg-surface border border-border rounded-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div>
                <h3 className="text-[16px] font-semibold text-text">Needs attention</h3>
                <span className="text-[12px] text-text-muted">
                  Urgent replenishment advice based on current stock velocity
                </span>
              </div>
              <Link
                to="/advice"
                className="text-[13px] font-medium text-primary hover:text-primary-hover inline-flex items-center gap-1"
              >
                <span>See all advice</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {topAdviceItems.length === 0 ? (
              <div className="p-8 text-center text-[14px] text-text-muted">
                All inventory levels are currently in a healthy range.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {topAdviceItems.map((item) => {
                  let actionText = "No order needed";
                  if (item.replenishment?.needs_reorder) {
                    const qty = item.replenishment.suggested_order_qty;
                    const days = item.replenishment.order_within_days;
                    actionText = `Order about ${qty} units ${days === 0 ? "now" : `within ${days} days`}`;
                  }

                  return (
                    <div
                      key={item.product_id}
                      className="py-3 flex items-center justify-between gap-4 text-[14px]"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <RiskBadge level={item.stockout_risk} />
                        <div className="truncate">
                          <Link
                            to={`/products/${item.product_id}`}
                            className="font-semibold text-text hover:text-primary transition-colors truncate"
                          >
                            {item.name}
                          </Link>
                          <span className="text-[12px] text-text-muted ml-2">
                            ({item.current_stock} left)
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={clsx(
                            "text-[13px] font-medium",
                            item.replenishment?.needs_reorder
                              ? "text-status-warning font-semibold"
                              : "text-text-muted"
                          )}
                        >
                          {actionText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Stock by Category Horizontal Bar Chart */}
        <div className="lg:col-span-5 bg-surface border border-border rounded-card p-5">
          <div className="pb-3 border-b border-border mb-3">
            <h3 className="text-[16px] font-semibold text-text">Stock by category</h3>
            <span className="text-[12px] text-text-muted">Units currently in stock across departments</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={summary.stock_by_category || []}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis type="number" tick={{ fontSize: 12, fill: "#5B645F" }} />
                <YAxis
                  dataKey="category"
                  type="category"
                  tick={{ fontSize: 12, fill: "#1D2320" }}
                  width={80}
                />
                <Tooltip
                  formatter={(val) => [`${val} units`, "Stock"]}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E2DDD2",
                    borderRadius: "6px",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="count" fill="#1F5C47" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Recent Stock Movements (last 8) */}
      <div className="bg-surface border border-border rounded-card overflow-hidden">
        <div className="p-4 border-b border-border bg-surface-muted/30 flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-text">Recent stock movements</h3>
          <Link
            to="/stock"
            className="text-[13px] font-medium text-primary hover:text-primary-hover inline-flex items-center gap-1"
          >
            <span>View all movements</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <table className="w-full text-left text-[14px] border-collapse" aria-label="Recent stock movements table">
          <thead className="bg-surface-muted border-b border-border text-[12px] uppercase tracking-wider text-text-muted">
            <tr>
              <th className="py-2.5 px-4 font-semibold">Time</th>
              <th className="py-2.5 px-4 font-semibold">Item</th>
              <th className="py-2.5 px-4 font-semibold">Movement type</th>
              <th className="py-2.5 px-4 font-semibold text-right">Quantity</th>
              <th className="py-2.5 px-4 font-semibold">Recorded by</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(summary.recent_movements || []).map((m) => {
              const meta = getMovementMeta(m.type);
              const isPos = m.quantity > 0;
              return (
                <tr key={m.id} className="hover:bg-surface-muted/30">
                  <td className="py-2.5 px-4 text-text tabular-nums text-[13px]">
                    {formatDateTime(m.created_at)}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-text">{m.product_name}</td>
                  <td className="py-2.5 px-4">
                    <StatusChip variant={meta.variant} label={meta.label} />
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-semibold">
                    <span className={isPos ? "text-status-ok" : "text-status-danger"}>
                      {isPos ? `+${m.quantity}` : m.quantity}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-text-muted text-[13px]">{m.who}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
