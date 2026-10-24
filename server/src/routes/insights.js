// server/src/routes/insights.js - MEMBER 2
// GET  /api/insights        -> insights for every product, most urgent first
// POST /api/simulate        -> what-if demand scenario { productId, demandChangePct }
// POST /api/explain/:id     -> explanation { text, source: "llm" | "fallback" }

import { Router } from 'express';
import { readFile } from 'node:fs/promises';
import { buildInsights, simulateDemandChange, sortByRisk } from '../ai/insights.js';
import { explainWithLLM } from '../ai/llm.js';

const router = Router();

// Reads Member 1's products table. If the DB is unreachable (or USE_SAMPLE_DATA=true),
// falls back to data/sample_products.json so the AI module can be built and demoed anyway.
async function loadProducts() {
  if (process.env.USE_SAMPLE_DATA !== 'true') {
    try {
      const { default: pool } = await import('../db.js');
      const { rows } = await pool.query(
        `SELECT id, name, category, source_type, current_stock, reorder_level,
                unit_price, daily_demand, lead_time_days,
                to_char(expiry_date, 'YYYY-MM-DD') AS expiry_date
         FROM products ORDER BY id`
      );
      return { products: rows, dataSource: 'database' };
    } catch (err) {
      console.warn(`[insights] database unavailable, using sample data: ${err.message}`);
    }
  }
  const file = new URL('../../data/sample_products.json', import.meta.url);
  return { products: JSON.parse(await readFile(file, 'utf8')), dataSource: 'sample' };
}

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error('[insights]', err);
    res.status(500).json({ error: 'Could not generate insights' });
  }
};

router.get(
  '/insights',
  handle(async (_req, res) => {
    const { products, dataSource } = await loadProducts();
    const insights = sortByRisk(products.map((p) => buildInsights(p)));
    res.json({ data_source: dataSource, generated_at: new Date().toISOString(), insights });
  })
);

router.post(
  '/simulate',
  handle(async (req, res) => {
    const { productId, demandChangePct } = req.body ?? {};
    const { products } = await loadProducts();
    const product = products.find((p) => Number(p.id) === Number(productId));
    if (!product) return res.status(404).json({ error: 'Product not found' });
    try {
      res.json(simulateDemandChange(product, demandChangePct));
    } catch (err) {
      if (err instanceof RangeError) return res.status(400).json({ error: err.message });
      throw err;
    }
  })
);

router.post(
  '/explain/:id',
  handle(async (req, res) => {
    const { products } = await loadProducts();
    const product = products.find((p) => Number(p.id) === Number(req.params.id));
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const result = await explainWithLLM(buildInsights(product));
    res.json({ product_id: Number(product.id), ...result });
  })
);

export default router;
