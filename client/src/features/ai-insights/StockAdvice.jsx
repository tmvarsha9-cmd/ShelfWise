import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getInsights, explain } from "../../api/ai";
import PageHeader from "../../components/PageHeader";
import Banner from "../../components/Banner";
import FigureTile from "../../components/FigureTile";
import RiskBadge from "../../components/RiskBadge";
import Spinner from "../../components/Spinner";
import ErrorState from "../../components/ErrorState";
import { formatNumber } from "../../lib/format";
import { ChevronDown, ChevronRight, HelpCircle, Sparkles } from "lucide-react";
import clsx from "clsx";

export default function StockAdvice() {
  const [explanations, setExplanations] = useState({}); // productId -> { text, source, loading, error }
  const [expandedRows, setExpandedRows] = useState({}); // productId -> boolean

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["ai", "insights"],
    queryFn: () => getInsights(),
    staleTime: 60000,
  });

  const handleExplain = async (productId) => {
    setExplanations((prev) => ({
      ...prev,
      [productId]: { loading: true, error: null },
    }));

    try {
      const result = await explain(productId);
      setExplanations((prev) => ({
        ...prev,
        [productId]: { loading: false, text: result.text, source: result.source },
      }));
    } catch (err) {
      setExplanations((prev) => ({
        ...prev,
        [productId]: { loading: false, error: err.message || "Failed to load explanation" },
      }));
    }
  };

  const toggleCalculations = (productId) => {
    setExpandedRows((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Stock advice"
          description="Estimates based on current stock and recent daily sales. They assume sales stay steady."
        />
        <div className="p-16 flex flex-col items-center justify-center bg-surface border border-border rounded-card">
          <Spinner size="lg" />
          <span className="text-[14px] text-text-muted mt-3">Analysing inventory…</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader
          title="Stock advice"
          description="Estimates based on current stock and recent daily sales. They assume sales stay steady."
        />
        <ErrorState message={error?.message} onRetry={() => refetch()} />
      </div>
    );
  }

  const insights = data?.insights || [];
  const highStockout = insights.filter((i) => i.stockout_risk === "HIGH").length;
  const needReorder = insights.filter((i) => i.replenishment?.needs_reorder).length;
  const expiryRisk = insights.filter(
    (i) => i.expiry && ["MEDIUM", "HIGH"].includes(i.expiry.risk_level)
  ).length;

  return (
    <div>
      <PageHeader
        title="Stock advice"
        description="Estimates based on current stock and recent daily sales. They assume sales stay steady."
      />

      {data?.data_source === "sample" && (
        <Banner variant="info" className="mb-6">
          Showing sample data.
        </Banner>
      )}

      {/* Three Summary Figure Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <FigureTile
          label="High stockout risk"
          value={highStockout}
          hint="Items projected to run out before delivery"
          variant={highStockout > 0 ? "danger" : "default"}
        />
        <FigureTile
          label="Need reordering"
          value={needReorder}
          hint="Stock is below calculated replenishment point"
          variant={needReorder > 0 ? "warning" : "default"}
        />
        <FigureTile
          label="Estimated expiry risk"
          value={expiryRisk}
          hint="Perishable units that may remain unsold"
          variant={expiryRisk > 0 ? "warning" : "default"}
        />
      </div>

      {/* Main Table */}
      <div className="bg-surface border border-border rounded-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[15px]" aria-label="Stock advice recommendations">
            <thead className="bg-surface-muted border-b border-border text-[12px] uppercase tracking-wider text-text-muted select-none">
              <tr>
                <th scope="col" className="py-3 px-4 font-semibold">Product</th>
                <th scope="col" className="py-3 px-4 font-semibold text-right">In stock</th>
                <th scope="col" className="py-3 px-4 font-semibold text-right">Sells / day</th>
                <th scope="col" className="py-3 px-4 font-semibold text-right">Lasts about</th>
                <th scope="col" className="py-3 px-4 font-semibold">Stockout risk</th>
                <th scope="col" className="py-3 px-4 font-semibold">What to do</th>
                <th scope="col" className="py-3 px-4 font-semibold">Expiry</th>
                <th scope="col" className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text">
              {insights.map((item) => {
                const ex = explanations[item.product_id];
                const isCalcExpanded = Boolean(expandedRows[item.product_id]);

                // What to do wording
                let actionText = "No order needed";
                if (item.replenishment?.needs_reorder) {
                  const qty = item.replenishment.suggested_order_qty;
                  const days = item.replenishment.order_within_days;
                  actionText = `Order about ${qty} units ${days === 0 ? "now" : `within ${days} days`}`;
                }

                // Days until stockout null check
                const lastsAbout =
                  item.days_until_stockout === null || item.days_until_stockout === undefined
                    ? "No sales data"
                    : `${formatNumber(item.days_until_stockout, { maximumFractionDigits: 1 })} days`;

                return (
                  <tr key={item.product_id} className="group">
                    <td colSpan={8} className="p-0">
                      {/* Main row cells */}
                      <div className="grid grid-cols-8 items-center px-4 py-3 hover:bg-surface-muted/30 transition-colors">
                        {/* Product */}
                        <div className="col-span-1 pr-2">
                          <div className="font-semibold text-text">{item.name}</div>
                          <div className="text-[12px] text-text-muted">{item.category}</div>
                          {item.warnings && item.warnings.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {item.warnings.map((w, i) => (
                                <p key={i} className="text-[12px] text-status-danger leading-tight">
                                  {w}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* In stock */}
                        <div className="text-right tabular-nums font-medium pr-2">
                          {formatNumber(item.current_stock)}
                        </div>

                        {/* Sells per day */}
                        <div className="text-right tabular-nums text-text-muted pr-2">
                          {item.daily_demand > 0 ? formatNumber(item.daily_demand) : "0"}
                        </div>

                        {/* Lasts about */}
                        <div className="text-right tabular-nums pr-2 text-text">
                          {lastsAbout}
                        </div>

                        {/* Stockout risk */}
                        <div className="pl-2">
                          <RiskBadge level={item.stockout_risk} />
                        </div>

                        {/* What to do */}
                        <div className="text-[14px] font-medium pl-2">
                          <span
                            className={clsx(
                              item.replenishment?.needs_reorder
                                ? "text-status-warning font-semibold"
                                : "text-text-muted"
                            )}
                          >
                            {actionText}
                          </span>
                        </div>

                        {/* Expiry */}
                        <div className="text-[13px] pl-2">
                          {item.expiry ? (
                            <div className="space-y-1">
                              <RiskBadge level={item.expiry.risk_level} />
                              <div className="text-[12px] text-text-muted">
                                {item.expiry.units_at_risk === null || item.expiry.units_at_risk === undefined
                                  ? "Not enough sales data"
                                  : `about ${item.expiry.units_at_risk} units may go unsold`}
                              </div>
                            </div>
                          ) : (
                            <span className="text-text-muted text-[13px]">No expiry date</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="text-right flex items-center justify-end gap-2 pl-2">
                          <button
                            type="button"
                            onClick={() => toggleCalculations(item.product_id)}
                            className="inline-flex items-center gap-1 text-[13px] font-medium text-text-muted hover:text-text px-2 py-1 rounded hover:bg-surface-muted transition-colors"
                          >
                            <span>{isCalcExpanded ? "Hide" : "Calculation"}</span>
                            {isCalcExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {!ex ? (
                            <button
                              type="button"
                              onClick={() => handleExplain(item.product_id)}
                              className="inline-flex items-center gap-1.5 h-8 px-2.5 text-[13px] font-medium text-primary bg-primary-subtle hover:bg-primary/10 rounded-btn transition-colors"
                            >
                              <span>Explain this</span>
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {/* Explanation box (when clicked) */}
                      {ex && (
                        <div className="px-6 py-3.5 bg-surface-muted/80 border-t border-border flex items-start justify-between gap-4">
                          <div className="flex-1">
                            {ex.loading ? (
                              <div className="flex items-center gap-2 text-[13px] text-text-muted">
                                <Spinner size="sm" />
                                <span>Generating explanation…</span>
                              </div>
                            ) : ex.error ? (
                              <div className="flex items-center gap-3 text-[13px] text-status-danger">
                                <span>{ex.error}</span>
                                <button
                                  type="button"
                                  onClick={() => handleExplain(item.product_id)}
                                  className="underline font-medium"
                                >
                                  Retry
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <p className="text-[14px] text-text leading-relaxed">{ex.text}</p>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={clsx(
                                      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium border",
                                      ex.source === "llm"
                                        ? "bg-primary-subtle text-primary border-primary/20"
                                        : "bg-surface text-text-muted border-border"
                                    )}
                                  >
                                    {ex.source === "llm" ? "AI-written" : "Standard explanation"}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Expandable Traceability Calculation details */}
                      {isCalcExpanded && (
                        <div className="px-6 py-4 bg-[#FAF8F4] border-t border-border">
                          <h4 className="text-[13px] font-semibold text-text uppercase tracking-wider mb-2">
                            Calculation inputs for {item.name}
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[13px]">
                            <div className="p-2.5 bg-surface rounded border border-border">
                              <span className="text-text-muted block text-[12px]">Current stock</span>
                              <strong className="text-text tabular-nums">{item.current_stock}</strong>
                            </div>
                            <div className="p-2.5 bg-surface rounded border border-border">
                              <span className="text-text-muted block text-[12px]">Daily demand</span>
                              <strong className="text-text tabular-nums">{item.daily_demand} / day</strong>
                            </div>
                            <div className="p-2.5 bg-surface rounded border border-border">
                              <span className="text-text-muted block text-[12px]">Delivery time</span>
                              <strong className="text-text tabular-nums">{item.lead_time_days} days</strong>
                            </div>
                            <div className="p-2.5 bg-surface rounded border border-border">
                              <span className="text-text-muted block text-[12px]">Reorder point</span>
                              <strong className="text-text tabular-nums">{item.replenishment?.reorder_point ?? "—"}</strong>
                            </div>
                            <div className="p-2.5 bg-surface rounded border border-border">
                              <span className="text-text-muted block text-[12px]">Below reorder level</span>
                              <strong className="text-text">
                                {item.replenishment?.below_reorder_level ? "Yes" : "No"}
                              </strong>
                            </div>
                            <div className="p-2.5 bg-surface rounded border border-border">
                              <span className="text-text-muted block text-[12px]">Days to expiry</span>
                              <strong className="text-text tabular-nums">
                                {item.expiry?.days_to_expiry ?? "N/A"}
                              </strong>
                            </div>
                            <div className="p-2.5 bg-surface rounded border border-border col-span-2">
                              <span className="text-text-muted block text-[12px]">Expected sales before expiry</span>
                              <strong className="text-text tabular-nums">
                                {item.expiry?.expected_sales_before_expiry ?? "N/A"} units
                              </strong>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
