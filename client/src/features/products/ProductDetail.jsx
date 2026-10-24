import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProductById, removeProduct, getProductBatches } from "../../api/products";
import { getInventoryTransactions } from "../../api/inventory";
import { getInsights, explain } from "../../api/ai";
import PageHeader from "../../components/PageHeader";
import StatusChip from "../../components/StatusChip";
import RiskBadge from "../../components/RiskBadge";
import Tabs from "../../components/Tabs";
import ConfirmDialog from "../../components/ConfirmDialog";
import ProductFormDrawer from "./ProductFormDrawer";
import Spinner from "../../components/Spinner";
import ErrorState from "../../components/ErrorState";
import { getProductStockStatus } from "../../lib/stockStatus";
import { formatCurrency, formatNumber, formatDate, formatDateTime } from "../../lib/format";
import { SOURCE_TYPE_LABELS } from "../../lib/constants";
import { useToast } from "../../components/Toast";
import { Edit2, Trash2, ArrowLeft, Lightbulb } from "lucide-react";
import clsx from "clsx";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("overview");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);

  // Load product
  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["products", id],
    queryFn: () => getProductById(id),
  });

  // Load batches
  const { data: batches = [] } = useQuery({
    queryKey: ["products", id, "batches"],
    queryFn: () => getProductBatches(id),
    enabled: Boolean(product),
  });

  // Load product transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ["inventory", "transactions", { product_id: id }],
    queryFn: () => getInventoryTransactions({ product_id: id }),
    enabled: Boolean(product),
  });

  // Load advice for this product
  const { data: insightsData } = useQuery({
    queryKey: ["ai", "insights"],
    queryFn: () => getInsights(),
    staleTime: 60000,
  });

  const productInsight = insightsData?.insights?.find(
    (i) => i.product_id === Number(id)
  );

  const removeMutation = useMutation({
    mutationFn: () => removeProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "summary"] });
      showToast(`Product ${product?.name} removed. History is kept.`);
      navigate("/products");
    },
    onError: (err) => {
      showToast(err.message || "Failed to remove product", "error");
    },
  });

  const handleExplain = async () => {
    setIsExplaining(true);
    try {
      const res = await explain(id);
      setExplanation(res);
    } catch (err) {
      setExplanation({ text: `Could not load explanation: ${err.message}`, source: "fallback" });
    } finally {
      setIsExplaining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center bg-surface border border-border rounded-card">
        <Spinner size="lg" />
        <span className="text-[14px] text-text-muted mt-3">Loading product details…</span>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-[14px] text-text-muted hover:text-text mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to products</span>
        </Link>
        <ErrorState message={error?.message || "Product not found"} onRetry={() => refetch()} />
      </div>
    );
  }

  const stockMeta = getProductStockStatus(product);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "batches", label: "Batches", count: batches.length },
    { id: "history", label: "Stock history", count: transactions.length },
    { id: "advice", label: "Advice" },
  ];

  return (
    <div>
      <PageHeader
        title={product.name}
        description={`Item code ${product.sku} • ${product.category}`}
        breadcrumbs={[
          { label: "Products", to: "/products" },
          { label: product.name },
        ]}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center gap-2 h-10 px-3.5 text-[14px] font-medium text-text bg-surface border border-border-strong hover:bg-surface-muted rounded-btn transition-colors"
            >
              <Edit2 className="w-4 h-4 stroke-[1.75]" />
              <span>Edit product</span>
            </button>
            <button
              type="button"
              onClick={() => setIsRemoveConfirmOpen(true)}
              className="inline-flex items-center gap-2 h-10 px-3 text-[14px] font-medium text-status-danger bg-surface border border-status-danger/40 hover:bg-status-danger-bg rounded-btn transition-colors"
            >
              <Trash2 className="w-4 h-4 stroke-[1.75]" />
              <span>Remove</span>
            </button>
          </div>
        }
      />

      {/* Summary Card */}
      <div className="p-5 bg-surface border border-border rounded-card mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <span className="text-[12px] font-semibold uppercase tracking-wider text-text-muted block mb-1">
            Stock status
          </span>
          <StatusChip variant={stockMeta.variant} label={stockMeta.label} />
        </div>

        <div>
          <span className="text-[12px] font-semibold uppercase tracking-wider text-text-muted block mb-1">
            Current stock
          </span>
          <div className="text-[22px] font-semibold text-text tabular-nums leading-tight">
            {formatNumber(product.current_stock)} {product.unit}
          </div>
          <span className="text-[12px] text-text-muted">
            Reorder point: {product.reorder_level} {product.unit}
          </span>
        </div>

        <div>
          <span className="text-[12px] font-semibold uppercase tracking-wider text-text-muted block mb-1">
            Selling price
          </span>
          <div className="text-[22px] font-semibold text-text tabular-nums leading-tight">
            {formatCurrency(product.unit_price)}
          </div>
          {product.purchase_cost > 0 && (
            <span className="text-[12px] text-text-muted">
              Cost: {formatCurrency(product.purchase_cost)}
            </span>
          )}
        </div>

        <div>
          <span className="text-[12px] font-semibold uppercase tracking-wider text-text-muted block mb-1">
            How you get it
          </span>
          <div className="text-[14px] font-medium text-text">
            {SOURCE_TYPE_LABELS[product.source_type] || product.source_type}
          </div>
          <span className="text-[12px] text-text-muted">
            Delivery: {product.lead_time_days || 0} days
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface border border-border rounded-card p-5">
            <h3 className="text-[15px] font-semibold text-text uppercase tracking-wider mb-4 pb-2 border-b border-border">
              Stock details & Rules
            </h3>
            <dl className="divide-y divide-border text-[14px]">
              <div className="py-2.5 flex justify-between">
                <dt className="text-text-muted">Item code</dt>
                <dd className="font-mono text-text">{product.sku}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-text-muted">Category</dt>
                <dd className="text-text font-medium">{product.category}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-text-muted">Daily demand</dt>
                <dd className="text-text tabular-nums">{product.daily_demand} {product.unit} / day</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-text-muted">Reorder alert level</dt>
                <dd className="text-text tabular-nums">{product.reorder_level} {product.unit}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-text-muted">Perishable (Expires)</dt>
                <dd className="text-text font-medium">
                  {product.has_expiry || product.expiry_date ? "Yes" : "No"}
                </dd>
              </div>
              {product.expiry_date && (
                <div className="py-2.5 flex justify-between">
                  <dt className="text-text-muted">Earliest expiry date</dt>
                  <dd className="text-text tabular-nums">{formatDate(product.expiry_date)}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-surface border border-border rounded-card p-5">
            <h3 className="text-[15px] font-semibold text-text uppercase tracking-wider mb-4 pb-2 border-b border-border">
              Commercial & Supply Details
            </h3>
            <dl className="divide-y divide-border text-[14px]">
              <div className="py-2.5 flex justify-between">
                <dt className="text-text-muted">Source</dt>
                <dd className="text-text font-medium">
                  {SOURCE_TYPE_LABELS[product.source_type] || product.source_type}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-text-muted">Supplier minimum order</dt>
                <dd className="text-text tabular-nums">{product.min_order_qty || 1} units</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-text-muted">Purchase cost</dt>
                <dd className="text-text tabular-nums font-medium">
                  {formatCurrency(product.purchase_cost)}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-text-muted">Selling price</dt>
                <dd className="text-text tabular-nums font-semibold text-primary">
                  {formatCurrency(product.unit_price)}
                </dd>
              </div>
              {product.purchase_cost > 0 && product.unit_price > 0 && (
                <div className="py-2.5 flex justify-between">
                  <dt className="text-text-muted">Gross margin</dt>
                  <dd className="text-text tabular-nums font-medium text-status-ok">
                    {Math.round(((product.unit_price - product.purchase_cost) / product.unit_price) * 100)}%
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}

      {/* Tab 2: Batches */}
      {activeTab === "batches" && (
        <div className="bg-surface border border-border rounded-card overflow-hidden">
          <div className="p-4 border-b border-border bg-surface-muted/30 flex items-center justify-between text-[13px] text-text-muted">
            <span>Batches expiring first are used first (FEFO rule).</span>
            <span>{batches.length} tracked batch{batches.length === 1 ? "" : "es"}</span>
          </div>
          {batches.length === 0 ? (
            <div className="p-8 text-center text-[14px] text-text-muted">
              No batches recorded for this product. Receive stock to create tracked batches.
            </div>
          ) : (
            <table className="w-full text-left text-[14px] border-collapse">
              <thead className="bg-surface-muted border-b border-border text-[12px] uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="py-3 px-4 font-semibold">Batch code</th>
                  <th className="py-3 px-4 font-semibold">Received date</th>
                  <th className="py-3 px-4 font-semibold">Expiry date</th>
                  <th className="py-3 px-4 font-semibold text-right">Remaining quantity</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {batches.map((b) => {
                  const now = new Date();
                  const isExpired = b.expiry_date && new Date(b.expiry_date) < now;
                  return (
                    <tr key={b.id} className="hover:bg-surface-muted/40">
                      <td className="py-3 px-4 font-mono text-[13px] font-semibold text-text">
                        {b.batch_code}
                      </td>
                      <td className="py-3 px-4 text-text-muted tabular-nums">
                        {formatDate(b.received_date)}
                      </td>
                      <td className="py-3 px-4 text-text tabular-nums">
                        {b.expiry_date ? formatDate(b.expiry_date) : "No expiry"}
                      </td>
                      <td className="py-3 px-4 text-right font-medium tabular-nums text-text">
                        {b.remaining_qty} {product.unit}
                      </td>
                      <td className="py-3 px-4">
                        {isExpired ? (
                          <StatusChip variant="danger" label="Expired" />
                        ) : b.remaining_qty === 0 ? (
                          <StatusChip variant="neutral" label="Depleted" />
                        ) : (
                          <StatusChip variant="ok" label="Active" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 3: Stock history */}
      {activeTab === "history" && (
        <div className="bg-surface border border-border rounded-card overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-[14px] text-text-muted">
              No stock movements recorded for this product yet.
            </div>
          ) : (
            <table className="w-full text-left text-[14px] border-collapse">
              <thead className="bg-surface-muted border-b border-border text-[12px] uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="py-3 px-4 font-semibold">Date & Time</th>
                  <th className="py-3 px-4 font-semibold">Movement type</th>
                  <th className="py-3 px-4 font-semibold text-right">Quantity</th>
                  <th className="py-3 px-4 font-semibold">Recorded by</th>
                  <th className="py-3 px-4 font-semibold">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => {
                  const isPositive = tx.quantity > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-surface-muted/40">
                      <td className="py-3 px-4 text-text tabular-nums">
                        {formatDateTime(tx.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-text text-[13px]">{tx.type}</span>
                        {tx.note && <span className="block text-[12px] text-text-muted">{tx.note}</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold tabular-nums">
                        <span className={isPositive ? "text-status-ok" : "text-status-danger"}>
                          {isPositive ? `+${tx.quantity}` : tx.quantity} {product.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-muted text-[13px]">{tx.who}</td>
                      <td className="py-3 px-4 font-mono text-[13px] text-text-muted">
                        {tx.reference || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 4: Advice */}
      {activeTab === "advice" && (
        <div className="bg-surface border border-border rounded-card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
            <div>
              <h3 className="text-[16px] font-semibold text-text">Stock replenishment advice</h3>
              <p className="text-[13px] text-text-muted">
                Calculated advice based on sales velocity and supplier delivery time.
              </p>
            </div>
            {productInsight && <RiskBadge level={productInsight.stockout_risk} />}
          </div>

          {productInsight ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-surface-muted rounded-card border border-border">
                  <span className="text-[12px] text-text-muted block">Days of stock left</span>
                  <div className="text-[20px] font-semibold text-text tabular-nums">
                    {productInsight.days_until_stockout != null
                      ? `${productInsight.days_until_stockout} days`
                      : "No sales data"}
                  </div>
                </div>

                <div className="p-4 bg-surface-muted rounded-card border border-border">
                  <span className="text-[12px] text-text-muted block">Replenishment action</span>
                  <div className="text-[15px] font-semibold text-text mt-1">
                    {productInsight.replenishment?.needs_reorder
                      ? `Order about ${productInsight.replenishment.suggested_order_qty} units`
                      : "No order needed"}
                  </div>
                </div>

                <div className="p-4 bg-surface-muted rounded-card border border-border">
                  <span className="text-[12px] text-text-muted block">Expiry risk</span>
                  <div className="text-[15px] font-medium text-text mt-1">
                    {productInsight.expiry
                      ? `${productInsight.expiry.units_at_risk ?? 0} units at risk`
                      : "No expiry date"}
                  </div>
                </div>
              </div>

              {/* Explain Button & Explanation */}
              <div className="pt-2">
                {!explanation ? (
                  <button
                    type="button"
                    onClick={handleExplain}
                    disabled={isExplaining}
                    className="inline-flex items-center gap-2 h-10 px-4 text-[14px] font-medium text-primary bg-primary-subtle hover:bg-primary/10 rounded-btn transition-colors disabled:opacity-50"
                  >
                    {isExplaining ? <Spinner size="sm" /> : <Lightbulb className="w-4 h-4" />}
                    <span>Explain this recommendation</span>
                  </button>
                ) : (
                  <div className="p-4 bg-surface-muted rounded-card border border-border space-y-2">
                    <p className="text-[14px] text-text leading-relaxed">{explanation.text}</p>
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium border bg-surface text-text-muted border-border">
                      {explanation.source === "llm" ? "AI-written" : "Standard explanation"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-[14px] text-text-muted">
              No advice calculated yet for this product.
            </div>
          )}
        </div>
      )}

      {/* Edit Product Drawer */}
      <ProductFormDrawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        initialData={product}
        onSuccess={() => refetch()}
      />

      {/* Remove Confirm Dialog */}
      <ConfirmDialog
        isOpen={isRemoveConfirmOpen}
        title={`Remove ${product.name}?`}
        message="It will no longer appear in lists or sales. Its stock history is kept."
        confirmLabel="Remove product"
        cancelLabel="Keep product"
        isDestructive={true}
        isLoading={removeMutation.isPending}
        onConfirm={() => removeMutation.mutate()}
        onCancel={() => setIsRemoveConfirmOpen(false)}
      />
    </div>
  );
}
