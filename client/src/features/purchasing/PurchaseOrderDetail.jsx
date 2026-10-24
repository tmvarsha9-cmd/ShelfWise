import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPurchaseOrderById, cancelPurchaseOrder } from "../../api/purchaseOrders";
import PageHeader from "../../components/PageHeader";
import StatusChip from "../../components/StatusChip";
import ConfirmDialog from "../../components/ConfirmDialog";
import Spinner from "../../components/Spinner";
import ErrorState from "../../components/ErrorState";
import { getPOStatusMeta } from "../../lib/stockStatus";
import { formatCurrency, formatDate, formatDateTime } from "../../lib/format";
import { useToast } from "../../components/Toast";
import { Download, XCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import clsx from "clsx";

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  const {
    data: po,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["purchase-orders", id],
    queryFn: () => getPurchaseOrderById(id),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelPurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      showToast(`Purchase order ${po?.po_number} cancelled.`);
      setIsCancelConfirmOpen(false);
    },
    onError: (err) => {
      showToast(err.message || "Failed to cancel order", "error");
    },
  });

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center bg-surface border border-border rounded-card">
        <Spinner size="lg" />
        <span className="text-[14px] text-text-muted mt-3">Loading purchase order…</span>
      </div>
    );
  }

  if (isError || !po) {
    return (
      <div>
        <Link
          to="/purchase-orders"
          className="inline-flex items-center gap-1.5 text-[14px] text-text-muted hover:text-text mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to purchase orders</span>
        </Link>
        <ErrorState message={error?.message || "Purchase order not found"} onRetry={() => refetch()} />
      </div>
    );
  }

  const statusMeta = getPOStatusMeta(po.status, po.expected_delivery_date);
  const canReceive = po.status !== "RECEIVED" && po.status !== "CANCELLED";
  const canCancel = po.status !== "RECEIVED" && po.status !== "CANCELLED";

  // Simple plain-text timeline steps
  const steps = [
    { label: "Order Created", date: po.created_at, completed: true },
    { label: "Confirmed with Supplier", date: po.created_at, completed: po.status !== "DRAFT" },
    {
      label: "Goods Received",
      date: po.received_at || po.expected_delivery_date,
      completed: po.status === "RECEIVED",
      current: po.status === "PARTIALLY_RECEIVED" || po.status === "CONFIRMED",
    },
  ];

  return (
    <div>
      <PageHeader
        title={po.po_number}
        description={`Supplier: ${po.supplier_name} • Expected by ${formatDate(po.expected_delivery_date)}`}
        breadcrumbs={[
          { label: "Purchase orders", to: "/purchase-orders" },
          { label: po.po_number },
        ]}
        action={
          <div className="flex items-center gap-2">
            {canReceive && (
              <Link
                to={`/stock/receive?po=${po.id}`}
                className="inline-flex items-center gap-2 h-10 px-4 text-[14px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-btn transition-colors shadow-sm"
              >
                <Download className="w-4 h-4 stroke-[2]" />
                <span>Receive goods</span>
              </Link>
            )}

            {canCancel && (
              <button
                type="button"
                onClick={() => setIsCancelConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 h-10 px-3.5 text-[14px] font-medium text-status-danger bg-surface border border-status-danger/40 hover:bg-status-danger-bg rounded-btn transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel order</span>
              </button>
            )}
          </div>
        }
      />

      {/* Reminder Callout */}
      <div className="p-3.5 bg-surface-muted border border-border rounded-card mb-6 text-[13px] text-text-muted flex items-center justify-between">
        <span>An order is not stock until the goods are received.</span>
        <StatusChip variant={statusMeta.variant} label={statusMeta.label} />
      </div>

      {/* Timeline Steps (plain text, no circles or gradient lines) */}
      <div className="p-5 bg-surface border border-border rounded-card mb-6">
        <h3 className="text-[14px] font-semibold text-text uppercase tracking-wider mb-4">
          Order Progress
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={clsx(
                "p-3 rounded border text-[13px]",
                step.completed
                  ? "bg-primary-subtle/50 border-primary/20 text-text"
                  : step.current
                  ? "bg-surface-muted border-border font-medium text-text"
                  : "bg-surface-muted/30 border-border text-text-muted"
              )}
            >
              <div className="font-semibold">{step.label}</div>
              <div className="text-[12px] text-text-muted mt-0.5">
                {step.date ? formatDate(step.date) : "Pending"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Line Items Table */}
      <div className="bg-surface border border-border rounded-card overflow-hidden mb-6">
        <div className="p-4 border-b border-border bg-surface-muted/30 flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-text">Ordered Items</h3>
          <span className="text-[14px] text-text font-medium">
            Total: {formatCurrency(po.total_amount)}
          </span>
        </div>

        <table className="w-full text-left text-[14px] border-collapse" aria-label="Purchase order items">
          <thead className="bg-surface-muted border-b border-border text-[12px] uppercase tracking-wider text-text-muted">
            <tr>
              <th className="py-3 px-4 font-semibold">Product</th>
              <th className="py-3 px-4 font-semibold text-right">Quantity Ordered</th>
              <th className="py-3 px-4 font-semibold text-right">Quantity Received</th>
              <th className="py-3 px-4 font-semibold text-right">Unit Cost</th>
              <th className="py-3 px-4 font-semibold text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(po.items || []).map((item, idx) => {
              const received = item.received_qty || 0;
              const isFulfilled = received >= item.quantity;
              return (
                <tr key={idx} className="hover:bg-surface-muted/30">
                  <td className="py-3 px-4 font-medium text-text">{item.product_name}</td>
                  <td className="py-3 px-4 text-right tabular-nums">{item.quantity}</td>
                  <td className="py-3 px-4 text-right tabular-nums font-semibold">
                    <span className={isFulfilled ? "text-status-ok" : "text-status-warning"}>
                      {received}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(item.unit_cost)}</td>
                  <td className="py-3 px-4 text-right tabular-nums font-medium text-text">
                    {formatCurrency(item.quantity * item.unit_cost)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cancel Confirm Dialog */}
      <ConfirmDialog
        isOpen={isCancelConfirmOpen}
        title={`Cancel ${po.po_number}?`}
        message="This purchase order will be marked as cancelled. Any goods not yet received will not be added to stock."
        confirmLabel="Cancel purchase order"
        cancelLabel="Keep order"
        isDestructive={true}
        isLoading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
        onCancel={() => setIsCancelConfirmOpen(false)}
      />
    </div>
  );
}
