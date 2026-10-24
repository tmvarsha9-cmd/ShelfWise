// Dashboard totals, low-stock list, and expiry tracking (Member 1).
import { useEffect, useState } from "react";
import { getProducts } from "../api/client.js";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getProducts().then(setProducts).catch((err) => setError(err.message));
  }, []);

  const lowStock = products.filter(
    (product) => product.current_stock <= product.reorder_level,
  );
  const nearExpiry = products.filter((product) => {
    if (!product.expiry_date) return false;
    const days = (new Date(product.expiry_date) - new Date()) / 86_400_000;
    return days >= 0 && days <= 7;
  });

  return (
    <section>
      <h2>Dashboard</h2>
      {error && <p role="alert">{error}</p>}
      <p>Products: {products.length} | Units in stock: {products.reduce((sum, p) => sum + p.current_stock, 0)}</p>
      <h3>Low stock</h3>
      <ul>{lowStock.map((product) => <li key={product.id}>{product.name}: {product.current_stock}</li>)}</ul>
      <h3>Expiring within 7 days</h3>
      <ul>{nearExpiry.map((product) => <li key={product.id}>{product.name}: {product.expiry_date}</li>)}</ul>
    </section>
  );
}
