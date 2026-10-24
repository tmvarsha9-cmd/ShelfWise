import { request, USE_MOCKS, ApiError } from "./client";
import { mockStore } from "./mocks/store";

export async function getProducts(params = {}) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 80));
    return mockStore.getProducts(params);
  }

  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") query.append(k, v);
  });
  const qs = query.toString() ? `?${query.toString()}` : "";
  return request(`/products${qs}`);
}

export async function getProductById(id) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 60));
    const p = mockStore.getProductById(id);
    if (!p) throw new ApiError("Product not found", 404);
    return p;
  }
  return request(`/products/${id}`);
}

export async function addProduct(product) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 120));
    try {
      return mockStore.addProduct(product);
    } catch (err) {
      if (err.field === "sku") {
        throw new ApiError(err.message, 422, "DUPLICATE_SKU", { field: "sku" });
      }
      throw err;
    }
  }
  return request("/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export async function updateProduct(id, updates) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 100));
    return mockStore.updateProduct(id, updates);
  }
  return request(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function removeProduct(id) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 120));
    return mockStore.removeProduct(id);
  }
  return request(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ active: false }),
  });
}

export async function getProductBatches(id) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 50));
    const numId = Number(id);
    return mockStore.batches.filter((b) => b.product_id === numId);
  }
  return request(`/products/${id}/batches`);
}
