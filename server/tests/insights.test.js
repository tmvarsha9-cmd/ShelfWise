// Tests core inventory insight calculations (Member 2).
import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateDaysOfStock,
  calculateReorderPoint,
  calculateUnitsAtRisk,
  simulateDemand,
} from "../src/ai/insights.js";

test("60 stock and 15 daily demand gives 4 days", () => {
  assert.equal(calculateDaysOfStock(60, 15), 4);
});

test("reorder point is demand times lead time plus safety stock", () => {
  assert.equal(calculateReorderPoint(15, 3, 10), 55);
});

test("100 stock with five days to expiry puts 50 units at risk", () => {
  assert.equal(calculateUnitsAtRisk(100, 10, 5), 50);
});

test("30 percent higher demand reduces 100/20 stock cover to 3.85 days", () => {
  const result = simulateDemand({ current_stock: 100, daily_demand: 20 }, 30);
  assert.equal(result.baseline_days, 5);
  assert.equal(result.scenario_days, 3.85);
});
