import { request, USE_MOCKS, ApiError } from "./client";
import { mockStore } from "./mocks/store";

export async function getPurchaseOrders(params = {}) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 70));
    let list = [...mockStore.purchaseOrders];
    if (params.status) {
      list = list.filter((po) => po.status === params.status);
    }
    if (params.supplier_id) {
      list = list.filter((po) => po.supplier_id === Number(params.supplier_id));
    }
    return list;
  }
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) query.append(k, v);
  });
  return request(`/purchase-orders?${query.toString()}`);
}

export async function getPurchaseOrderById(id) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 60));
    const po = mockStore.purchaseOrders.find((p) => p.id === Number(id));
    if (!po) throw new ApiError("Purchase order not found", 404);
    return po;
  }
  return request(`/purchase-orders/${id}`);
}

export async function createPurchaseOrder(poData) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 140));
    return mockStore.createPurchaseOrder(poData);
  }
  return request("/purchase-orders", {
    method: "POST",
    body: JSON.stringify(poData),
  });
}

export async function cancelPurchaseOrder(id) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 100));
    return mockStore.cancelPurchaseOrder(id);
  }
  return request(`/purchase-orders/${id}/cancel`, {
    method: "POST",
  });
}

export async function receivePurchaseOrder(id, lines) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 150));
    return mockStore.receiveStock({ purchase_order_id: id, lines });
  }
  return request(`/purchase-orders/${id}/receive`, {
    method: "POST",
    body: JSON.stringify({ lines }),
  });
}
