import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { getProducts } from "../../api/products";
import { getPurchaseOrders } from "../../api/purchaseOrders";
import { getMaterials, getProductionOrders } from "../../api/manufacturing";
import { getInsights } from "../../api/ai";
import PageHeader from "../../components/PageHeader";
import StatusChip from "../../components/StatusChip";
import Spinner from "../../components/Spinner";
import ErrorState from "../../components/ErrorState";
import { formatDate, formatRelativeDays } from "../../lib/format";
import clsx from "clsx";

const ALERT_TYPES = [
  { id: "ALL", label: "All alerts" },
  { id: "OUT_OF_STOCK", label: "Out of stock" },
  { id: "LOW_STOCK", label: "Low stock" },
  { id: "PREDICTED_STOCKOUT", label: "Predicted stockout (Estimate)" },
  { id: "EXPIRED", label: "Expired" },
  { id: "EXPIRING_SOON", label: "Expiring soon" },
  { id: "MATERIAL_SHORTAGE", label: "Raw material shortage" },
  { id: "DELAYED_PO", label: "Delayed supplier order" },
];

export default function Alerts() {
  const [filterType, setFilterType] = useState("ALL");

  const { data: products = [], isLoading: isProdsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () => getPurchaseOrders(),
  });

  const { data: materials = [] } = useQuery({
    queryKey: ["materials"],
    queryFn: () => getMaterials(),
  });

  const { data: insightsData } = useQuery({
    queryKey: ["ai", "insights"],
    queryFn: () => getInsights(),
  });

  const alerts = useMemo(() => {
    const list = [];
    const now = new Date();
    const todayMidnight = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Actual Out of Stock (Fact)
    products.forEach((p) => {
      if (p.current_stock <= 0) {
        list.push({
          id: `oos-${p.id}`,
          type: "OUT_OF_STOCK",
          kind: "Fact",
          severity: "danger",
          title: p.name,
          subtitle: `Item code ${p.sku} • ${p.category}`,
          message: `${p.name} has zero units remaining in stock.`,
          actionLabel: "Create purchase order",
          actionTo: `/purchase-orders`,
          date: now,
        });
      }
    });

    // 2. Actual Low Stock (Fact)
    products.forEach((p) => {
      if (p.current_stock > 0 && p.current_stock <= p.reorder_level) {
        list.push({
          id: `low-${p.id}`,
          type: "LOW_STOCK",
          kind: "Fact",
          severity: "warning",
          title: p.name,
          subtitle: `Item code ${p.sku}`,
          message: `${p.name} has ${p.current_stock} ${p.unit} left, at or below reorder level (${p.reorder_level} ${p.unit}).`,
          actionLabel: "Create purchase order",
          actionTo: `/purchase-orders`,
          date: now,
        });
      }
    });

    // 3. Actual Expired (Fact)
    products.forEach((p) => {
      if (p.expiry_date && p.current_stock > 0) {
        const [y, m, d] = p.expiry_date.slice(0, 10).split("-").map(Number);
        if (Date.UTC(y, m - 1, d) <= todayMidnight) {
          list.push({
            id: `exp-${p.id}`,
            type: "EXPIRED",
            kind: "Fact",
            severity: "danger",
            title: p.name,
            subtitle: `Expiry date: ${formatDate(p.expiry_date)}`,
            message: `${p.current_stock} ${p.unit} of ${p.name} are past their expiry date. Remove from selling shelves.`,
            actionLabel: "Record stock issue",
            actionTo: `/stock/sale`,
            date: now,
          });
        }
      }
    });

    // 4. Actual Delayed Supplier PO (Fact)
    purchaseOrders.forEach((po) => {
      if (["CONFIRMED", "DRAFT"].includes(po.status) && po.expected_delivery_date) {
        const expDate = new Date(po.expected_delivery_date);
        if (expDate < now) {
          list.push({
            id: `delayed-${po.id}`,
            type: "DELAYED_PO",
            kind: "Fact",
            severity: "danger",
            title: `${po.po_number} (${po.supplier_name})`,
            subtitle: `Expected on ${formatDate(po.expected_delivery_date)}`,
            message: `Delivery from ${po.supplier_name} was expected on ${formatDate(po.expected_delivery_date)} and is overdue.`,
            actionLabel: "View order",
            actionTo: `/purchase-orders/${po.id}`,
            date: po.expected_delivery_date,
          });
        }
      }
    });

    // 5. Raw Material Shortage (Fact)
    materials.forEach((m) => {
      if (m.current_stock <= m.reorder_level) {
        list.push({
          id: `mat-${m.id}`,
          type: "MATERIAL_SHORTAGE",
          kind: "Fact",
          severity: "warning",
          title: m.name,
          subtitle: `Raw material • ${m.sku}`,
          message: `${m.name} stock (${m.current_stock} ${m.unit}) is at or below minimum threshold (${m.reorder_level} ${m.unit}).`,
          actionLabel: "View raw materials",
          actionTo: `/materials`,
          date: now,
        });
      }
    });

    // 6. Predicted Stockout (Estimate, from AI insights)
    (insightsData?.insights || []).forEach((i) => {
      if (i.stockout_risk === "HIGH" && i.days_until_stockout != null && i.days_until_stockout > 0) {
        list.push({
          id: `pred-${i.product_id}`,
          type: "PREDICTED_STOCKOUT",
          kind: "Estimate",
          severity: "warning",
          title: i.name,
          subtitle: `Velocity: ${i.daily_demand}/day • Lead time: ${i.lead_time_days}d`,
          message: `Stock is estimated to run out in about ${i.days_until_stockout} days, which is less than supplier lead time.`,
          actionLabel: "View stock advice",
          actionTo: `/advice`,
          date: now,
        });
      }
    });

    // 7. Expiring soon (Estimate, from AI insights or batch expiry)
    products.forEach((p) => {
      if (p.expiry_date && p.current_stock > 0) {
        const [y, m, d] = p.expiry_date.slice(0, 10).split("-").map(Number);
        const diff = Math.round((Date.UTC(y, m - 1, d) - todayMidnight) / 86400000);
        if (diff > 0 && diff <= 7) {
          list.push({
            id: `expsoon-${p.id}`,
            type: "EXPIRING_SOON",
            kind: "Estimate",
            severity: "warning",
            title: p.name,
            subtitle: `Expires on ${formatDate(p.expiry_date)}`,
            message: `${p.name} expires in ${diff} day${diff === 1 ? "" : "s"}. Review discount promotions or markdowns.`,
            actionLabel: "View product detail",
            actionTo: `/products/${p.id}`,
            date: now,
          });
        }
      }
    });

    return list;
  }, [products, purchaseOrders, materials, insightsData]);

  const filteredAlerts = useMemo(() => {
    if (filterType === "ALL") return alerts;
    return alerts.filter((a) => a.type === filterType);
  }, [alerts, filterType]);

  return (
    <div>
      <PageHeader
        title="Alerts"
        description="Actionable notifications for stockouts, delivery delays, material shortages and expiry risks."
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border mb-6">
        {ALERT_TYPES.map((type) => {
          const isActive = filterType === type.id;
          const count =
            type.id === "ALL"
              ? alerts.length
              : alerts.filter((a) => a.type === type.id).length;

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => setFilterType(type.id)}
              className={clsx(
                "px-3 py-1.5 text-[13px] font-medium rounded-btn whitespace-nowrap transition-colors flex items-center gap-1.5",
                isActive
                  ? "bg-primary text-white"
                  : "bg-surface border border-border text-text hover:bg-surface-muted"
              )}
            >
              <span>{type.label}</span>
              <span
                className={clsx(
                  "px-1.5 py-0.2 text-[11px] rounded-full tabular-nums",
                  isActive ? "bg-white/20 text-white" : "bg-surface-muted text-text-muted"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-border rounded-card">
          <CheckCircle2 className="w-10 h-10 text-status-ok mx-auto mb-2" />
          <h3 className="text-[16px] font-semibold text-text">No active alerts</h3>
          <p className="text-[14px] text-text-muted mt-1">
            No items require immediate attention under this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 bg-surface border border-border rounded-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-border-strong"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-[15px] text-text">{alert.title}</span>
                  <span
                    className={clsx(
                      "px-1.5 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider border",
                      alert.kind === "Fact"
                        ? "bg-surface-muted text-text-muted border-border"
                        : "bg-primary-subtle text-primary border-primary/20"
                    )}
                  >
                    {alert.kind}
                  </span>
                  <StatusChip
                    variant={alert.severity}
                    label={alert.severity === "danger" ? "Urgent" : "Attention"}
                  />
                </div>

                <p className="text-[14px] text-text leading-normal">{alert.message}</p>
                <div className="text-[12px] text-text-muted">{alert.subtitle}</div>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <Link
                  to={alert.actionTo}
                  className="inline-flex items-center gap-1.5 h-9 px-3 text-[13px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-btn transition-colors whitespace-nowrap"
                >
                  <span>{alert.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
