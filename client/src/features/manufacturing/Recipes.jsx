import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { getBoms, saveBom, getMaterials } from "../../api/manufacturing";
import { getProducts } from "../../api/products";
import PageHeader from "../../components/PageHeader";
import Drawer from "../../components/Drawer";
import FormField from "../../components/FormField";
import Spinner from "../../components/Spinner";
import { formatNumber } from "../../lib/format";
import { useToast } from "../../components/Toast";
import { SOURCE_TYPES } from "../../lib/constants";

export default function Recipes() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBom, setSelectedBom] = useState(null);

  // Form state
  const [productId, setProductId] = useState("");
  const [productionHours, setProductionHours] = useState(2);
  const [items, setItems] = useState([
    { material_id: "", quantity: 0.1, unit: "kg" },
  ]);
  const [serverError, setServerError] = useState("");

  const {
    data: boms = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["boms"],
    queryFn: getBoms,
  });

  const { data: materials = [] } = useQuery({
    queryKey: ["materials"],
    queryFn: getMaterials,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });

  const manufacturedProducts = products.filter(
    (p) => p.source_type === SOURCE_TYPES.MANUFACTURED
  );

  const saveMutation = useMutation({
    mutationFn: (payload) => saveBom(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["boms"] });
      showToast(`Recipe saved.`);
      setIsDrawerOpen(false);
    },
    onError: (err) => setServerError(err.message || "Failed to save recipe"),
  });

  const openEdit = (bom) => {
    setSelectedBom(bom);
    setProductId(String(bom.product_id));
    setProductionHours(bom.production_time_hours || 2);
    setItems(
      bom.items.map((it) => ({
        material_id: it.material_id,
        quantity: it.quantity,
        unit: it.unit,
      }))
    );
    setServerError("");
    setIsDrawerOpen(true);
  };

  const openNew = () => {
    setSelectedBom(null);
    setProductId(manufacturedProducts[0] ? String(manufacturedProducts[0].id) : "");
    setProductionHours(2);
    setItems([{ material_id: materials[0]?.id || "", quantity: 0.1, unit: materials[0]?.unit || "kg" }]);
    setServerError("");
    setIsDrawerOpen(true);
  };

  const handleMaterialChange = (idx, matId) => {
    const mat = materials.find((m) => m.id === Number(matId));
    const updated = [...items];
    updated[idx].material_id = Number(matId);
    if (mat) updated[idx].unit = mat.unit;
    setItems(updated);
  };

  const handleQuantityChange = (idx, qty) => {
    const updated = [...items];
    updated[idx].quantity = Number(qty);
    setItems(updated);
  };

  const addIngredient = () => {
    setItems((prev) => [
      ...prev,
      { material_id: materials[0]?.id || "", quantity: 0.1, unit: materials[0]?.unit || "kg" },
    ]);
  };

  const removeIngredient = (idx) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!productId) {
      setServerError("Please select a manufactured product");
      return;
    }
    const targetProd = products.find((p) => p.id === Number(productId));
    const validItems = items.filter((it) => it.material_id && it.quantity > 0);
    if (validItems.length === 0) {
      setServerError("Please add at least one ingredient with a quantity");
      return;
    }

    const recipeItems = validItems.map((it) => {
      const mat = materials.find((m) => m.id === it.material_id);
      return {
        material_id: it.material_id,
        material_name: mat ? mat.name : "Material",
        quantity: it.quantity,
        unit: it.unit,
      };
    });

    saveMutation.mutate({
      product_id: Number(productId),
      product_name: targetProd ? targetProd.name : "Product",
      yield_quantity: 1,
      yield_unit: targetProd ? targetProd.unit : "pcs",
      production_time_hours: Number(productionHours) || 2,
      items: recipeItems,
    });
  };

  const targetProdName = products.find((p) => String(p.id) === String(productId))?.name || "product";

  return (
    <div>
      <PageHeader
        title="Recipes (Bills of materials)"
        description="Standard recipe formulas for items made in-house. Defines ingredients required to produce one unit."
        action={
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-2 h-11 px-4 text-[14px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-btn shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>New recipe</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {boms.map((bom) => (
          <div
            key={bom.id}
            className="bg-surface border border-border rounded-card p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                <div>
                  <h3 className="text-[17px] font-semibold text-text">{bom.product_name}</h3>
                  <span className="text-[12px] text-text-muted">
                    Yield: 1 {bom.yield_unit || "pcs"} • Takes ~{bom.production_time_hours || 2} hours
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openEdit(bom)}
                  className="p-1.5 text-text-muted hover:text-text rounded hover:bg-surface-muted transition-colors text-[13px] inline-flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit recipe</span>
                </button>
              </div>

              <h4 className="text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                What goes into one {bom.product_name}
              </h4>
              <ul className="divide-y divide-border text-[14px]">
                {bom.items.map((item, idx) => (
                  <li key={idx} className="py-2 flex items-center justify-between">
                    <span className="text-text">{item.material_name}</span>
                    <span className="tabular-nums font-semibold text-primary">
                      {item.quantity} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Recipe Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedBom ? `Edit recipe: ${selectedBom.product_name}` : "Create recipe"}
        subtitle={`Configure the ingredients required for one unit of ${targetProdName}.`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="h-10 px-4 text-[14px] font-medium text-text bg-surface border border-border-strong hover:bg-surface-muted rounded-btn transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saveMutation.isPending}
              className="h-10 px-5 text-[14px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-btn transition-colors flex items-center gap-2"
            >
              {saveMutation.isPending && <Spinner size="sm" />}
              <span>Save recipe</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Finished product" name="product" required>
              <select
                id="product"
                value={productId}
                disabled={Boolean(selectedBom)}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full h-10 px-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary disabled:opacity-60"
              >
                {manufacturedProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unit})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Standard production time (hours)" name="time">
              <input
                id="time"
                type="number"
                min="0.5"
                step="0.5"
                value={productionHours}
                onChange={(e) => setProductionHours(e.target.value)}
                className="w-full h-10 px-3 text-[14px] tabular-nums bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
              />
            </FormField>
          </div>

          <div>
            <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
              <h4 className="text-[14px] font-semibold text-text uppercase tracking-wider">
                What goes into one {targetProdName}
              </h4>
              <button
                type="button"
                onClick={addIngredient}
                className="text-[13px] font-medium text-primary hover:text-primary-hover inline-flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add ingredient</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-surface-muted rounded-card border border-border"
                >
                  <div className="flex-1">
                    <select
                      value={it.material_id}
                      onChange={(e) => handleMaterialChange(idx, e.target.value)}
                      className="w-full h-10 px-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
                    >
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-32">
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={it.quantity}
                      onChange={(e) => handleQuantityChange(idx, e.target.value)}
                      placeholder="Qty"
                      className="w-full h-10 px-3 text-[14px] tabular-nums font-semibold bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
                    />
                  </div>

                  <span className="text-[14px] text-text-muted w-12">{it.unit}</span>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(idx)}
                      aria-label="Remove ingredient"
                      className="p-2 text-text-muted hover:text-status-danger rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
