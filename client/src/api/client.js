// Fetch helpers for the StockSense API.
async function request(path, options) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  return response.json();
}

export const getProducts = () => request("/api/products");
export const addProduct = (product) =>
  request("/api/products", { method: "POST", body: JSON.stringify(product) });
export const updateStock = (id, current_stock) =>
  request(`/api/products/${id}/stock`, {
    method: "PATCH",
    body: JSON.stringify({ current_stock }),
  });
export const getInsights = () => request("/api/insights");
export const simulate = (productId, demandChangePct) =>
  request("/api/simulate", {
    method: "POST",
    body: JSON.stringify({ productId, demandChangePct }),
  });
export const explain = (id) => request(`/api/explain/${id}`, { method: "POST" });
