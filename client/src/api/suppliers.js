import { request, USE_MOCKS, ApiError } from "./client";
import { mockStore } from "./mocks/store";

export async function getSuppliers() {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 60));
    return mockStore.suppliers;
  }
  return request("/suppliers");
}

export async function getSupplierById(id) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 50));
    const s = mockStore.suppliers.find((sup) => sup.id === Number(id));
    if (!s) throw new ApiError("Supplier not found", 404);
    return s;
  }
  return request(`/suppliers/${id}`);
}

export async function addSupplier(supplier) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 100));
    const nextId = Math.max(...mockStore.suppliers.map((s) => s.id), 0) + 1;
    const newSupplier = {
      id: nextId,
      name: supplier.name,
      contact_person: supplier.contact_person || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      lead_time_days: Number(supplier.lead_time_days) || 1,
      min_order_qty: Number(supplier.min_order_qty) || 1,
      notes: supplier.notes || "",
      active: supplier.active !== false,
    };
    mockStore.suppliers.push(newSupplier);
    mockStore.save();
    return newSupplier;
  }
  return request("/suppliers", {
    method: "POST",
    body: JSON.stringify(supplier),
  });
}

export async function updateSupplier(id, updates) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 80));
    const s = mockStore.suppliers.find((sup) => sup.id === Number(id));
    if (!s) throw new ApiError("Supplier not found", 404);
    Object.assign(s, updates);
    mockStore.save();
    return s;
  }
  return request(`/suppliers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}
