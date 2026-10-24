// server/tests/insights.test.js - MEMBER 2
// Run: npm test   (node --test)

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  calculateDaysUntilStockout,
  calculateReorderPoint,
  calculateExpiryRisk,
  recommendReplenishment,
  simulateDemandChange,
  buildInsights,
  sortByRisk,
  normalizeProduct,
} from '../src/ai/insights.js';
import { explainWithLLM, templateExplanation } from '../src/ai/llm.js';

const TODAY = '2026-10-24';

const bread = {
  id: 1, name: 'Bread', category: 'Bakery', source_type: 'MANUFACTURED',
  current_stock: 20, reorder_level: 30, unit_price: 40,
  daily_demand: 15, expiry_date: '2026-10-27', lead_time_days: 2,
};

// ----- Blueprint sample cases -----
test('stockout: 60 stock / 15 demand = 4 days', () => {
  assert.equal(calculateDaysUntilStockout(60, 15), 4);
});

test('reorder point: (15 x 3) + 10 = 55', () => {
  assert.equal(calculateReorderPoint(15, 3, 10), 55);
});

test('expiry: 100 stock, demand 10, 5 days -> 50 units at risk', () => {
  const r = calculateExpiryRisk(
    { id: 9, current_stock: 100, daily_demand: 10, expiry_date: '2026-10-29' },
    TODAY
  );
  assert.equal(r.expected_sales_before_expiry, 50);
  assert.equal(r.units_at_risk, 50);
});

test('simulator: +30% on 100 stock / 20 demand -> 3.85 days', () => {
  const sim = simulateDemandChange(
    { id: 9, name: 'X', current_stock: 100, daily_demand: 20, lead_time_days: 3 },
    30
  );
  assert.equal(sim.baseline.days_until_stockout, 5);
  assert.equal(sim.scenario.daily_demand, 26);
  assert.equal(sim.scenario.days_until_stockout, 3.85);
});

// ----- Edge cases -----
test('zero or missing demand gives no stockout estimate and no reorder', () => {
  assert.equal(calculateDaysUntilStockout(50, 0), null);
  const ins = buildInsights({ ...bread, daily_demand: 0 }, { today: TODAY });
  assert.equal(ins.stockout_risk, 'NONE');
  assert.equal(ins.replenishment.needs_reorder, false);
  assert.ok(ins.warnings.length > 0);
});

test('no expiry date -> expiry is null', () => {
  assert.equal(calculateExpiryRisk({ ...bread, expiry_date: null }, TODAY), null);
});

test('already expired -> all stock at risk, HIGH', () => {
  const r = calculateExpiryRisk({ ...bread, expiry_date: '2026-10-20' }, TODAY);
  assert.equal(r.units_at_risk, 20);
  assert.equal(r.risk_level, 'HIGH');
});

test('Bread: HIGH stockout risk, reorder 125 units', () => {
  const ins = buildInsights(bread, { today: TODAY });
  assert.equal(ins.stockout_risk, 'HIGH');
  assert.equal(ins.replenishment.needs_reorder, true);
  assert.equal(ins.replenishment.suggested_order_qty, 125);
});

test('incoming stock and MOQ change the order quantity', () => {
  const noIncoming = recommendReplenishment(bread);
  const withIncoming = recommendReplenishment(bread, { incomingStock: 100 });
  assert.ok(withIncoming.suggested_order_qty < noIncoming.suggested_order_qty);
  const moq = recommendReplenishment(bread, { minOrderQty: 50 });
  assert.equal(moq.suggested_order_qty % 50, 0);
});

test('numeric strings from the database are normalised', () => {
  const p = normalizeProduct({ ...bread, current_stock: '20', daily_demand: '15.0' });
  assert.equal(p.current_stock, 20);
  assert.equal(calculateDaysUntilStockout(p.current_stock, p.daily_demand), 20 / 15);
});

test('simulator rejects invalid percentages', () => {
  assert.throws(() => simulateDemandChange(bread, -100), RangeError);
  assert.throws(() => simulateDemandChange(bread, 'abc'), RangeError);
});

// ----- Sample data -----
test('all sample products produce valid insights, sorted most urgent first', () => {
  const file = new URL('../data/sample_products.json', import.meta.url);
  const products = JSON.parse(readFileSync(file, 'utf8'));
  const insights = sortByRisk(products.map((p) => buildInsights(p, { today: TODAY })));
  assert.equal(insights.length, products.length);
  const rank = { NONE: 0, LOW: 1, MEDIUM: 2, HIGH: 3 };
  for (let i = 1; i < insights.length; i++) {
    assert.ok(rank[insights[i - 1].overall_risk] >= rank[insights[i].overall_risk]);
  }
});

// ----- LLM failure handling -----
test('no API key -> fallback explanation, no crash', async () => {
  delete process.env.GEMINI_API_KEY;
  const ins = buildInsights(bread, { today: TODAY });
  const r = await explainWithLLM(ins);
  assert.equal(r.source, 'fallback');
  assert.equal(r.text, templateExplanation(ins));
});

test('invalid API key / no network -> fallback, no crash', async () => {
  process.env.GEMINI_API_KEY = 'invalid-key';
  const r = await explainWithLLM(buildInsights(bread, { today: TODAY }), { timeoutMs: 3000 });
  assert.equal(r.source, 'fallback');
  delete process.env.GEMINI_API_KEY;
});
