// Inventory risk calculations and scenario simulation (Member 2).
export function calculateDaysOfStock(stock, dailyDemand) {
  if (dailyDemand <= 0) return null;
  return round(stock / dailyDemand);
}

export function calculateReorderPoint(dailyDemand, leadTimeDays, safetyStock = 10) {
  return dailyDemand * leadTimeDays + safetyStock;
}

export function calculateUnitsAtRisk(stock, dailyDemand, daysUntilExpiry) {
  return Math.max(0, stock - dailyDemand * daysUntilExpiry);
}

export function buildInsights(product) {
  const daysOfStock = calculateDaysOfStock(product.current_stock, product.daily_demand);
  const reorderPoint = calculateReorderPoint(product.daily_demand, product.lead_time_days);
  const daysUntilExpiry = product.expiry_date
    ? Math.max(0, (Date.parse(`${product.expiry_date}T00:00:00Z`) - Date.now()) / 86_400_000)
    : null;
  const unitsAtRisk = daysUntilExpiry === null
    ? 0
    : calculateUnitsAtRisk(product.current_stock, product.daily_demand, daysUntilExpiry);
  const riskLevel = product.current_stock <= product.daily_demand * product.lead_time_days
    ? "HIGH"
    : product.current_stock <= reorderPoint
      ? "MEDIUM"
      : "LOW";

  return {
    ...product,
    days_of_stock: daysOfStock,
    reorder_point: reorderPoint,
    units_at_risk: unitsAtRisk,
    risk_level: riskLevel,
    recommendation: riskLevel === "HIGH"
      ? "Reorder soon to avoid a stockout."
      : unitsAtRisk > 0
        ? "Prioritize selling or redistributing expiring stock."
        : "Stock levels look healthy.",
  };
}

export function simulateDemand(product, demandChangePct) {
  const scenarioDemand = product.daily_demand * (1 + demandChangePct / 100);
  return {
    baseline_days: calculateDaysOfStock(product.current_stock, product.daily_demand),
    scenario_days: calculateDaysOfStock(product.current_stock, scenarioDemand),
  };
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
