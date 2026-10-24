import { request, USE_MOCKS, ApiError } from "./client";
import { mockStore } from "./mocks/store";

export async function getInventorySummary() {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 80));
    return mockStore.getSummary();
  }
  return request("/inventory/summary");
}

export async function getInventoryTransactions(params = {}) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 60));
    let list = [...mockStore.transactions];

    if (params.product_id) {
      list = list.filter((t) => t.product_id === Number(params.product_id));
    }
    if (params.type) {
      list = list.filter((t) => t.type === params.type);
    }
    if (params.startDate) {
      list = list.filter((t) => t.created_at.slice(0, 10) >= params.startDate);
    }
    if (params.endDate) {
      list = list.filter((t) => t.created_at.slice(0, 10) <= params.endDate);
    }
    return list;
  }

  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) query.append(k, v);
  });
  return request(`/inventory/transactions?${query.toString()}`);
}

export async function recordStockIssue({ items, reason, note, idempotencyKey }) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 120));
    try {
      return mockStore.recordIssue({ items, reason, note, idempotencyKey });
    } catch (err) {
      throw new ApiError(err.message, err.status || 400, "STOCK_ISSUE_FAILED");
    }
  }

  return request("/inventory/issues", {
    method: "POST",
    headers: {
      "X-Idempotency-Key": idempotencyKey || `idem-${Date.now()}`,
    },
    body: JSON.stringify({ items, reason, note }),
  });
}

export async function receiveStock({ purchase_order_id, lines }) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 150));
    return mockStore.receiveStock({ purchase_order_id, lines });
  }

  if (purchase_order_id) {
    return request(`/purchase-orders/${purchase_order_id}/receive`, {
      method: "POST",
      body: JSON.stringify({ lines }),
    });
  }
  return request("/inventory/receive", {
    method: "POST",
    body: JSON.stringify({ lines }),
  });
}
