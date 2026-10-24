import { request, ApiError } from "./client";
import { sampleAiInsights } from "./mocks/fixtureAi";

/**
 * Real AI Endpoints (GET /api/insights, POST /api/simulate, POST /api/explain/:id)
 * Falls back gracefully to sampleAiInsights fixture if the Node server is unreachable.
 */

export async function getInsights() {
  try {
    const data = await request("/insights");
    return data;
  } catch (err) {
    console.warn("Could not reach backend /api/insights, using fallback fixture:", err.message);
    return sampleAiInsights;
  }
}

export async function simulate(productId, demandChangePct) {
  const pct = Number(demandChangePct);
  if (isNaN(pct) || pct <= -100) {
    throw new ApiError("Demand change percentage must be greater than -100%", 400);
  }

  try {
    const data = await request("/simulate", {
      method: "POST",
      body: JSON.stringify({ productId: Number(productId), demandChangePct: pct }),
    });
    return data;
  } catch (err) {
    console.warn("Could not reach backend /api/simulate, calculating locally:", err.message);

    // Fallback calculation using sampleAiInsights
    const insight = sampleAiInsights.insights.find((i) => i.product_id === Number(productId));
    if (!insight) {
      throw new ApiError("Product not found in insights", 404);
    }

    const baseDemand = insight.daily_demand;
    const baseStock = insight.current_stock;
    const leadTime = insight.lead_time_days;
    const scenarioDemand = Math.round(baseDemand * (1 + pct / 100) * 100) / 100;

    const baseDays = baseDemand > 0 ? Math.round((baseStock / baseDemand) * 100) / 100 : null;
    const scenDays = scenarioDemand > 0 ? Math.round((baseStock / scenarioDemand) * 100) / 100 : null;

    const riskLevel = (days, lt) => {
      if (days === null) return "NONE";
      if (days <= lt) return "HIGH";
      if (days <= lt * 2) return "MEDIUM";
      return "LOW";
    };

    const safetyStock = 10;
    const coverDays = 7;
    const target = scenarioDemand * (leadTime + coverDays) + safetyStock;
    const needsReorder = scenarioDemand > 0 && baseStock < scenarioDemand * leadTime + safetyStock;
    const suggestedQty = needsReorder ? Math.max(0, Math.ceil(target - baseStock)) : 0;

    return {
      product_id: Number(productId),
      name: insight.name,
      assumption_pct: pct,
      baseline: {
        daily_demand: baseDemand,
        days_until_stockout: baseDays,
        stockout_risk: insight.stockout_risk,
        replenishment: insight.replenishment,
      },
      scenario: {
        daily_demand: scenarioDemand,
        days_until_stockout: scenDays,
        stockout_risk: riskLevel(scenDays, leadTime),
        replenishment: {
          reorder_point: Math.round((scenarioDemand * leadTime + safetyStock) * 10) / 10,
          needs_reorder: needsReorder,
          suggested_order_qty: suggestedQty,
          order_within_days: scenDays === null ? null : Math.max(0, Math.round((scenDays - leadTime) * 10) / 10),
          below_reorder_level: baseStock < 30,
        },
      },
    };
  }
}

export async function explain(productId) {
  try {
    const data = await request(`/explain/${productId}`, {
      method: "POST",
    });
    return data;
  } catch (err) {
    console.warn(`Could not reach backend /api/explain/${productId}, providing standard fallback explanation:`, err.message);

    const insight = sampleAiInsights.insights.find((i) => i.product_id === Number(productId));
    const name = insight ? insight.name : "This item";
    const days = insight?.days_until_stockout;

    let text = `${name} currently has ${insight?.current_stock ?? 0} units in stock with an average sales rate of ${insight?.daily_demand ?? 0} units per day. `;
    if (insight?.replenishment?.needs_reorder) {
      text += `Because current stock will last only about ${days} days and supplier lead time is ${insight.lead_time_days} days, an order of approximately ${insight.replenishment.suggested_order_qty} units should be placed ${insight.replenishment.order_within_days === 0 ? "immediately" : `within ${insight.replenishment.order_within_days} days`}.`;
    } else {
      text += `Stock levels are sufficient for current demand. No replenishment order is required at this time.`;
    }

    return {
      product_id: Number(productId),
      text,
      source: "fallback",
    };
  }
}
