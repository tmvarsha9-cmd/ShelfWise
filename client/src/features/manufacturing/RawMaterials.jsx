import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Boxes } from "lucide-react";
import { getMaterials, addMaterial } from "../../api/manufacturing";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import StatusChip from "../../components/StatusChip";
import Drawer from "../../components/Drawer";
import FormField from "../../components/FormField";
import Spinner from "../../components/Spinner";
import { formatNumber, formatCurrency } from "../../lib/format";
import { useToast } from "../../components/Toast";

export default function RawMaterials() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    unit: "kg",
    current_stock: "",
    reorder_level: 20,
    unit_cost: "",
  });
  const [errors, setErrors] = useState({});

  const {
    data: materials = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["materials"],
    queryFn: getMaterials,
  });

  const addMutation = useMutation({
    mutationFn: (data) => addMaterial(data),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      showToast(`Material ${saved.name} added`);
      setIsDrawerOpen(false);
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Material name is required";
    if (form.current_stock === "") errs.current_stock = "Enter current stock";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    addMutation.mutate(form);
  };

  const columns = [
    {
      header: "Material code",
      field: "sku",
      sortable: true,
      isMono: true,
    },
    {
      header: "Name",
      field: "name",
      sortable: true,
      render: (m) => <span className="font-semibold text-text">{m.name}</span>,
    },
    {
      header: "In stock",
      field: "current_stock",
      sortable: true,
      align: "right",
      render: (m) => (
        <span className="font-medium">
          {formatNumber(m.current_stock)} {m.unit}
        </span>
      ),
    },
    {
      header: "Reorder level",
      field: "reorder_level",
      sortable: true,
      align: "right",
      render: (m) => `${m.reorder_level} ${m.unit}`,
    },
    {
      header: "Cost / unit",
      field: "unit_cost",
      sortable: true,
      align: "right",
      render: (m) => formatCurrency(m.unit_cost),
    },
    {
      header: "Status",
      field: "status",
      render: (m) => {
        if (m.current_stock <= 0) return <StatusChip variant="danger" label="Out of stock" />;
        if (m.current_stock <= m.reorder_level) return <StatusChip variant="warning" label="Low stock" />;
        return <StatusChip variant="ok" label="In stock" />;
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Raw materials"
        description="Ingredients, flour, culture, packaging and bulk materials for in-house recipes."
        action={
          <button
            type="button"
            onClick={() => {
              setForm({ name: "", sku: "", unit: "kg", current_stock: "", reorder_level: 20, unit_cost: "" });
              setErrors({});
              setIsDrawerOpen(true);
            }}
            className="inline-flex items-center gap-2 h-11 px-4 text-[14px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-btn shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>Add material</span>
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={materials}
        keyField="id"
        caption="Raw materials inventory table"
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        emptyMessage="No raw materials registered."
        emptyActionLabel="Add material"
        onEmptyAction={() => setIsDrawerOpen(true)}
      />

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Add raw material"
        subtitle="Track stock and link this material to recipe bills of materials."
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
              disabled={addMutation.isPending}
              className="h-10 px-5 text-[14px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-btn transition-colors flex items-center gap-2"
            >
              {addMutation.isPending && <Spinner size="sm" />}
              <span>Add material</span>
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Material name" name="name" required error={errors.name}>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Wheat Flour (Maida)"
              className="w-full h-10 px-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
            />
          </FormField>

          <FormField label="Material code" name="sku" helper="Optional item code (e.g. RM-FLR-01)">
            <input
              id="sku"
              type="text"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
              placeholder="RM-..."
              className="w-full h-10 px-3 text-[14px] font-mono bg-surface border border-border-strong rounded-input outline-none focus:border-primary uppercase"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Unit of measure" name="unit" required>
              <input
                id="unit"
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="kg, litre"
                className="w-full h-10 px-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
              />
            </FormField>

            <FormField label="Initial stock" name="stock" required error={errors.current_stock}>
              <input
                id="stock"
                type="number"
                min="0"
                value={form.current_stock}
                onChange={(e) => setForm({ ...form, current_stock: e.target.value })}
                className="w-full h-10 px-3 text-[14px] tabular-nums bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Reorder alert level" name="reorder">
              <input
                id="reorder"
                type="number"
                min="0"
                value={form.reorder_level}
                onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
                className="w-full h-10 px-3 text-[14px] tabular-nums bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
              />
            </FormField>

            <FormField label="Cost per unit (₹)" name="cost">
              <input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={form.unit_cost}
                onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
                className="w-full h-10 px-3 text-[14px] tabular-nums bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
              />
            </FormField>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
