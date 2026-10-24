import { request, USE_MOCKS } from "./client";
import { mockStore } from "./mocks/store";

export async function getReportData(reportType, filters = {}) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 100));

    const products = mockStore.products.filter((p) => p.active !== false);
    const sales = mockStore.sales || [];

    // Filter sales by date range if provided
    let filteredSales = [...sales];
    if (filters.startDate) {
      filteredSales = filteredSales.filter((s) => s.date >= filters.startDate);
    }
    if (filters.endDate) {
      filteredSales = filteredSales.filter((s) => s.date <= filters.endDate);
    }
    if (filters.category) {
      filteredSales = filteredSales.filter((s) => s.category === filters.category);
    }
    if (filters.productId) {
      filteredSales = filteredSales.filter((s) => s.product_id === Number(filters.productId));
    }

    const now = new Date();
    const todayMidnight = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

    switch (reportType) {
      case "sales": {
        const rows = filteredSales.map((s) => ({
          date: s.date,
          product_name: s.product_name,
          category: s.category,
          quantity: s.quantity,
          unit_price: s.unit_price,
          total_revenue: s.total_revenue,
          gross_profit: s.gross_profit,
        }));
        const totalUnits = rows.reduce((acc, r) => acc + r.quantity, 0);
        const totalRevenue = rows.reduce((acc, r) => acc + r.total_revenue, 0);
        const totalProfit = rows.reduce((acc, r) => acc + r.gross_profit, 0);
        return {
          report_type: "sales",
          title: "Sales Report",
          totals: { quantity: totalUnits, total_revenue: totalRevenue, gross_profit: totalProfit },
          rows,
        };
      }

      case "time_slot_performance": {
        const slotMap = {
          "Morning (7 AM - 12 PM)": { slot: "Morning (7 AM - 12 PM)", sales_count: 0, units: 0, revenue: 0 },
          "Afternoon (12 PM - 5 PM)": { slot: "Afternoon (12 PM - 5 PM)", sales_count: 0, units: 0, revenue: 0 },
          "Evening (5 PM - 10 PM)": { slot: "Evening (5 PM - 10 PM)", sales_count: 0, units: 0, revenue: 0 },
        };
        filteredSales.forEach((s) => {
          const slot = slotMap[s.time_slot] || slotMap["Morning (7 AM - 12 PM)"];
          slot.sales_count += 1;
          slot.units += s.quantity;
          slot.revenue += s.total_revenue;
        });
        const rows = Object.values(slotMap);
        return {
          report_type: "time_slot_performance",
          title: "Time-Slot Product Performance",
          has_chart: "bar",
          chart_key: "revenue",
          totals: {
            sales_count: rows.reduce((a, b) => a + b.sales_count, 0),
            units: rows.reduce((a, b) => a + b.units, 0),
            revenue: rows.reduce((a, b) => a + b.revenue, 0),
          },
          rows,
        };
      }

      case "footfall": {
        // As per prompt Section 5.8: no visitor counts recorded yet. Empty state.
        return {
          report_type: "footfall",
          title: "Store Footfall Report",
          rows: [],
          empty_reason: "NO_COUNTER_INSTALLED",
        };
      }

      case "current_stock": {
        let list = products;
        if (filters.category) list = list.filter((p) => p.category === filters.category);
        if (filters.source_type) list = list.filter((p) => p.source_type === filters.source_type);

        const rows = list.map((p) => ({
          sku: p.sku,
          name: p.name,
          category: p.category,
          source_type: p.source_type,
          current_stock: p.current_stock,
          unit: p.unit,
          unit_cost: p.purchase_cost,
          stock_value: p.current_stock * p.purchase_cost,
          reorder_level: p.reorder_level,
        }));
        return {
          report_type: "current_stock",
          title: "Current Stock Valuation",
          totals: {
            current_stock: rows.reduce((a, b) => a + b.current_stock, 0),
            stock_value: rows.reduce((a, b) => a + b.stock_value, 0),
          },
          rows,
        };
      }

      case "top_products": {
        const topN = Number(filters.topN) || 5;
        const measure = filters.measure || "revenue"; // "revenue", "units", "sales_count"
        const prodAgg = {};

        filteredSales.forEach((s) => {
          if (!prodAgg[s.product_id]) {
            prodAgg[s.product_id] = {
              product_id: s.product_id,
              name: s.product_name,
              category: s.category,
              units_sold: 0,
              revenue: 0,
              sales_count: 0,
            };
          }
          prodAgg[s.product_id].units_sold += s.quantity;
          prodAgg[s.product_id].revenue += s.total_revenue;
          prodAgg[s.product_id].sales_count += 1;
        });

        let sorted = Object.values(prodAgg);
        if (measure === "units") {
          sorted.sort((a, b) => b.units_sold - a.units_sold);
        } else if (measure === "sales_count") {
          sorted.sort((a, b) => b.sales_count - a.sales_count);
        } else {
          sorted.sort((a, b) => b.revenue - a.revenue);
        }

        const rows = sorted.slice(0, topN);
        return {
          report_type: "top_products",
          title: `Top ${topN} Products by ${measure === "units" ? "Units Sold" : measure === "sales_count" ? "Transactions" : "Revenue"}`,
          has_chart: "bar",
          chart_key: measure === "units" ? "units_sold" : measure === "sales_count" ? "sales_count" : "revenue",
          rows,
        };
      }

      case "high_low_stock": {
        const sorted = [...products].sort((a, b) => b.current_stock - a.current_stock);
        const rows = sorted.map((p) => ({
          sku: p.sku,
          name: p.name,
          category: p.category,
          current_stock: p.current_stock,
          reorder_level: p.reorder_level,
          unit: p.unit,
        }));
        return {
          report_type: "high_low_stock",
          title: "Highest and Lowest Stock Items",
          rows,
        };
      }

      case "expired_products": {
        const rows = products
          .filter((p) => {
            if (!p.expiry_date) return false;
            const [y, m, d] = p.expiry_date.slice(0, 10).split("-").map(Number);
            return Date.UTC(y, m - 1, d) <= todayMidnight;
          })
          .map((p) => ({
            sku: p.sku,
            name: p.name,
            category: p.category,
            current_stock: p.current_stock,
            unit: p.unit,
            expiry_date: p.expiry_date,
            estimated_loss: p.current_stock * p.purchase_cost,
          }));
        return {
          report_type: "expired_products",
          title: "Expired Products",
          rows,
          totals: {
            current_stock: rows.reduce((a, b) => a + b.current_stock, 0),
            estimated_loss: rows.reduce((a, b) => a + b.estimated_loss, 0),
          },
        };
      }

      case "stockout_products": {
        const rows = products
          .filter((p) => p.current_stock <= 0)
          .map((p) => ({
            sku: p.sku,
            name: p.name,
            category: p.category,
            source_type: p.source_type,
            reorder_level: p.reorder_level,
            daily_demand: p.daily_demand,
            lead_time_days: p.lead_time_days,
          }));
        return {
          report_type: "stockout_products",
          title: "Stockout Products (Zero Stock)",
          rows,
        };
      }

      case "products_by_category": {
        const catMap = {};
        products.forEach((p) => {
          if (!catMap[p.category]) {
            catMap[p.category] = { category: p.category, product_count: 0, total_units: 0, total_value: 0 };
          }
          catMap[p.category].product_count += 1;
          catMap[p.category].total_units += p.current_stock;
          catMap[p.category].total_value += p.current_stock * p.purchase_cost;
        });
        const rows = Object.values(catMap);
        return {
          report_type: "products_by_category",
          title: "Products by Category Breakdown",
          totals: {
            product_count: rows.reduce((a, b) => a + b.product_count, 0),
            total_units: rows.reduce((a, b) => a + b.total_units, 0),
            total_value: rows.reduce((a, b) => a + b.total_value, 0),
          },
          rows,
        };
      }

      default:
        return { report_type: reportType, title: "Report", rows: [] };
    }
  }

  const query = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) query.append(k, v);
  });
  return request(`/reports/${reportType}?${query.toString()}`);
}
