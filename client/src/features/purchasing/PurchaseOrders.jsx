import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2 } from "lucide-react";
import { getPurchaseOrders, createPurchaseOrder } from "../../api/purchaseOrders";
import { getSuppliers } from "../../api/suppliers";
import { getProducts } from "../../api/products";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import StatusChip from "../../components/StatusChip";
import Drawer from "../../components/Drawer";
import FormField from "../../components/FormField";
import ProductPicker from "../../components/ProductPicker";
import Spinner from "../../components/Spinner";
import FilterBar from "../../components/FilterBar";
import { getPOStatusMeta } from "../../lib/stockStatus";
import { formatCurrency, formatDate } from "../../lib/format";
import { useToast } from "../../components/Toast";

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New PO form state
  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [lines, setLines] = useState([
    { id: 1, product_id: "", quantity: 10, unit_cost: 0 },
  ]);
  const [serverError, setServerError] = useState("");

  const {
    data: purchaseOrders = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["purchase-orders", { status: statusFilter, supplier_id: supplierFilter }],
    queryFn: () => getPurchaseOrders({ status: statusFilter, supplier_id: supplierFilter }),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => createPurchaseOrder(data),
    onSuccess: (newPo) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      showToast(`Purchase order ${newPo.po_number} created.`);
      setIsCreateOpen(false);
      navigate(`/purchase-orders/${newPo.id}`);
    },
    onError: (err) => setServerError(err.message || "Failed to create purchase order"),
  });

  const handleProductChange = (index, prodId, prodObj) => {
    const updated = [...lines];
    updated[index].product_id = prodId;
    if (prodObj && prodObj.purchase_cost) {
      updated[index].unit_cost = prodObj.purchase_cost;
    }
    setLines(updated);
  };

  const handleLineChange = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = value;
    setLines(updated);
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { id: Date.now(), product_id: "", quantity: 10, unit_cost: 0 },
    ]);
  };

  const removeLine = (index) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const runningTotal = lines.reduce(
    (sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unit_cost) || 0),
    0
  );

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!supplierId) {
      setServerError("Please select a supplier");
      return;
    }
    if (!expectedDate) {
      setServerError("Please select an expected delivery date");
      return;
    }
    const validLines = lines.filter((l) => l.product_id && Number(l.quantity) > 0);
    if (validLines.length === 0) {
      setServerError("Add at least one item with quantity");
      return;
    }

    createMutation.mutate({
      supplier_id: supplierId,
      expected_delivery_date: expectedDate,
      items: validLines.map((l) => ({
        product_id: l.product_id,
        quantity: Number(l.quantity),
        unit_cost: Number(l.unit_cost) || 0,
      })),
    });
  };

  const columns = [
    {
      header: "PO Number",
      field: "po_number",
      sortable: true,
      isMono: true,
    },
    {
      header: "Supplier",
      field: "supplier_name",
      sortable: true,
      render: (p) => <span className="font-semibold text-text">{p.supplier_name}</span>,
    },
    {
      header: "Expected delivery",
      field: "expected_delivery_date",
      sortable: true,
      render: (p) => (
        <span className="tabular-nums text-text">{formatDate(p.expected_delivery_date)}</span>
      ),
    },
    {
      header: "Items",
      field: "items",
      render: (p) => `${p.items ? p.items.length : 0} item${p.items?.length === 1 ? "" : "s"}`,
    },
    {
      header: "Total amount",
      field: "total_amount",
      sortable: true,
      align: "right",
      render: (p) => formatCurrency(p.total_amount),
    },
    {
      header: "Status",
      field: "status",
      render: (p) => {
        const meta = getPOStatusMeta(p.status, p.expected_delivery_date);
        return <StatusChip variant={meta.variant} label={meta.label} />;
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Purchase orders"
        description="Supplier orders and deliveries. An order is not stock until the goods are received."
        action={
          <button
            type="button"
            onClick={() => {
              setSupplierId("");
              setExpectedDate("");
              setLines([{ id: 1, product_id: "", quantity: 10, unit_cost: 0 }]);
              setServerError("");
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-2 h-11 px-4 text-[14px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-btn shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>Create purchase order</span>
          </button>
        }
      />

      <FilterBar>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by order status"
            className="h-10 px-3 text-[13px] bg-surface border border-border rounded-input text-text outline-none focus:border-primary"
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PARTIALLY_RECEIVED">Partly received</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            aria-label="Filter by supplier"
            className="h-10 px-3 text-[13px] bg-surface border border-border rounded-input text-text outline-none focus:border-primary"
          >
            <option value="">All suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        data={purchaseOrders}
        keyField="id"
        caption="Purchase orders list"
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        emptyMessage="No purchase orders yet."
        emptyActionLabel="Create purchase order"
        onEmptyAction={() => setIsCreateOpen(true)}
        onRowClick={(po) => navigate(`/purchase-orders/${po.id}`)}
      />

      {/* Create Purchase Order Drawer */}
      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create purchase order"
        subtitle="Specify vendor and line items. The order will be created in Confirmed status."
        width="max-w-3xl"
        footer={
          <div className="w-full flex items-center justify-between">
            <div className="text-[14px] text-text">
              Total: <strong className="text-primary text-[16px] tabular-nums">{formatCurrency(runningTotal)}</strong>
            </div>
            <div className="flex items-center gap-3">
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
                className="h-10 px-5 text-[14px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-btn transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {createMutation.isPending && <Spinner size="sm" />}
                <span>Create order</span>
              </button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-6">
          {serverError && (
            <div
              role="alert"
              className="p-3.5 bg-status-danger-bg text-status-danger border border-status-danger/30 rounded-card text-[14px]"
            >
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Supplier" name="supplier" required>
              <select
                id="supplier"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full h-10 px-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
              >
                <option value="">Select supplier…</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Delivery {s.lead_time_days}d)
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Expected delivery date" name="expectedDate" required>
              <input
                id="expectedDate"
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full h-10 px-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
              />
            </FormField>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h4 className="text-[14px] font-semibold text-text uppercase tracking-wider">
                Order line items
              </h4>
              <button
                type="button"
                onClick={addLine}
                className="text-[13px] font-medium text-primary hover:text-primary-hover inline-flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add line</span>
              </button>
            </div>

            {lines.map((line, idx) => (
              <div
                key={line.id}
                className="p-4 bg-surface-muted rounded-card border border-border grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
              >
                <div className="sm:col-span-6">
                  <FormField label="Product" required>
                    <ProductPicker
                      products={products}
                      value={line.product_id}
                      onChange={(pid, pObj) => handleProductChange(idx, pid, pObj)}
                    />
                  </FormField>
                </div>

                <div className="sm:col-span-3">
                  <FormField label="Quantity" required>
                    <input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => handleLineChange(idx, "quantity", e.target.value)}
                      className="w-full h-10 px-3 text-[14px] tabular-nums bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
                    />
                  </FormField>
                </div>

                <div className="sm:col-span-2">
                  <FormField label="Unit cost (₹)">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.unit_cost}
                      onChange={(e) => handleLineChange(idx, "unit_cost", e.target.value)}
                      className="w-full h-10 px-3 text-[14px] tabular-nums bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
                    />
                  </FormField>
                </div>

                <div className="sm:col-span-1 flex justify-end pb-1">
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      aria-label="Remove item"
                      className="p-2 text-text-muted hover:text-status-danger rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </form>
      </Drawer>
    </div>
  );
}
