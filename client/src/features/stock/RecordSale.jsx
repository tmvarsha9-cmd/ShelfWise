import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { getProducts } from "../../api/products";
import { recordStockIssue } from "../../api/inventory";
import PageHeader from "../../components/PageHeader";
import ProductPicker from "../../components/ProductPicker";
import NumberStepper from "../../components/NumberStepper";
import FormField from "../../components/FormField";
import Spinner from "../../components/Spinner";
import { ISSUE_REASONS } from "../../lib/constants";
import { formatNumber } from "../../lib/format";
import { useToast } from "../../components/Toast";
import clsx from "clsx";

export default function RecordSale() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [lines, setLines] = useState([
    { id: 1, product_id: "", quantity: 1, product: null },
  ]);
  const [reason, setReason] = useState("SALE");
  const [note, setNote] = useState("");
  const [serverError, setServerError] = useState("");

  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });

  const mutation = useMutation({
    mutationFn: (payload) => recordStockIssue(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["ai", "insights"] });

      showToast(data.message || "Sale recorded successfully.");
      navigate("/stock");
    },
    onError: (err) => {
      setServerError(err.message || "Could not record sale. Please try again.");
    },
  });

  const handleProductChange = (lineIndex, productId, productObj) => {
    const updated = [...lines];
    updated[lineIndex].product_id = productId;
    updated[lineIndex].product = productObj;
    // Default quantity 1 if current stock > 0
    if (productObj && productObj.current_stock < updated[lineIndex].quantity) {
      updated[lineIndex].quantity = Math.max(1, productObj.current_stock);
    }
    setLines(updated);
    setServerError("");
  };

  const handleQuantityChange = (lineIndex, newQty) => {
    const updated = [...lines];
    updated[lineIndex].quantity = newQty;
    setLines(updated);
    setServerError("");
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { id: Date.now(), product_id: "", quantity: 1, product: null },
    ]);
  };

  const removeLine = (lineIndex) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== lineIndex));
  };

  // Validation: check if every line has a product and enough stock
  let hasInsufficientStock = false;
  let validationMessage = "";

  for (const line of lines) {
    if (!line.product_id || !line.product) {
      validationMessage = "Select a product for each line";
      break;
    }
    const qty = Number(line.quantity) || 0;
    if (qty <= 0) {
      validationMessage = "Quantity must be at least 1";
      break;
    }
    if (qty > line.product.current_stock) {
      hasInsufficientStock = true;
      validationMessage = `Only ${line.product.current_stock} ${line.product.name} in stock. You can't issue ${qty}.`;
      break;
    }
  }

  const isFormValid = lines.every((l) => l.product_id && l.product) && !hasInsufficientStock && !validationMessage;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid || mutation.isPending) return;

    // Generate unique idempotency key for this submit
    const idempotencyKey = `sale-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    mutation.mutate({
      items: lines.map((l) => ({
        product_id: Number(l.product_id),
        quantity: Number(l.quantity),
      })),
      reason,
      note: note.trim(),
      idempotencyKey,
    });
  };

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Record a sale or stock out"
        description="Fast stock adjustment. Stock is deducted immediately."
        breadcrumbs={[
          { label: "Stock movements", to: "/stock" },
          { label: "Record a sale" },
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

        {/* Reason and Note */}
        <div className="p-5 bg-surface border border-border rounded-card grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Reason for issue" name="reason" required>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-11 px-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary font-medium"
            >
              {ISSUE_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Optional note" name="note" helper="Customer receipt #, damaged cause, etc.">
            <input
              id="note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Counter counter receipt #108"
              className="w-full h-11 px-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
            />
          </FormField>
        </div>

        {/* Product Items Lines */}
        <div className="space-y-4">
          {lines.map((line, idx) => {
            const prod = line.product;
            const currentStock = prod ? prod.current_stock : 0;
            const enteredQty = Number(line.quantity) || 0;
            const stockRemainingAfter = currentStock - enteredQty;
            const isLineOverStock = prod && enteredQty > currentStock;

            return (
              <div
                key={line.id}
                className="p-5 bg-surface border border-border rounded-card relative space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-text-muted uppercase tracking-wider">
                    Item #{idx + 1}
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
                  {/* Product Picker */}
                  <div className="sm:col-span-7">
                    <FormField label="Select item" required>
                      <ProductPicker
                        products={products}
                        value={line.product_id}
                        onChange={(pid, pObj) => handleProductChange(idx, pid, pObj)}
                      />
                    </FormField>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="sm:col-span-5">
                    <FormField label="Quantity" required>
                      <NumberStepper
                        value={line.quantity}
                        onChange={(newVal) => handleQuantityChange(idx, newVal)}
                        min={1}
                        max={prod ? Math.max(1, prod.current_stock) : 9999}
                        disabled={!prod || currentStock <= 0}
                      />
                    </FormField>
                  </div>
                </div>

                {/* Stock status indicator line */}
                {prod && (
                  <div className="pt-2 border-t border-border flex items-center justify-between text-[13px]">
                    <span className="text-text-muted">
                      Current in stock: <strong>{currentStock} {prod.unit}</strong>
                    </span>

                    {isLineOverStock ? (
                      <span className="text-status-danger font-semibold">
                        Only {currentStock} in stock.
                      </span>
                    ) : (
                      <span className="text-text-muted">
                        After this,{" "}
                        <strong className="text-text tabular-nums">
                          {stockRemainingAfter} {prod.unit}
                        </strong>{" "}
                        will be left.
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Another Item Button */}
        <div>
          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-2 h-10 px-4 text-[14px] font-medium text-text bg-surface border border-border-strong hover:bg-surface-muted rounded-btn transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>Add another item</span>
          </button>
        </div>

        {/* Validation warning if any */}
        {validationMessage && (
          <div className="p-3 bg-status-warning-bg text-status-warning border border-status-warning/30 rounded-card text-[13px] font-medium">
            {validationMessage}
          </div>
        )}

        {/* Actions Strip */}
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
            disabled={!isFormValid || mutation.isPending}
            className="h-11 px-6 text-[15px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-btn transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {mutation.isPending && <Spinner size="sm" />}
            <span>Record sale</span>
          </button>
        </div>
      </form>
    </div>
  );
}
