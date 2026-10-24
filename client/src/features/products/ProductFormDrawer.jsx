import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addProduct, updateProduct } from "../../api/products";
import { getCategories } from "../../api/categories";
import { getSuppliers } from "../../api/suppliers";
import Drawer from "../../components/Drawer";
import FormField from "../../components/FormField";
import Spinner from "../../components/Spinner";
import { SOURCE_TYPES } from "../../lib/constants";
import clsx from "clsx";

export default function ProductFormDrawer({
  isOpen,
  onClose,
  initialData = null,
  onSuccess,
}) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(initialData?.id);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "Grocery",
    category_id: 2,
    unit: "pcs",
    source_type: SOURCE_TYPES.PURCHASED,
    current_stock: 0,
    reorder_level: 20,
    unit_price: "",
    purchase_cost: "",
    lead_time_days: 2,
    min_order_qty: 1,
    supplier_id: "",
    has_expiry: false,
    shelf_life_days: "",
    expiry_date: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        sku: initialData.sku || "",
        category: initialData.category || "Grocery",
        category_id: initialData.category_id || 1,
        unit: initialData.unit || "pcs",
        source_type: initialData.source_type || SOURCE_TYPES.PURCHASED,
        current_stock: initialData.current_stock ?? 0,
        reorder_level: initialData.reorder_level ?? 20,
        unit_price: initialData.unit_price ?? "",
        purchase_cost: initialData.purchase_cost ?? "",
        lead_time_days: initialData.lead_time_days ?? 2,
        min_order_qty: initialData.min_order_qty ?? 1,
        supplier_id: initialData.supplier_id ? String(initialData.supplier_id) : "",
        has_expiry: Boolean(initialData.has_expiry || initialData.expiry_date),
        shelf_life_days: initialData.shelf_life_days ?? "",
        expiry_date: initialData.expiry_date ?? "",
      });
    } else {
      setForm({
        name: "",
        sku: "",
        category: "Grocery",
        category_id: 2,
        unit: "pcs",
        source_type: SOURCE_TYPES.PURCHASED,
        current_stock: 0,
        reorder_level: 20,
        unit_price: "",
        purchase_cost: "",
        lead_time_days: 2,
        min_order_qty: 1,
        supplier_id: "",
        has_expiry: false,
        shelf_life_days: "",
        expiry_date: "",
      });
    }
    setErrors({});
    setServerError("");
  }, [initialData, isOpen]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Product name is required";
    if (!form.sku.trim()) errs.sku = "Item code is required";
    if (!form.category) errs.category = "Category is required";
    if (!form.unit.trim()) errs.unit = "Unit of measure is required";
    if (form.unit_price === "" || Number(form.unit_price) < 0) {
      errs.unit_price = "Enter a valid selling price";
    }
    if (form.source_type === SOURCE_TYPES.PURCHASED) {
      if (form.purchase_cost === "" || Number(form.purchase_cost) < 0) {
        errs.purchase_cost = "Enter a valid purchase cost";
      }
    }
    if (form.has_expiry && !form.expiry_date && !isEditing) {
      errs.expiry_date = "Initial expiry date is required for perishable items";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const mutation = useMutation({
    mutationFn: (payload) => {
      if (isEditing) {
        return updateProduct(initialData.id, payload);
      }
      return addProduct(payload);
    },
    onSuccess: (savedProduct) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["ai", "insights"] });
      if (onSuccess) onSuccess(savedProduct);
      onClose();
    },
    onError: (err) => {
      if (err.details?.field === "sku" || err.code === "DUPLICATE_SKU") {
        setErrors((prev) => ({ ...prev, sku: "This item code already exists." }));
      } else {
        setServerError(err.message || "Failed to save product.");
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate(form);
  };

  const handleBlur = (field) => {
    if (field === "name" && !form.name.trim()) {
      setErrors((p) => ({ ...p, name: "Product name is required" }));
    }
    if (field === "sku" && !form.sku.trim()) {
      setErrors((p) => ({ ...p, sku: "Item code is required" }));
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit ${initialData?.name}` : "Add new product"}
      subtitle="Complete product details for inventory management and replenishment advice."
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 text-[14px] font-medium text-text bg-surface border border-border-strong hover:bg-surface-muted rounded-btn transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="h-10 px-5 text-[14px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-btn transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {mutation.isPending && <Spinner size="sm" />}
            <span>{isEditing ? "Save changes" : "Add product"}</span>
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {serverError && (
          <div
            role="alert"
            className="p-3.5 bg-status-danger-bg text-status-danger border border-status-danger/30 rounded-card text-[14px]"
          >
            {serverError}
          </div>
        )}

        {/* Section 1: Basics */}
        <div>
          <h3 className="text-[15px] font-semibold text-text uppercase tracking-wider mb-3 pb-1 border-b border-border">
            1. Basics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Product name" name="name" required error={errors.name}>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onBlur={() => handleBlur("name")}
                placeholder="e.g. Bread, Rice 5kg"
                className="w-full h-10 px-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
              />
            </FormField>

            <FormField
              label="Item code"
              name="sku"
              required
              helper="Unique inventory identifier (e.g. BRD-001)"
              error={errors.sku}
            >
              <input
                id="sku"
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                onBlur={() => handleBlur("sku")}
                placeholder="BRD-001"
                className="w-full h-10 px-3 text-[14px] font-mono bg-surface border border-border-strong rounded-input outline-none focus:border-primary uppercase"
              />
            </FormField>

            <FormField label="Category" name="category" required error={errors.category}>
              <select
                id="category"
                value={form.category}
                onChange={(e) => {
                  const cat = categories.find((c) => c.name === e.target.value);
                  setForm({
                    ...form,
                    category: e.target.value,
                    category_id: cat ? cat.id : 1,
                  });
                }}
                className="w-full h-10 px-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Unit of measure" name="unit" required helper="e.g. pcs, pack, kg, litre, tray">
              <input
                id="unit"
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="pcs"
                className="w-full h-10 px-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
              />
            </FormField>
          </div>
        </div>

        {/* Section 2: How you get it */}
        <div>
          <h3 className="text-[15px] font-semibold text-text uppercase tracking-wider mb-3 pb-1 border-b border-border">
            2. How you get it
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {/* Radio card 1: Bought from supplier */}
            <div
              onClick={() => setForm({ ...form, source_type: SOURCE_TYPES.PURCHASED })}
              className={clsx(
                "p-4 rounded-card border-2 cursor-pointer transition-colors select-none",
                form.source_type === SOURCE_TYPES.PURCHASED
                  ? "border-primary bg-primary-subtle/40"
                  : "border-border bg-surface hover:border-border-strong"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="radio"
                  id="source-purchased"
                  name="source_type"
                  checked={form.source_type === SOURCE_TYPES.PURCHASED}
                  onChange={() => setForm({ ...form, source_type: SOURCE_TYPES.PURCHASED })}
                  className="accent-primary"
                />
                <label htmlFor="source-purchased" className="font-semibold text-[14px] text-text cursor-pointer">
                  Bought from a supplier
                </label>
              </div>
              <p className="text-[13px] text-text-muted pl-5">
                Ordered from external wholesale vendors and distributors.
              </p>
            </div>

            {/* Radio card 2: Made in-house */}
            <div
              onClick={() => setForm({ ...form, source_type: SOURCE_TYPES.MANUFACTURED })}
              className={clsx(
                "p-4 rounded-card border-2 cursor-pointer transition-colors select-none",
                form.source_type === SOURCE_TYPES.MANUFACTURED
                  ? "border-primary bg-primary-subtle/40"
                  : "border-border bg-surface hover:border-border-strong"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="radio"
                  id="source-manufactured"
                  name="source_type"
                  checked={form.source_type === SOURCE_TYPES.MANUFACTURED}
                  onChange={() => setForm({ ...form, source_type: SOURCE_TYPES.MANUFACTURED })}
                  className="accent-primary"
                />
                <label htmlFor="source-manufactured" className="font-semibold text-[14px] text-text cursor-pointer">
                  Made in-house
                </label>
              </div>
              <p className="text-[13px] text-text-muted pl-5">
                Prepared or produced on site using ingredients or raw materials.
              </p>
            </div>
          </div>

          {/* Conditional Fields based on How you get it */}
          {form.source_type === SOURCE_TYPES.PURCHASED ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-surface-muted rounded-card border border-border">
              <FormField label="Supplier" name="supplier_id">
                <select
                  id="supplier_id"
                  value={form.supplier_id}
                  onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                  className="w-full h-10 px-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
                >
                  <option value="">Select a supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Purchase cost (₹)"
                name="purchase_cost"
                required
                error={errors.purchase_cost}
              >
                <input
                  id="purchase_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.purchase_cost}
                  onChange={(e) => setForm({ ...form, purchase_cost: e.target.value })}
                  placeholder="0.00"
                  className="w-full h-10 px-3 text-[14px] tabular-nums bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
                />
              </FormField>

              <FormField
                label="Delivery time (days)"
                name="lead_time_days"
                helper="Days between ordering and delivery"
              >
                <input
                  id="lead_time_days"
                  type="number"
                  min="0"
                  value={form.lead_time_days}
                  onChange={(e) => setForm({ ...form, lead_time_days: e.target.value })}
                  className="w-full h-10 px-3 text-[14px] tabular-nums bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
                />
              </FormField>

              <FormField label="Minimum order" name="min_order_qty" helper="Supplier MOQ in units">
                <input
                  id="min_order_qty"
                  type="number"
                  min="1"
                  value={form.min_order_qty}
                  onChange={(e) => setForm({ ...form, min_order_qty: e.target.value })}
                  className="w-full h-10 px-3 text-[14px] tabular-nums bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
                />
              </FormField>
            </div>
          ) : (
            <div className="p-4 bg-surface-muted rounded-card border border-border">
              <p className="text-[13px] text-text-muted mb-2">
                This item is produced in-house. You can link recipes and raw materials in the <strong>Making</strong> section.
              </p>
              <FormField label="Estimated production lead time (days)" name="lead_time_days">
                <input
                  id="lead_time_days"
                  type="number"
                  min="0"
                  value={form.lead_time_days}
                  onChange={(e) => setForm({ ...form, lead_time_days: e.target.value })}
                  className="w-full max-w-xs h-10 px-3 text-[14px] tabular-nums bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
                />
              </FormField>
            </div>
          )}
        </div>

        {/* Section 3: Stock rules */}
        <div>
          <h3 className="text-[15px] font-semibold text-text uppercase tracking-wider mb-3 pb-1 border-b border-border">
            3. Stock rules & Pricing
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Selling price (₹)"
              name="unit_price"
              required
              error={errors.unit_price}
            >
              <input
                id="unit_price"
                type="number"
                step="0.01"
                min="0"
                value={form.unit_price}
                onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                placeholder="0.00"
                className="w-full h-10 px-3 text-[14px] tabular-nums bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
              />
            </FormField>

            <FormField
              label="Reorder when stock falls to"
              name="reorder_level"
              helper="Alert triggers at or below this count"
            >
              <input
                id="reorder_level"
                type="number"
                min="0"
                value={form.reorder_level}
                onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
                className="w-full h-10 px-3 text-[14px] tabular-nums bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
              />
            </FormField>

            {!isEditing && (
              <FormField
                label="Opening stock count"
                name="current_stock"
                helper="Initial stock present right now"
              >
                <input
                  id="current_stock"
                  type="number"
                  min="0"
                  value={form.current_stock}
                  onChange={(e) => setForm({ ...form, current_stock: e.target.value })}
                  className="w-full h-10 px-3 text-[14px] tabular-nums bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
                />
              </FormField>
            )}
          </div>
        </div>

        {/* Section 4: Expiry */}
        <div>
          <h3 className="text-[15px] font-semibold text-text uppercase tracking-wider mb-3 pb-1 border-b border-border">
            4. Expiry & Shelf Life
          </h3>
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.has_expiry}
                onChange={(e) => setForm({ ...form, has_expiry: e.target.checked })}
                className="accent-primary w-4 h-4 rounded"
              />
              <span className="text-[14px] font-medium text-text">
                Does this item expire? (Perishable)
              </span>
            </label>

            {form.has_expiry && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-surface-muted rounded-card border border-border">
                <FormField label="Shelf life (days)" name="shelf_life_days">
                  <input
                    id="shelf_life_days"
                    type="number"
                    min="1"
                    value={form.shelf_life_days}
                    onChange={(e) => setForm({ ...form, shelf_life_days: e.target.value })}
                    placeholder="e.g. 3"
                    className="w-full h-10 px-3 text-[14px] tabular-nums bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
                  />
                </FormField>

                {!isEditing && (
                  <FormField
                    label="Initial batch expiry date"
                    name="expiry_date"
                    required
                    error={errors.expiry_date}
                  >
                    <input
                      id="expiry_date"
                      type="date"
                      value={form.expiry_date}
                      onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                      className="w-full h-10 px-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
                    />
                  </FormField>
                )}
              </div>
            )}
          </div>
        </div>
      </form>
    </Drawer>
  );
}
