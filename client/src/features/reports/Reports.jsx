import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Download, ChevronDown, ChevronRight, Info, AlertCircle } from "lucide-react";
import { getReportData } from "../../api/reports";
import { getCategories } from "../../api/categories";
import { getProducts } from "../../api/products";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import DateRangeFilter from "../../components/DateRangeFilter";
import Spinner from "../../components/Spinner";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import { formatCurrency, formatNumber, formatDate, formatDateTime } from "../../lib/format";
import { SOURCE_TYPES, SOURCE_TYPE_LABELS } from "../../lib/constants";
import clsx from "clsx";

const REPORT_TABS = [
  { id: "sales", label: "Sales" },
  { id: "time_slot_performance", label: "Time-slot performance" },
  { id: "footfall", label: "Footfall" },
  { id: "current_stock", label: "Current stock" },
  { id: "top_products", label: "Top products" },
  { id: "high_low_stock", label: "High / low stock" },
  { id: "expired_products", label: "Expired products" },
  { id: "stockout_products", label: "Stockout products" },
  { id: "products_by_category", label: "Products by category" },
];

const CALCULATION_NOTES = {
  sales: "Summarises completed sales recorded at counter and stock registers over the selected period.",
  time_slot_performance: "Aggregates revenue and sales transaction counts grouped into three retail business windows: Morning (7 AM - 12 PM), Afternoon (12 PM - 5 PM), and Evening (5 PM - 10 PM).",
  footfall: "Requires automated electronic optical or thermal door entry sensors to measure customer footfall. Sales volume cannot be substituted for physical walk-ins.",
  current_stock: "Calculates total on-hand inventory multiplied by purchase unit cost to determine current asset valuation.",
  top_products: "Ranks products across sales within the date range by chosen measure (revenue, volume, or transactions).",
  high_low_stock: "Sorts active catalogue items by current physical stock count descending.",
  expired_products: "Lists items whose recorded expiry date is on or before today's date with stock remaining.",
  stockout_products: "Lists items with exactly zero recorded stock requiring replenishment.",
  products_by_category: "Totals inventory value and SKU count grouped by category department.",
};

