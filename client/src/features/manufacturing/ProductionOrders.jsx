import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Factory, CheckCircle2, AlertTriangle, X } from "lucide-react";
import {
  getProductionOrders,
  createProductionOrder,
  completeProductionOrder,
  getMaterials,
} from "../../api/manufacturing";
import { getProducts } from "../../api/products";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import StatusChip from "../../components/StatusChip";
import Drawer from "../../components/Drawer";
import FormField from "../../components/FormField";
import ConfirmDialog from "../../components/ConfirmDialog";
import Spinner from "../../components/Spinner";
import { getProductionStatusMeta } from "../../lib/stockStatus";
import { formatDate, formatNumber } from "../../lib/format";
import { SOURCE_TYPES } from "../../lib/constants";
import { useToast } from "../../components/Toast";
import clsx from "clsx";

export default function ProductionOrders() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCompleteConfirmOpen, setIsCompleteConfirmOpen] = useState(false);

  // Create form state
  const [productId, setProductId] = useState("");
  const [plannedQty, setPlannedQty] = useState(50);
  const [plannedDate, setPlannedDate] = useState(new Date().toISOString().slice(0, 10));
  const [createError, setCreateError] = useState("");

  const {
    data: productionOrders = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["production-orders"],
    queryFn: getProductionOrders,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });

  const { data: materials = [] } = useQuery({
    queryKey: ["materials"],
    queryFn: getMaterials,
  });

  const manufacturedProducts = products.filter(
    (p) => p.source_type === SOURCE_TYPES.MANUFACTURED
  );

  const createMutation = useMutation({
    mutationFn: (data) => createProductionOrder(data),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      showToast(`Production order ${order.order_number} created.`);
      setIsCreateOpen(false);
    },
    onError: (err) => setCreateError(err.message || "Failed to create order"),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, qty }) => completeProductionOrder(id, qty),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      showToast(`Order ${order.order_number} completed. ${order.actual_quantity} ${order.product_name} added to stock.`);
      setIsCompleteConfirmOpen(false);
      setSelectedOrder(null);
    },
    onError: (err) => showToast(err.message || "Failed to complete production", "error"),
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!productId) {
      setCreateError("Please select a manufactured item");
      return;
    }
    if (!plannedQty || Number(plannedQty) <= 0) {
      setCreateError("Enter a valid planned quantity");
      return;
    }
    createMutation.mutate({
      product_id: Number(productId),
      planned_quantity: Number(plannedQty),
      planned_date: plannedDate,
    });
  };

  const columns = [
    {
      header: "Order code",
      field: "order_number",
      sortable: true,
      isMono: true,
    },
    {
      header: "Item to make",
      field: "product_name",
      sortable: true,
      render: (o) => <span className="font-semibold text-text">{o.product_name}</span>,
    },
    {
      header: "Planned qty",
      field: "planned_quantity",
      sortable: true,
      align: "right",
      render: (o) => formatNumber(o.planned_quantity),
    },
    {
      header: "Actual made",
      field: "actual_quantity",
      sortable: true,
      align: "right",
      render: (o) => (o.actual_quantity != null ? formatNumber(o.actual_quantity) : "—"),
    },
    {
      header: "Planned date",
      field: "planned_date",
      sortable: true,
      render: (o) => formatDate(o.planned_date),
    },
    {
      header: "Status",
      field: "status",
      render: (o) => {
        const meta = getProductionStatusMeta(o.status);
        return <StatusChip variant={meta.variant} label={meta.label} />;
      },
    },
  ];

  // Material shortage calculations for selected order
  const materialsCheck = (selectedOrder?.materials_used || []).map((m) => {
    const currentMat = materials.find((mat) => mat.id === m.material_id);
    const available = currentMat ? currentMat.current_stock : (m.available || 0);
    const needed = m.needed;
    const isShort = available < needed;
    const shortBy = isShort ? Math.round((needed - available) * 10) / 10 : 0;
    return {
      ...m,
      available,
      isShort,
      shortBy,
    };
  });

  const hasShortage = materialsCheck.some((m) => m.isShort);

  // Build the exact confirmation description
  const completeDescription = selectedOrder
    ? `This will use ${selectedOrder.materials_used
        .map((m) => `${m.needed} ${m.unit} ${m.material_name}`)
        .join(" and ")} and add ${selectedOrder.planned_quantity} ${selectedOrder.product_name} to stock.`
    : "";

  return (
    <div>
      <PageHeader
        title="Production orders"
        description="Batches of items made in-house. Raw materials are checked and deducted upon completion."
        action={
          <button
            type="button"
            onClick={() => {
              setProductId(manufacturedProducts[0] ? String(manufacturedProducts[0].id) : "");
              setPlannedQty(50);
              setPlannedDate(new Date().toISOString().slice(0, 10));
              setCreateError("");
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-2 h-11 px-4 text-[14px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-btn shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>Create production order</span>
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={productionOrders}
        keyField="id"
        caption="In-house production orders list"
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        emptyMessage="No production orders recorded."
        emptyActionLabel="Create production order"
        onEmptyAction={() => setIsCreateOpen(true)}
        onRowClick={(order) => setSelectedOrder(order)}
      />

      {/* Production Order Detail Drawer with Materials Check */}
      <Drawer
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder?.order_number || "Production order"}
        subtitle={`Making ${selectedOrder?.planned_quantity} ${selectedOrder?.product_name}`}
        width="max-w-2xl"
        footer={
          selectedOrder?.status !== "COMPLETED" && (
            <div className="w-full flex items-center justify-between">
              {hasShortage ? (
                <span className="text-[13px] text-status-danger font-semibold">
                  Production blocked: raw materials are short.
                </span>
              ) : (
                <span className="text-[13px] text-status-ok font-medium">
                  All materials are available in stock.
                </span>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="h-10 px-4 text-[14px] font-medium text-text bg-surface border border-border-strong hover:bg-surface-muted rounded-btn transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setIsCompleteConfirmOpen(true)}
                  disabled={hasShortage || completeMutation.isPending}
                  className="h-10 px-5 text-[14px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-btn transition-colors disabled:opacity-40"
                >
                  Complete production
                </button>
              </div>
            </div>
          )
        }
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="p-4 bg-surface-muted rounded-card border border-border grid grid-cols-2 sm:grid-cols-4 gap-4 text-[13px]">
              <div>
                <span className="text-text-muted block text-[12px]">Product</span>
                <strong className="text-text">{selectedOrder.product_name}</strong>
              </div>
              <div>
                <span className="text-text-muted block text-[12px]">Planned quantity</span>
                <strong className="text-text tabular-nums">{selectedOrder.planned_quantity}</strong>
              </div>
              <div>
                <span className="text-text-muted block text-[12px]">Planned date</span>
                <strong className="text-text tabular-nums">{formatDate(selectedOrder.planned_date)}</strong>
              </div>
              <div>
                <span className="text-text-muted block text-[12px]">Status</span>
                <StatusChip
                  variant={getProductionStatusMeta(selectedOrder.status).variant}
                  label={getProductionStatusMeta(selectedOrder.status).label}
                />
              </div>
            </div>

            {/* Materials Check Table */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
                <h4 className="text-[14px] font-semibold text-text uppercase tracking-wider">
                  Raw Materials Check
                </h4>
                <span className="text-[12px] text-text-muted">
                  Checked against current physical stock
                </span>
              </div>

              <table className="w-full text-left text-[14px] border-collapse" aria-label="Required raw materials check">
                <thead className="bg-surface-muted border-b border-border text-[12px] uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Material</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Needed</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Available in stock</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {materialsCheck.map((m, idx) => (
                    <tr key={idx} className="hover:bg-surface-muted/30">
                      <td className="py-3 px-3 font-medium text-text">{m.material_name}</td>
                      <td className="py-3 px-3 text-right tabular-nums font-semibold">
                        {m.needed} {m.unit}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        {m.available} {m.unit}
                      </td>
                      <td className="py-3 px-3">
                        {m.isShort ? (
                          <StatusChip
                            variant="danger"
                            label={`Short by ${m.shortBy} ${m.unit}`}
                          />
                        ) : (
                          <StatusChip variant="ok" label="Enough" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Drawer>

      {/* Create Order Drawer */}
      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create production order"
        subtitle="Plan a batch for an in-house product."
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="h-10 px-4 text-[14px] font-medium text-text bg-surface border border-border-strong hover:bg-surface-muted rounded-btn transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateSubmit}
              disabled={createMutation.isPending}
              className="h-10 px-5 text-[14px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-btn transition-colors flex items-center gap-2"
            >
              {createMutation.isPending && <Spinner size="sm" />}
              <span>Create order</span>
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <div
              role="alert"
              className="p-3.5 bg-status-danger-bg text-status-danger border border-status-danger/30 rounded-card text-[14px]"
            >
              {createError}
            </div>
          )}

          <FormField label="Product to produce" name="product" required>
            <select
              id="product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full h-10 px-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
            >
              <option value="">Select item…</option>
              {manufacturedProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.current_stock} currently in stock)
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Planned quantity to make" name="qty" required>
            <input
              id="qty"
              type="number"
              min="1"
              value={plannedQty}
              onChange={(e) => setPlannedQty(e.target.value)}
              className="w-full h-10 px-3 text-[14px] tabular-nums bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
            />
          </FormField>

          <FormField label="Planned production date" name="date" required>
            <input
              id="date"
              type="date"
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
              className="w-full h-10 px-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
            />
          </FormField>
        </form>
      </Drawer>

      {/* Complete Confirm Dialog */}
      <ConfirmDialog
        isOpen={isCompleteConfirmOpen}
        title="Complete production run?"
        message={completeDescription}
        confirmLabel="Complete production"
        cancelLabel="Not yet"
        isLoading={completeMutation.isPending}
        onConfirm={() =>
          completeMutation.mutate({
            id: selectedOrder.id,
            qty: selectedOrder.planned_quantity,
          })
        }
        onCancel={() => setIsCompleteConfirmOpen(false)}
      />
    </div>
  );
}
