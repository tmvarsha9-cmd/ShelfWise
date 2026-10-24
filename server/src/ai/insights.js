// server/src/ai/insights.js - MEMBER 2
// Deterministic inventory calculations. The LLM never changes these numbers;
// it only explains them (see llm.js).

export const DEFAULTS = Object.freeze({
  safetyStock: 10, // units kept as a buffer (not in the shared product contract)
  coverDays: 7, // days of sales one replenishment order should cover
  minOrderQty: 1, // supplier minimum order quantity
});

const RISK_RANK = { NONE: 0, LOW: 1, MEDIUM: 2, HIGH: 3 };
const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;
const DAY_MS = 86_400_000;

// "YYYY-MM-DD" or Date -> timestamp of that calendar day (UTC midnight)
function toDayNumber(value) {
  if (value instanceof Date) {
    return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function toDateString(value) {
  if (!value) return null;
  if (value instanceof Date) {
    const mm = String(value.getMonth() + 1).padStart(2, '0');
    const dd = String(value.getDate()).padStart(2, '0');
    return `${value.getFullYear()}-${mm}-${dd}`;
  }
  return String(value).slice(0, 10);
}

// Makes sure numbers are numbers (pg can return numeric columns as strings)
// and expiry_date is "YYYY-MM-DD" or null.
export function normalizeProduct(p) {
  return {
    ...p,
    id: Number(p.id),
    current_stock: Number(p.current_stock) || 0,
    reorder_level: Number(p.reorder_level) || 0,
    unit_price: Number(p.unit_price) || 0,
    daily_demand: Number(p.daily_demand) || 0,
    lead_time_days: Number(p.lead_time_days) || 0,
    expiry_date: toDateString(p.expiry_date),
  };
}

// ---------- Feature 1: stockout ----------
export function calculateDaysUntilStockout(currentStock, dailyDemand) {
  if (!(dailyDemand > 0)) return null; // no demand -> no estimate
  return currentStock / dailyDemand;
}

// HIGH: stock runs out before a new order could arrive
export function stockoutRiskLevel(daysLeft, leadTimeDays) {
  if (daysLeft === null) return 'NONE';
  if (daysLeft <= leadTimeDays) return 'HIGH';
  if (daysLeft <= leadTimeDays * 2) return 'MEDIUM';
  return 'LOW';
}

// ---------- Feature 2: replenishment ----------
export function calculateReorderPoint(dailyDemand, leadTimeDays, safetyStock) {
  return dailyDemand * leadTimeDays + safetyStock;
}

export function recommendReplenishment(product, opts = {}) {
  const { safetyStock, coverDays, minOrderQty, incomingStock } = {
    ...DEFAULTS,
    incomingStock: 0,
    ...opts,
  };
  const p = normalizeProduct(product);
  const moq = Math.max(1, minOrderQty);

  const reorderPoint = calculateReorderPoint(p.daily_demand, p.lead_time_days, safetyStock);
  const available = p.current_stock + incomingStock;
  const needsReorder = p.daily_demand > 0 && available < reorderPoint;

  let suggestedOrderQty = 0;
  if (needsReorder) {
    const target = p.daily_demand * (p.lead_time_days + coverDays) + safetyStock;
    const raw = Math.max(0, target - available);
    suggestedOrderQty = Math.ceil(round2(raw) / moq) * moq; // round UP to MOQ multiple
  }

  const daysLeft = calculateDaysUntilStockout(p.current_stock, p.daily_demand);
  const orderWithinDays =
    daysLeft === null ? null : Math.max(0, round1(daysLeft - p.lead_time_days));

  return {
    reorder_point: round1(reorderPoint),
    needs_reorder: needsReorder,
    suggested_order_qty: suggestedOrderQty,
    order_within_days: orderWithinDays,
    below_reorder_level: p.current_stock < p.reorder_level,
  };
}

// ---------- Feature 3: expiry risk (an estimate, not a certainty) ----------
export function calculateExpiryRisk(product, today = new Date()) {
  const p = normalizeProduct(product);
  if (!p.expiry_date) return null;

  const daysToExpiry = Math.round((toDayNumber(p.expiry_date) - toDayNumber(today)) / DAY_MS);
  let expectedSales = 0;
  let atRisk = p.current_stock;
  if (daysToExpiry > 0) {
    expectedSales = p.daily_demand * daysToExpiry;
    atRisk = Math.max(0, p.current_stock - expectedSales);
  }

  const share = p.current_stock > 0 ? atRisk / p.current_stock : 0;
  let riskLevel = 'NONE';
  if (share >= 0.5) riskLevel = 'HIGH';
  else if (share >= 0.2) riskLevel = 'MEDIUM';
  else if (share > 0) riskLevel = 'LOW';

  return {
    days_to_expiry: daysToExpiry,
    expected_sales_before_expiry: round1(expectedSales),
    units_at_risk: round1(atRisk),
    risk_level: riskLevel,
  };
}

// ---------- Feature 4: what-if simulator ----------
// demandChangePct is a user-defined assumption (e.g. 30 means +30%).
export function simulateDemandChange(product, demandChangePct, opts = {}) {
  const pct = Number(demandChangePct);
  if (!Number.isFinite(pct) || pct <= -100) {
    throw new RangeError('demandChangePct must be a number greater than -100');
  }
  const base = normalizeProduct(product);
  const scenario = { ...base, daily_demand: base.daily_demand * (1 + pct / 100) };

  const snapshot = (p) => {
    const days = calculateDaysUntilStockout(p.current_stock, p.daily_demand);
    return {
      daily_demand: round2(p.daily_demand),
      days_until_stockout: days === null ? null : round2(days),
      stockout_risk: stockoutRiskLevel(days, p.lead_time_days),
      replenishment: recommendReplenishment(p, opts),
    };
  };

  return {
    product_id: base.id,
    name: base.name,
    assumption_pct: pct,
    baseline: snapshot(base),
    scenario: snapshot(scenario),
  };
}

// ---------- Combine everything for one product ----------
export function buildInsights(product, opts = {}) {
  const p = normalizeProduct(product);
  const days = calculateDaysUntilStockout(p.current_stock, p.daily_demand);
  const stockoutRisk = stockoutRiskLevel(days, p.lead_time_days);
  const replenishment = recommendReplenishment(p, opts);
  const expiry = calculateExpiryRisk(p, opts.today);

  const warnings = [];
  if (p.daily_demand <= 0) {
    warnings.push('No demand data: stockout and reorder estimates are unavailable.');
  }
  if (expiry && expiry.days_to_expiry <= 0) {
    warnings.push('This product is past its expiry date.');
  }
  if (replenishment.needs_reorder && expiry && ['MEDIUM', 'HIGH'].includes(expiry.risk_level)) {
    warnings.push('Existing stock may expire unsold. Review the suggested order quantity.');
  }

  const overallRank = Math.max(RISK_RANK[stockoutRisk], expiry ? RISK_RANK[expiry.risk_level] : 0);
  const overallRisk = Object.keys(RISK_RANK).find((k) => RISK_RANK[k] === overallRank);

  return {
    product_id: p.id,
    name: p.name,
    category: p.category,
    current_stock: p.current_stock,
    daily_demand: p.daily_demand,
    lead_time_days: p.lead_time_days,
    days_until_stockout: days === null ? null : round2(days),
    stockout_risk: stockoutRisk,
    replenishment,
    expiry,
    warnings,
    overall_risk: overallRisk,
  };
}

// Most urgent first; ties broken by fewest days of stock left.
export function sortByRisk(insights) {
  return [...insights].sort((a, b) => {
    const diff = RISK_RANK[b.overall_risk] - RISK_RANK[a.overall_risk];
    if (diff !== 0) return diff;
    const da = a.days_until_stockout ?? Infinity;
    const db = b.days_until_stockout ?? Infinity;
    return da - db;
  });
}
