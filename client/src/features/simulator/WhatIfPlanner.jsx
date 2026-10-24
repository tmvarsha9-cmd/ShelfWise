import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getInsights, simulate } from "../../api/ai";
import PageHeader from "../../components/PageHeader";
import RiskBadge from "../../components/RiskBadge";
import Spinner from "../../components/Spinner";
import ErrorState from "../../components/ErrorState";
import { formatNumber } from "../../lib/format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import clsx from "clsx";

export default function WhatIfPlanner() {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [demandPct, setDemandPct] = useState(30);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState("");

  const latestRequestId = useRef(0);

  const {
    data: insightsData,
    isLoading: isInsightsLoading,
    isError: isInsightsError,
    error: insightsError,
    refetch: refetchInsights,
  } = useQuery({
    queryKey: ["ai", "insights"],
    queryFn: () => getInsights(),
    staleTime: 60000,
  });

  const products = insightsData?.insights || [];

  // Default to first product if none selected
  useEffect(() => {
    if (!selectedProductId && products.length > 0) {
      setSelectedProductId(String(products[0].product_id));
    }
  }, [products, selectedProductId]);

  // Debounced simulation effect (250ms debounce with stale response discarding)
  useEffect(() => {
    if (!selectedProductId) return;

    const currentRequestId = ++latestRequestId.current;
    setSimLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await simulate(Number(selectedProductId), demandPct);
        if (currentRequestId === latestRequestId.current) {
          setSimResult(res);
          setSimError("");
        }
      } catch (err) {
        if (currentRequestId === latestRequestId.current) {
          setSimError(err.message || "Simulation failed");
        }
      } finally {
        if (currentRequestId === latestRequestId.current) {
          setSimLoading(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timer);
    };
  }, [selectedProductId, demandPct]);

  if (isInsightsLoading) {
    return (
      <div>
        <PageHeader
          title="What-if planner"
          description="Test how shifts in customer demand affect stock run-out and order requirements."
        />
        <div className="p-16 flex flex-col items-center justify-center bg-surface border border-border rounded-card">
          <Spinner size="lg" />
          <span className="text-[14px] text-text-muted mt-3">Loading products for simulation…</span>
        </div>
      </div>
    );
  }

  if (isInsightsError) {
    return (
      <div>
        <PageHeader
          title="What-if planner"
          description="Test how shifts in customer demand affect stock run-out and order requirements."
        />
        <ErrorState message={insightsError?.message} onRetry={() => refetchInsights()} />
      </div>
    );
  }

  const selectedInsight = products.find((p) => String(p.product_id) === String(selectedProductId));
  const leadTimeDays = selectedInsight?.lead_time_days || 2;

  // Comparison difference text
  let diffText = "";
  if (simResult?.baseline?.days_until_stockout != null && simResult?.scenario?.days_until_stockout != null) {
    const diff = Math.round((simResult.scenario.days_until_stockout - simResult.baseline.days_until_stockout) * 10) / 10;
    if (diff < 0) {
      diffText = `Lasts ${Math.abs(diff).toFixed(1)} day${Math.abs(diff) === 1 ? "" : "s"} less`;
    } else if (diff > 0) {
      diffText = `Lasts ${diff.toFixed(1)} day${diff === 1 ? "" : "s"} more`;
    } else {
      diffText = "No difference in coverage days";
    }
  }

  // Chart data for days of stock comparison
  const chartData = simResult
    ? [
        {
          name: "Baseline",
          days: simResult.baseline?.days_until_stockout ?? 0,
          color: "#1F5C47",
        },
        {
          name: `Scenario (${demandPct > 0 ? `+${demandPct}` : demandPct}%)`,
          days: simResult.scenario?.days_until_stockout ?? 0,
          color: demandPct > 0 ? "#8A5A14" : "#24527A",
        },
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="What-if planner"
        description="Test how shifts in customer demand affect stock run-out and order requirements."
      />

      {/* Control Card */}
      <div className="p-5 bg-surface border border-border rounded-card mb-6">
        <div className="text-[13px] text-text-muted mb-4 pb-3 border-b border-border">
          This is your assumption, not a prediction.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Picker */}
          <div>
            <label htmlFor="product-select" className="block text-[14px] font-medium text-text mb-1.5">
              Select product
            </label>
            <select
              id="product-select"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full h-11 px-3 text-[15px] bg-surface border border-border-strong rounded-input text-text outline-none focus:border-primary"
            >
              {products.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.name} ({p.current_stock} in stock • {p.daily_demand}/day)
                </option>
              ))}
            </select>
          </div>

          {/* Demand presets and slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="demand-slider" className="text-[14px] font-medium text-text">
                Demand change:{" "}
                <span className="font-semibold tabular-nums text-primary text-[15px]">
                  {demandPct > 0 ? `+${demandPct}` : demandPct}%
                </span>
              </label>
              <input
                type="number"
                min="-50"
                max="200"
                step="5"
                value={demandPct}
                onChange={(e) => setDemandPct(Number(e.target.value))}
                className="w-16 h-8 text-center text-[14px] font-medium tabular-nums border border-border-strong rounded-input"
              />
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                onClick={() => setDemandPct(30)}
                className={clsx(
                  "px-2.5 py-1 text-[12px] font-medium rounded border transition-colors",
                  demandPct === 30
                    ? "bg-primary text-white border-primary"
                    : "bg-surface-muted text-text-muted border-border hover:text-text"
                )}
              >
                Festival week +30%
              </button>
              <button
                type="button"
                onClick={() => setDemandPct(20)}
                className={clsx(
                  "px-2.5 py-1 text-[12px] font-medium rounded border transition-colors",
                  demandPct === 20
                    ? "bg-primary text-white border-primary"
                    : "bg-surface-muted text-text-muted border-border hover:text-text"
                )}
              >
                Promotion +20%
              </button>
              <button
                type="button"
                onClick={() => setDemandPct(-20)}
                className={clsx(
                  "px-2.5 py-1 text-[12px] font-medium rounded border transition-colors",
                  demandPct === -20
                    ? "bg-primary text-white border-primary"
                    : "bg-surface-muted text-text-muted border-border hover:text-text"
                )}
              >
                Quiet week -20%
              </button>
            </div>

            {/* Slider */}
            <input
              id="demand-slider"
              type="range"
              min="-50"
              max="200"
              step="5"
              value={demandPct}
              onChange={(e) => setDemandPct(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-surface-muted rounded cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-text-muted mt-1 tabular-nums">
              <span>-50%</span>
              <span>0%</span>
              <span>+100%</span>
              <span>+200%</span>
            </div>
          </div>
        </div>
      </div>

      {simError && (
        <div
          role="alert"
          className="p-4 bg-status-danger-bg text-status-danger border border-status-danger/30 rounded-card mb-6 text-[14px]"
        >
          {simError}
        </div>
      )}

      {/* Side-by-side Comparison & Bar Chart */}
      {simResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Comparison Table */}
          <div className="lg:col-span-7 bg-surface border border-border rounded-card p-5">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="text-[16px] font-semibold text-text">
                Comparison: {simResult.name}
              </h3>
              {diffText && (
                <span className="text-[13px] font-semibold text-status-warning bg-status-warning-bg px-2.5 py-0.5 rounded border border-status-warning/20">
                  {diffText}
                </span>
              )}
            </div>

            <table className="w-full text-left text-[14px] border-collapse" aria-label="Simulation comparison table">
              <thead>
                <tr className="border-b border-border text-[12px] uppercase tracking-wider text-text-muted">
                  <th className="py-2.5 px-3">Metric</th>
                  <th className="py-2.5 px-3 text-right">Baseline</th>
                  <th className="py-2.5 px-3 text-right">
                    Scenario ({demandPct > 0 ? `+${demandPct}` : demandPct}%)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-3 px-3 text-text-muted">Sells per day</td>
                  <td className="py-3 px-3 text-right tabular-nums font-medium text-text">
                    {simResult.baseline?.daily_demand} units
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums font-semibold text-primary">
                    {simResult.scenario?.daily_demand} units
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-3 text-text-muted">Lasts about</td>
                  <td className="py-3 px-3 text-right tabular-nums font-medium text-text">
                    {simResult.baseline?.days_until_stockout != null
                      ? `${simResult.baseline.days_until_stockout} days`
                      : "No sales data"}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums font-semibold text-primary">
                    {simResult.scenario?.days_until_stockout != null
                      ? `${simResult.scenario.days_until_stockout} days`
                      : "No sales data"}
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-3 text-text-muted">Stockout risk</td>
                  <td className="py-3 px-3 text-right">
                    <RiskBadge level={simResult.baseline?.stockout_risk} />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <RiskBadge level={simResult.scenario?.stockout_risk} />
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-3 text-text-muted">Suggested order</td>
                  <td className="py-3 px-3 text-right tabular-nums font-medium">
                    {simResult.baseline?.replenishment?.needs_reorder
                      ? `${simResult.baseline.replenishment.suggested_order_qty} units`
                      : "No order needed"}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums font-semibold text-status-warning">
                    {simResult.scenario?.replenishment?.needs_reorder
                      ? `${simResult.scenario.replenishment.suggested_order_qty} units`
                      : "No order needed"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Simple Coverage Days Bar Chart */}
          <div className="lg:col-span-5 bg-surface border border-border rounded-card p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-[16px] font-semibold text-text mb-1">
                Days of Stock Coverage
              </h3>
              <p className="text-[12px] text-text-muted mb-4">
                Red dashed line marks supplier delivery time ({leadTimeDays} days).
              </p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#5B645F" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#5B645F" }} />
                  <Tooltip
                    formatter={(val) => [`${val} days`, "Coverage"]}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E2DDD2",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  />
                  <ReferenceLine
                    y={leadTimeDays}
                    stroke="#A3271C"
                    strokeDasharray="4 4"
                    label={{
                      value: `Delivery time (${leadTimeDays}d)`,
                      fill: "#A3271C",
                      fontSize: 11,
                      position: "top",
                    }}
                  />
                  <Bar dataKey="days" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-3 border-t border-border text-[12px] text-text-muted text-center">
              If coverage drops below the delivery line, a stockout will occur before reorder arrival.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
