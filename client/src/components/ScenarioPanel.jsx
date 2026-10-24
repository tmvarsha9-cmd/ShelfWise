// Demand-change slider and baseline-versus-scenario view (Member 2).
import { useState } from "react";
import { simulate } from "../api/client.js";

export default function ScenarioPanel({ products }) {
  const [productId, setProductId] = useState("");
  const [change, setChange] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function runScenario() {
    if (!productId) return;
    try {
      setResult(await simulate(Number(productId), change));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h3>What-if scenario</h3>
      <select aria-label="Product" value={productId} onChange={(event) => setProductId(event.target.value)}>
        <option value="">Choose a product</option>
        {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
      </select>
      <label>
        Demand change: {change}%
        <input type="range" min="0" max="100" value={change} onChange={(event) => setChange(Number(event.target.value))} />
      </label>
      <button onClick={runScenario}>Simulate</button>
      {error && <p role="alert">{error}</p>}
      {result && <p>Baseline: {result.baseline_days} days; scenario: {result.scenario_days} days.</p>}
    </section>
  );
}
