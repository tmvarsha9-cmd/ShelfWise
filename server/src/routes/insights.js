// Inventory insights, simulation, and explanation endpoints (Member 2).
import { Router } from "express";
import pool from "../db.js";
import { buildInsights, simulateDemand } from "../ai/insights.js";
import { explainWithLLM } from "../ai/llm.js";

const router = Router();

async function loadProducts() {
  const { rows } = await pool.query(`
    SELECT id, name, category, source_type, current_stock, reorder_level, unit_price,
           daily_demand, to_char(expiry_date, 'YYYY-MM-DD') AS expiry_date, lead_time_days
    FROM products ORDER BY id
  `);
  return rows;
}

router.get("/", async (_req, res, next) => {
  try {
    // TODO: Add richer insight orchestration as the AI module evolves.
    res.json((await loadProducts()).map(buildInsights));
  } catch (error) {
    next(error);
  }
});

router.post("/simulate", async (req, res, next) => {
  try {
    const products = await loadProducts();
    const product = products.find((item) => item.id === Number(req.body.productId));
    if (!product) return res.status(404).json({ error: "Product not found" });
    const change = Number(req.body.demandChangePct);
    if (!Number.isFinite(change) || change < 0 || change > 100) {
      return res.status(400).json({ error: "demandChangePct must be between 0 and 100" });
    }
    // TODO: Extend scenario output with additional risk metrics.
    res.json({ product_id: product.id, ...simulateDemand(product, change) });
  } catch (error) {
    next(error);
  }
});

router.post("/explain/:id", async (req, res, next) => {
  try {
    const product = (await loadProducts()).find((item) => item.id === Number(req.params.id));
    if (!product) return res.status(404).json({ error: "Product not found" });
    // TODO: Add richer context to the generated explanation.
    res.json(await explainWithLLM(buildInsights(product)));
  } catch (error) {
    next(error);
  }
});

export default router;
