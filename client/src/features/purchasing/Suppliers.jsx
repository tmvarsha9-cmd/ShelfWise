import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Phone, Mail } from "lucide-react";
import { getSuppliers, addSupplier, updateSupplier } from "../../api/suppliers";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import StatusChip from "../../components/StatusChip";
import Drawer from "../../components/Drawer";
import FormField from "../../components/FormField";
import Spinner from "../../components/Spinner";
import { formatCurrency } from "../../lib/format";
import { useToast } from "../../components/Toast";

export default function Suppliers() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form, setForm] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    lead_time_days: 2,
    min_order_qty: 10,
    notes: "",
    active: true,
  });
  const [errors, setErrors] = useState({});

  const {
    data: suppliers = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });

  const mutation = useMutation({
    mutationFn: (payload) => {
      if (editingSupplier?.id) {
        return updateSupplier(editingSupplier.id, payload);
      }
      return addSupplier(payload);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      showToast(`Supplier ${saved.name} saved.`);
      setIsDrawerOpen(false);
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const openAdd = () => {
    setEditingSupplier(null);
    setForm({
      name: "",
      contact_person: "",
      phone: "",
      email: "",
      lead_time_days: 2,
      min_order_qty: 10,
      notes: "",
      active: true,
    });
    setErrors({});
    setIsDrawerOpen(true);
  };

  const openEdit = (supplier) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name || "",
      contact_person: supplier.contact_person || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      lead_time_days: supplier.lead_time_days || 2,
      min_order_qty: supplier.min_order_qty || 1,
      notes: supplier.notes || "",
      active: supplier.active !== false,
    });
    setErrors({});
    setIsDrawerOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Supplier name is required";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    mutation.mutate(form);
  };

  const columns = [
    {
      header: "Supplier name",
      field: "name",
      sortable: true,
      render: (s) => (
        <div>
          <span className="font-semibold text-text">{s.name}</span>
          {s.notes && <span className="block text-[12px] text-text-muted">{s.notes}</span>}
        </div>
      ),
    },
    {
      header: "Contact person",
      field: "contact_person",
      sortable: true,
      render: (s) => <span className="text-text font-medium">{s.contact_person || "—"}</span>,
    },
    {
      header: "Contact info",
      field: "phone",
      render: (s) => (
        <div className="text-[13px] text-text-muted space-y-0.5">
          {s.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>{s.phone}</span>
            </div>
          )}
          {s.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{s.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Delivery time",
      field: "lead_time_days",
      sortable: true,
      align: "right",
      render: (s) => `${s.lead_time_days || 0} days`,
    },
    {
      header: "Min. order",
      field: "min_order_qty",
      sortable: true,
      align: "right",
      render: (s) => `${s.min_order_qty || 1} units`,
    },
    {
      header: "Status",
      field: "active",
      render: (s) => (
        <StatusChip
          variant={s.active !== false ? "ok" : "neutral"}
          label={s.active !== false ? "Active" : "Inactive"}
        />
      ),
    },
    {
      header: "",
      field: "actions",
      align: "right",
      render: (s) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openEdit(s);
          }}
          className="p-1.5 text-text-muted hover:text-text rounded hover:bg-surface-muted transition-colors text-[13px] inline-flex items-center gap-1"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Vendors who supply goods, raw materials, and stock."
        action={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 h-11 px-4 text-[14px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-btn shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>Add supplier</span>
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={suppliers}
        keyField="id"
        caption="Suppliers registry table"
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        emptyMessage="No suppliers recorded."
        emptyActionLabel="Add supplier"
        onEmptyAction={openAdd}
        onRowClick={(s) => openEdit(s)}
      />

      {/* Add / Edit Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingSupplier ? `Edit ${editingSupplier.name}` : "Add supplier"}
        subtitle="Delivery time and minimum order defaults used in purchase orders."
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
              disabled={mutation.isPending}
              className="h-10 px-5 text-[14px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-btn transition-colors flex items-center gap-2"
            >
              {mutation.isPending && <Spinner size="sm" />}
              <span>{editingSupplier ? "Save supplier" : "Add supplier"}</span>
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Supplier name" name="name" required error={errors.name}>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Nandini Dairy Distributors"
              className="w-full h-10 px-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
            />
          </FormField>

          <FormField label="Contact person" name="contact_person">
            <input
              id="contact_person"
              type="text"
              value={form.contact_person}
              onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
              placeholder="e.g. Suresh Gowda"
              className="w-full h-10 px-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Phone number" name="phone">
              <input
                id="phone"
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98450 12345"
                className="w-full h-10 px-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
              />
            </FormField>

            <FormField label="Email address" name="email">
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="orders@vendor.in"
                className="w-full h-10 px-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Delivery time (days)" name="lead_time_days" helper="Average days from PO to delivery">
              <input
                id="lead_time_days"
                type="number"
                min="0"
                value={form.lead_time_days}
                onChange={(e) => setForm({ ...form, lead_time_days: e.target.value })}
                className="w-full h-10 px-3 text-[14px] tabular-nums bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
              />
            </FormField>

            <FormField label="Minimum order" name="min_order_qty" helper="Minimum order quantity in units">
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

          <FormField label="Notes & Terms" name="notes" helper="Credit days, delivery timeslots, payment instructions">
            <textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Delivery between 6:00 AM - 7:30 AM."
              className="w-full p-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
            />
          </FormField>
        </form>
      </Drawer>
    </div>
  );
}
