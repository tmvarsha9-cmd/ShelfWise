import { request, USE_MOCKS, ApiError } from "./client";
import { mockStore } from "./mocks/store";

export async function getMaterials() {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 60));
    return mockStore.materials;
  }
  return request("/materials");
}

export async function addMaterial(data) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 90));
    const nextId = Math.max(...mockStore.materials.map((m) => m.id), 100) + 1;
    const newMat = {
      id: nextId,
      sku: data.sku || `RM-MAT-${nextId}`,
      name: data.name,
      category: "Raw Materials",
      unit: data.unit || "kg",
      current_stock: Number(data.current_stock) || 0,
      reorder_level: Number(data.reorder_level) || 10,
      unit_cost: Number(data.unit_cost) || 0,
      supplier_id: data.supplier_id ? Number(data.supplier_id) : null,
      active: true,
    };
    mockStore.materials.push(newMat);
    mockStore.save();
    return newMat;
  }
  return request("/materials", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getBoms() {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 60));
    return mockStore.boms;
  }
  return request("/boms");
}

export async function saveBom(data) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 90));
    const existingIndex = mockStore.boms.findIndex(
      (b) => b.product_id === Number(data.product_id)
    );
    if (existingIndex >= 0) {
      mockStore.boms[existingIndex] = { ...mockStore.boms[existingIndex], ...data };
    } else {
      mockStore.boms.push({
        id: mockStore.boms.length + 1,
        ...data,
      });
    }
    mockStore.save();
    return data;
  }
  return request("/boms", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getProductionOrders() {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 60));
    return mockStore.productionOrders;
  }
  return request("/production-orders");
}

export async function getProductionOrderById(id) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 50));
    const ord = mockStore.productionOrders.find((o) => o.id === Number(id));
    if (!ord) throw new ApiError("Production order not found", 404);
    // Refresh current available quantities for materials check
    const updatedMaterials = (ord.materials_used || []).map((m) => {
      const mat = mockStore.materials.find((item) => item.id === m.material_id);
      return {
        ...m,
        available: mat ? mat.current_stock : 0,
      };
    });
    return { ...ord, materials_used: updatedMaterials };
  }
  return request(`/production-orders/${id}`);
}

export async function createProductionOrder(data) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 120));
    return mockStore.createProductionOrder(data);
  }
  return request("/production-orders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function completeProductionOrder(id, actualQuantity) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 140));
    return mockStore.completeProductionOrder(id, actualQuantity);
  }
  return request(`/production-orders/${id}/complete`, {
    method: "POST",
    body: JSON.stringify({ actual_quantity: actualQuantity }),
  });
}
