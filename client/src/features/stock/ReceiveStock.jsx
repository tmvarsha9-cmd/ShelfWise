import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPurchaseOrders, getPurchaseOrderById } from "../../api/purchaseOrders";
import { getProducts } from "../../api/products";
import { receiveStock } from "../../api/inventory";
import PageHeader from "../../components/PageHeader";
import ProductPicker from "../../components/ProductPicker";
import FormField from "../../components/FormField";
import Spinner from "../../components/Spinner";
import { useToast } from "../../components/Toast";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import clsx from "clsx";

export default function ReceiveStock() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPoId = searchParams.get("po");
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [selectedPoId, setSelectedPoId] = useState(preselectedPoId || "");
  const [lines, setLines] = useState([
    {
      id: 1,
      product_id: "",
      product_name: "",
      quantity: "",
      batch_code: "",
      unit_cost: "",
      expiry_date: "",
    },
  ]);
  const [serverError, setServerError] = useState("");

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () => getPurchaseOrders(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });

  // When PO is chosen, prefill receipt lines with remaining items
  useEffect(() => {
    if (!selectedPoId) return;
    const po = purchaseOrders.find((p) => String(p.id) === String(selectedPoId));
    if (po && po.items) {
      const now = new Date();
      const newLines = po.items.map((it, idx) => {
        const prod = products.find((p) => p.id === it.product_id);
        const remainingToReceive = Math.max(0, it.quantity - (it.received_qty || 0));
        return {
          id: idx + 1,
          product_id: it.product_id,
          product_name: it.product_name,
          quantity: remainingToReceive > 0 ? remainingToReceive : it.quantity,
          batch_code: `BCH-${prod?.sku || "RCV"}-${now.toISOString().slice(5, 10).replace("-", "")}`,
          unit_cost: it.unit_cost,
          expiry_date: prod?.has_expiry ? prod?.expiry_date || "" : "",
        };
      });
      setLines(newLines);
    }
  }, [selectedPoId, purchaseOrders, products]);

  const mutation = useMutation({
    mutationFn: (payload) => receiveStock(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["ai", "insights"] });

      showToast("Stock received. Inventory updated.");
      navigate("/stock");
    },
    onError: (err) => {
      setServerError(err.message || "Failed to receive stock");
    },
  });

  const handleLineChange = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = value;
    if (field === "product_id") {
      const prod = products.find((p) => p.id === Number(value));
      if (prod) {
        updated[index].product_name = prod.name;
        if (!updated[index].unit_cost && prod.purchase_cost) {
          updated[index].unit_cost = prod.purchase_cost;
        }
        if (prod.has_expiry && !updated[index].expiry_date) {
          updated[index].expiry_date = prod.expiry_date || "";
        }
      }
    }
    setLines(updated);
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      {
        id: Date.now(),
        product_id: "",
        product_name: "",
        quantity: "",
        batch_code: "",
        unit_cost: "",
        expiry_date: "",
      },
    ]);
  };

  const removeLine = (index) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validLines = lines.filter((l) => l.product_id && Number(l.quantity) > 0);
    if (validLines.length === 0) {
      setServerError("Please specify at least one product with a quantity to receive");
      return;
    }

    mutation.mutate({
      purchase_order_id: selectedPoId ? Number(selectedPoId) : null,
      lines: validLines.map((l) => ({
        product_id: Number(l.product_id),
        quantity: Number(l.quantity),
        quantity_received: Number(l.quantity),
        batch_code: l.batch_code.trim(),
        unit_cost: l.unit_cost ? Number(l.unit_cost) : null,
        expiry_date: l.expiry_date || null,
      })),
    });
  };

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Receive stock"
        description="Record incoming goods into inventory. Stock goes up only when goods are received."
        breadcrumbs={[
          { label: "Stock movements", to: "/stock" },
          { label: "Receive stock" },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {serverError && (
          <div
            role="alert"
            className="p-4 bg-status-danger-bg text-status-danger border border-status-danger/30 rounded-card text-[14px]"
          >
            {serverError}
          </div>
        )}

        {/* Purchase Order Selector */}
        <div className="p-5 bg-surface border border-border rounded-card">
          <FormField
            label="Linked purchase order (optional)"
            name="po"
            helper="Selecting a confirmed purchase order prefills ordered items and costs"
          >
            <select
              id="po"
              value={selectedPoId}
              onChange={(e) => setSelectedPoId(e.target.value)}
              className="w-full h-11 px-3 text-[14px] bg-surface border border-border-strong rounded-input text-text outline-none focus:border-primary"
            >
              <option value="">Direct receipt without purchase order</option>
              {purchaseOrders
                .filter((p) => p.status !== "CANCELLED" && p.status !== "RECEIVED")
                .map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.po_number} — {po.supplier_name} (Expected: {po.expected_delivery_date})
                  </option>
                ))}
            </select>
          </FormField>
        </div>

        {/* Lines */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-semibold text-text">Items to receive</h3>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary-hover px-2 py-1 rounded"
            >
              <Plus className="w-4 h-4 stroke-[2]" />
              <span>Add item</span>
            </button>
          </div>

          {lines.map((line, idx) => (
            <div
              key={line.id}
              className="p-5 bg-surface border border-border rounded-card relative space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-text-muted uppercase tracking-wider">
                  Item #{idx + 1} {line.product_name ? `• ${line.product_name}` : ""}
                </span>
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    aria-label="Remove item"
                    className="p-1 text-text-muted hover:text-status-danger rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                {/* Product */}
                <div className="sm:col-span-5">
                  <FormField label="Item" required>
                    <ProductPicker
                      products={products}
                      value={line.product_id}
                      onChange={(pid, pObj) => handleLineChange(idx, "product_id", pid)}
                    />
                  </FormField>
                </div>

                {/* Quantity */}
                <div className="sm:col-span-3">
                  <FormField label="Qty received" required>
                    <input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => handleLineChange(idx, "quantity", e.target.value)}
                      placeholder="0"
                      className="w-full h-11 px-3 text-[14px] tabular-nums font-semibold bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
                    />
                  </FormField>
                </div>

                {/* Batch Code */}
                <div className="sm:col-span-4">
                  <FormField label="Batch code" helper="Batch identifier for traceability">
                    <input
                      type="text"
                      value={line.batch_code}
                      onChange={(e) => handleLineChange(idx, "batch_code", e.target.value)}
                      placeholder="BCH-..."
                      className="w-full h-11 px-3 text-[14px] font-mono uppercase bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
                    />
                  </FormField>
                </div>

                {/* Unit Cost */}
                <div className="sm:col-span-4">
                  <FormField label="Unit cost (₹)">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.unit_cost}
                      onChange={(e) => handleLineChange(idx, "unit_cost", e.target.value)}
                      placeholder="0.00"
                      className="w-full h-10 px-3 text-[14px] tabular-nums bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
                    />
                  </FormField>
                </div>

                {/* Expiry Date */}
                <div className="sm:col-span-4">
                  <FormField label="Expiry date" helper="Leave empty if item does not expire">
                    <input
                      type="date"
                      value={line.expiry_date}
                      onChange={(e) => handleLineChange(idx, "expiry_date", e.target.value)}
                      className="w-full h-10 px-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
                    />
                  </FormField>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
          <button
            type="button"
            onClick={() => navigate("/stock")}
            className="h-11 px-5 text-[14px] font-medium text-text bg-surface border border-border-strong hover:bg-surface-muted rounded-btn transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="h-11 px-6 text-[15px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-btn transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {mutation.isPending && <Spinner size="sm" />}
            <span>Confirm receipt & update stock</span>
          </button>
        </div>
      </form>
    </div>
  );
}
