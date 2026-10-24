// Product table, add product form, and stock updates (Member 1).
import { useEffect, useState } from "react";
import { addProduct, getProducts, updateStock } from "../api/client.js";

const emptyProduct = {
  name: "",
  category: "",
  source_type: "MANUFACTURED",
  current_stock: 0,
  reorder_level: 10,
  unit_price: 0,
  daily_demand: 1,
  expiry_date: "",
  lead_time_days: 1,
};

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setProducts(await getProducts());
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function submit(event) {
    event.preventDefault();
    try {
      await addProduct({
        ...form,
        current_stock: Number(form.current_stock),
        reorder_level: Number(form.reorder_level),
        unit_price: Number(form.unit_price),
        daily_demand: Number(form.daily_demand),
        lead_time_days: Number(form.lead_time_days),
        expiry_date: form.expiry_date || null,
      });
      setForm(emptyProduct);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function changeStock(product) {
    const value = window.prompt(`New stock for ${product.name}`, product.current_stock);
    if (value === null || value.trim() === "") return;
    try {
      await updateStock(product.id, Number(value));
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h2>Inventory</h2>
      {error && <p role="alert">{error}</p>}
      <form onSubmit={submit}>
        <h3>Add product</h3>
        {["name", "category", "source_type", "current_stock", "reorder_level", "unit_price", "daily_demand", "expiry_date", "lead_time_days"].map((field) => (
          <label key={field} style={{ display: "block" }}>
            {field}{" "}
            <input
              required={field !== "expiry_date"}
              type={["current_stock", "reorder_level", "unit_price", "daily_demand", "lead_time_days"].includes(field) ? "number" : field === "expiry_date" ? "date" : "text"}
              step={field === "unit_price" || field === "daily_demand" ? "any" : undefined}
              value={form[field]}
              onChange={(event) => setForm({ ...form, [field]: event.target.value })}
            />
          </label>
        ))}
        <button type="submit">Add product</button>
      </form>
      <h3>Products</h3>
      <table>
        <thead><tr><th>Name</th><th>Category</th><th>Stock</th><th>Reorder level</th><th>Expiry</th><th>Action</th></tr></thead>
        <tbody>{products.map((product) => (
          <tr key={product.id}>
            <td>{product.name}</td><td>{product.category}</td><td>{product.current_stock}</td>
            <td>{product.reorder_level}</td><td>{product.expiry_date || "—"}</td>
            <td><button onClick={() => changeStock(product)}>Update stock</button></td>
          </tr>
        ))}</tbody>
      </table>
    </section>
  );
}