export default function Reports() {
  const { type } = useParams();
  const navigate = useNavigate();

  const activeReport = type || "sales";

  // Shared filters
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedSourceType, setSelectedSourceType] = useState("");
  const [topN, setTopN] = useState(5);
  const [topMeasure, setTopMeasure] = useState("revenue"); // revenue, units, sales_count
  const [isCalcNoteOpen, setIsCalcNoteOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });

  // Query report data
  const {
    data: reportResult,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "reports",
      activeReport,
      { ...dateRange, selectedCategory, selectedProductId, selectedSourceType, topN, topMeasure },
    ],
    queryFn: () =>
      getReportData(activeReport, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        category: selectedCategory,
        productId: selectedProductId,
        source_type: selectedSourceType,
        topN,
        measure: topMeasure,
      }),
  });

  const handleTabChange = (newType) => {
    navigate(`/reports/${newType}`);
  };

  // CSV export
  const exportCsv = () => {
    if (!reportResult || !reportResult.rows || reportResult.rows.length === 0) return;
    const firstRow = reportResult.rows[0];
    const headers = Object.keys(firstRow);
    const rows = reportResult.rows.map((row) =>
      headers.map((h) => (typeof row[h] === "string" ? `"${row[h]}"` : row[h])).join(",")
    );

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `stocksense_${activeReport}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Build columns based on active report
  const getColumns = () => {
    switch (activeReport) {
      case "sales":
        return [
          { header: "Date", field: "date", sortable: true, render: (r) => formatDate(r.date) },
          { header: "Product", field: "product_name", sortable: true },
          { header: "Category", field: "category", sortable: true },
          { header: "Quantity", field: "quantity", sortable: true, align: "right", render: (r) => formatNumber(r.quantity) },
          { header: "Unit price", field: "unit_price", sortable: true, align: "right", render: (r) => formatCurrency(r.unit_price) },
          { header: "Total revenue", field: "total_revenue", sortable: true, align: "right", render: (r) => formatCurrency(r.total_revenue) },
          { header: "Gross profit", field: "gross_profit", sortable: true, align: "right", render: (r) => formatCurrency(r.gross_profit) },
        ];
      case "time_slot_performance":
        return [
          { header: "Time slot", field: "slot", sortable: true },
          { header: "Transactions", field: "sales_count", sortable: true, align: "right", render: (r) => formatNumber(r.sales_count) },
          { header: "Units sold", field: "units", sortable: true, align: "right", render: (r) => formatNumber(r.units) },
          { header: "Total revenue", field: "revenue", sortable: true, align: "right", render: (r) => formatCurrency(r.revenue) },
        ];
      case "current_stock":
        return [
          { header: "Item code", field: "sku", sortable: true, isMono: true },
          { header: "Product", field: "name", sortable: true },
          { header: "Category", field: "category", sortable: true },
          { header: "In stock", field: "current_stock", sortable: true, align: "right", render: (r) => `${formatNumber(r.current_stock)} ${r.unit}` },
          { header: "Unit cost", field: "unit_cost", sortable: true, align: "right", render: (r) => formatCurrency(r.unit_cost) },
          { header: "Stock valuation", field: "stock_value", sortable: true, align: "right", render: (r) => formatCurrency(r.stock_value) },
          { header: "Reorder point", field: "reorder_level", sortable: true, align: "right", render: (r) => formatNumber(r.reorder_level) },
        ];
      case "top_products":
        return [
          { header: "Product", field: "name", sortable: true },
          { header: "Category", field: "category", sortable: true },
          { header: "Units sold", field: "units_sold", sortable: true, align: "right", render: (r) => formatNumber(r.units_sold) },
          { header: "Transactions", field: "sales_count", sortable: true, align: "right", render: (r) => formatNumber(r.sales_count) },
          { header: "Total revenue", field: "revenue", sortable: true, align: "right", render: (r) => formatCurrency(r.revenue) },
        ];
      case "high_low_stock":
        return [
          { header: "Item code", field: "sku", sortable: true, isMono: true },
          { header: "Product", field: "name", sortable: true },
          { header: "Category", field: "category", sortable: true },
          { header: "Current stock", field: "current_stock", sortable: true, align: "right", render: (r) => `${formatNumber(r.current_stock)} ${r.unit}` },
          { header: "Reorder level", field: "reorder_level", sortable: true, align: "right", render: (r) => `${formatNumber(r.reorder_level)} ${r.unit}` },
        ];
      case "expired_products":
        return [
          { header: "Item code", field: "sku", sortable: true, isMono: true },
          { header: "Product", field: "name", sortable: true },
          { header: "Category", field: "category", sortable: true },
          { header: "Expired stock", field: "current_stock", sortable: true, align: "right", render: (r) => `${formatNumber(r.current_stock)} ${r.unit}` },
          { header: "Expiry date", field: "expiry_date", sortable: true, render: (r) => formatDate(r.expiry_date) },
          { header: "Estimated loss", field: "estimated_loss", sortable: true, align: "right", render: (r) => formatCurrency(r.estimated_loss) },
        ];
      case "stockout_products":
        return [
          { header: "Item code", field: "sku", sortable: true, isMono: true },
          { header: "Product", field: "name", sortable: true },
          { header: "Category", field: "category", sortable: true },
          { header: "How you get it", field: "source_type", sortable: true, render: (r) => SOURCE_TYPE_LABELS[r.source_type] || r.source_type },
          { header: "Reorder level", field: "reorder_level", sortable: true, align: "right", render: (r) => formatNumber(r.reorder_level) },
          { header: "Daily demand", field: "daily_demand", sortable: true, align: "right", render: (r) => `${r.daily_demand}/day` },
          { header: "Delivery time", field: "lead_time_days", sortable: true, align: "right", render: (r) => `${r.lead_time_days} days` },
        ];
      case "products_by_category":
        return [
          { header: "Category", field: "category", sortable: true },
          { header: "Product count", field: "product_count", sortable: true, align: "right", render: (r) => formatNumber(r.product_count) },
          { header: "Total units", field: "total_units", sortable: true, align: "right", render: (r) => formatNumber(r.total_units) },
          { header: "Total valuation", field: "total_value", sortable: true, align: "right", render: (r) => formatCurrency(r.total_value) },
        ];
      default:
        return [];
    }
  };

  const columns = getColumns();
  const rows = reportResult?.rows || [];
  const totals = reportResult?.totals;

  // Filter summary description
  const appliedFilters = [];
  if (dateRange.startDate && dateRange.endDate) {
    appliedFilters.push(`Date: ${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`);
  }
  if (selectedCategory) appliedFilters.push(`Category: ${selectedCategory}`);
  if (selectedProductId) {
    const p = products.find((pr) => pr.id === Number(selectedProductId));
    if (p) appliedFilters.push(`Item: ${p.name}`);
  }
  if (selectedSourceType) {
    appliedFilters.push(`Source: ${SOURCE_TYPE_LABELS[selectedSourceType]}`);
  }

  const filterSummaryString = appliedFilters.length > 0 ? appliedFilters.join(" | ") : "All data";

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Business metrics, stock valuations, and item sales performance."
        action={
          <button
            type="button"
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-2 h-10 px-4 text-[14px] font-medium text-text bg-surface border border-border-strong hover:bg-surface-muted rounded-btn transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4 stroke-[1.75]" />
            <span>Export CSV</span>
          </button>
        }
      />

      {/* Report Picker Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border mb-5">
        {REPORT_TABS.map((tab) => {
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={clsx(
                "px-3.5 py-2 text-[13px] font-medium rounded-btn whitespace-nowrap transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "bg-surface border border-border text-text hover:bg-surface-muted"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Report-specific filter controls */}
      <div className="p-4 bg-surface border border-border rounded-card mb-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Show Date range filter for sales, time_slot, top_products */}
            {["sales", "time_slot_performance", "top_products"].includes(activeReport) && (
              <DateRangeFilter
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onChange={setDateRange}
              />
            )}

            {/* Category Filter for applicable reports */}
            {["sales", "current_stock"].includes(activeReport) && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-9 px-3 text-[13px] bg-surface border border-border rounded-input text-text outline-none focus:border-primary"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            {/* How you get it filter for current stock */}
            {["current_stock"].includes(activeReport) && (
              <select
                value={selectedSourceType}
                onChange={(e) => setSelectedSourceType(e.target.value)}
                className="h-9 px-3 text-[13px] bg-surface border border-border rounded-input text-text outline-none focus:border-primary"
              >
                <option value="">All sources</option>
                <option value={SOURCE_TYPES.PURCHASED}>Bought from supplier</option>
                <option value={SOURCE_TYPES.MANUFACTURED}>Made in-house</option>
              </select>
            )}

            {/* Top Products controls */}
            {activeReport === "top_products" && (
              <>
                <div className="flex items-center gap-1.5 text-[13px]">
                  <span className="text-text-muted">Top:</span>
                  <select
                    value={topN}
                    onChange={(e) => setTopN(Number(e.target.value))}
                    className="h-9 px-2.5 text-[13px] bg-surface border border-border rounded-input"
                  >
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-[13px]">
                  <span className="text-text-muted">Measure:</span>
                  <select
                    value={topMeasure}
                    onChange={(e) => setTopMeasure(e.target.value)}
                    className="h-9 px-2.5 text-[13px] bg-surface border border-border rounded-input"
                  >
                    <option value="revenue">Revenue (₹)</option>
                    <option value="units">Units sold</option>
                    <option value="sales_count">Number of sales</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Filters Applied & Generated at timestamp line */}
        <div className="pt-2 border-t border-border flex items-center justify-between text-[12px] text-text-muted">
          <span>Filters applied: <strong>{filterSummaryString}</strong></span>
          <span>Generated at: {formatDateTime(new Date())}</span>
        </div>
      </div>

      {/* Special case: Footfall report empty state */}
      {activeReport === "footfall" ? (
        <div className="p-12 text-center bg-surface border border-border rounded-card max-w-lg mx-auto my-8">
          <div className="w-10 h-10 mb-3 mx-auto flex items-center justify-center rounded-btn bg-surface-muted text-text-muted">
            <Info className="w-5 h-5 stroke-[1.75]" />
          </div>
          <h3 className="text-[16px] font-semibold text-text mb-2">No footfall counter installed</h3>
          <p className="text-[14px] text-text-muted leading-relaxed">
            Visitor counts aren't recorded yet. Footfall needs an entry counter, and sales alone can't show it.
          </p>
        </div>
      ) : isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center bg-surface border border-border rounded-card">
          <Spinner size="lg" />
          <span className="text-[14px] text-text-muted mt-3">Compiling report data…</span>
        </div>
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => refetch()} />
      ) : (
        <div className="space-y-6">
          {/* Supporting Chart (if applicable) */}
          {reportResult?.has_chart && rows.length > 0 && (
            <div className="bg-surface border border-border rounded-card p-5">
              <h3 className="text-[15px] font-semibold text-text mb-3">
                {activeReport === "time_slot_performance"
                  ? "Revenue by Time of Day (₹)"
                  : `Top ${topN} Items Distribution`}
              </h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={rows}
                    margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                  >
                    <XAxis
                      dataKey={activeReport === "time_slot_performance" ? "slot" : "name"}
                      tick={{ fontSize: 12, fill: "#5B645F" }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: "#5B645F" }} />
                    <Tooltip
                      formatter={(val) => [
                        activeReport === "time_slot_performance" || topMeasure === "revenue"
                          ? formatCurrency(val)
                          : formatNumber(val),
                        "Value",
                      ]}
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2DDD2",
                        borderRadius: "6px",
                        fontSize: "13px",
                      }}
                    />
                    <Bar dataKey={reportResult.chart_key || "revenue"} fill="#1F5C47" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Main Table */}
          <div className="bg-surface border border-border rounded-card overflow-hidden">
            <DataTable
              columns={columns}
              data={rows}
              keyField="id"
              caption={reportResult?.title || "Report data"}
              pageSize={15}
            />

            {/* Totals Row if present */}
            {totals && rows.length > 0 && (
              <div className="p-4 bg-surface-muted border-t-2 border-border flex items-center justify-between text-[14px] font-semibold text-text">
                <span>Totals</span>
                <div className="flex items-center gap-6">
                  {totals.quantity !== undefined && (
                    <span>Total units: {formatNumber(totals.quantity)}</span>
                  )}
                  {totals.total_revenue !== undefined && (
                    <span className="text-primary font-bold">
                      Revenue: {formatCurrency(totals.total_revenue)}
                    </span>
                  )}
                  {totals.gross_profit !== undefined && (
                    <span className="text-status-ok">
                      Gross profit: {formatCurrency(totals.gross_profit)}
                    </span>
                  )}
                  {totals.stock_value !== undefined && (
                    <span className="text-primary font-bold">
                      Valuation: {formatCurrency(totals.stock_value)}
                    </span>
                  )}
                  {totals.estimated_loss !== undefined && (
                    <span className="text-status-danger">
                      Loss: {formatCurrency(totals.estimated_loss)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapsible "How this is calculated" note */}
      <div className="mt-6 p-4 bg-surface-muted/60 border border-border rounded-card text-[13px]">
        <button
          type="button"
          onClick={() => setIsCalcNoteOpen(!isCalcNoteOpen)}
          className="w-full flex items-center justify-between text-left font-medium text-text hover:text-primary transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-text-muted" />
            <span>How this report is calculated</span>
          </span>
          {isCalcNoteOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {isCalcNoteOpen && (
          <p className="mt-2.5 text-text-muted leading-relaxed">
            {CALCULATION_NOTES[activeReport] || "Report computed from transaction and inventory registers."}
          </p>
        )}
      </div>
    </div>
  );
}
