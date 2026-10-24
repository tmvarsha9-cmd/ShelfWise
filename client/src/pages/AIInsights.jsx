// Risk table, recommendations, explanations, and scenarios (Member 2).
import { useEffect, useState } from "react";
import { explain, getInsights } from "../api/client.js";
import RiskBadge from "../components/RiskBadge.jsx";
import ScenarioPanel from "../components/ScenarioPanel.jsx";

export default function AIInsights() {
  const [insights, setInsights] = useState([]);
  const [explanations, setExplanations] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    getInsights().then(setInsights).catch((err) => setError(err.message));
  }, []);

  async function explainProduct(id) {
    try {
      const result = await explain(id);
      setExplanations({ ...explanations, [id]: `${result.text} (${result.source})` });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h2>AI Insights</h2>
      {error && <p role="alert">{error}</p>}
      <table>
        <thead><tr><th>Product</th><th>Risk</th><th>Days of stock</th><th>Recommendation</th><th>Explanation</th></tr></thead>
        <tbody>{insights.map((insight) => (
          <tr key={insight.id}>
            <td>{insight.name}</td><td><RiskBadge level={insight.risk_level} /></td>
            <td>{insight.days_of_stock ?? "—"}</td><td>{insight.recommendation}</td>
            <td><button onClick={() => explainProduct(insight.id)}>Explain</button><div>{explanations[insight.id]}</div></td>
          </tr>
        ))}</tbody>
      </table>
      <ScenarioPanel products={insights} />
    </section>
  );
}
