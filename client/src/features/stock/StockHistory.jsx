import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download, ShoppingCart, Plus, ArrowLeftRight } from "lucide-react";
import { getInventoryTransactions } from "../../api/inventory";
import { getProducts } from "../../api/products";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import StatusChip from "../../components/StatusChip";
import FilterBar from "../../components/FilterBar";
import DateRangeFilter from "../../components/DateRangeFilter";
import { formatDateTime, formatNumber } from "../../lib/format";
import clsx from "clsx";

export default function StockHistory() {
  const [productFilter, setProductFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });

  const {
    data: transactions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "inventory",
      "transactions",
      { product_id: productFilter, type: typeFilter, ...dateRange },
    ],
    queryFn: () =>
      getInventoryTransactions({
        product_id: productFilter,
        type: typeFilter,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });

  const getMovementMeta = (type) => {
    switch (type) {
      case "STOCK_IN":
        return { label: "Stock in", variant: "ok" };
      case "SOLD":
        return { label: "Sold", variant: "info" };
      case "PRODUCED":
        return { label: "Produced", variant: "ok" };
      case "USED_IN_PRODUCTION":
        return { label: "Used in production", variant: "neutral" };
      case "DAMAGED":
        return { label: "Damaged", variant: "danger" };
      case "CORRECTION":
        return { label: "Correction", variant: "warning" };
      default:
        return { label: type, variant: "neutral" };
    }
  };

  const exportCsv = () => {
    if (transactions.length === 0) return;
    const headers = ["ID", "Date & Time", "Item", "Type", "Quantity", "Recorded By", "Reference", "Note"];
    const rows = transactions.map((t) => [
      t.id,
      t.created_at,
      `"${t.product_name}"`,
      t.type,
      t.quantity,
      `"${t.who}"`,
      `"${t.reference || ""}"`,
      `"${t.note || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stocksense_stock_movements_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      header: "Date & Time",
      field: "created_at",
      sortable: true,
      render: (t) => (
        <span className="tabular-nums text-text font-normal">{formatDateTime(t.created_at)}</span>
      ),
    },
    {
      header: "Item",
      field: "product_name",
      sortable: true,
      render: (t) => (
        <div>
          <span className="font-semibold text-text">{t.product_name}</span>
          {t.note && <span className="block text-[12px] text-text-muted">{t.note}</span>}
        </div>
      ),
    },
    {
      header: "Movement type",
      field: "type",
      sortable: true,
      render: (t) => {
        const meta = getMovementMeta(t.type);
        return <StatusChip variant={meta.variant} label={meta.label} />;
      },
    },
    {
      header: "Quantity",
      field: "quantity",
      sortable: true,
      align: "right",
      render: (t) => {
        const isPos = t.quantity > 0;
        return (
          <span
            className={clsx(
              "font-semibold tabular-nums text-[15px]",
              isPos ? "text-status-ok" : "text-status-danger"
            )}
          >
            {isPos ? `+${formatNumber(t.quantity)}` : formatNumber(t.quantity)}
          </span>
        );
      },
    },
    {
      header: "Recorded by",
      field: "who",
      sortable: true,
      render: (t) => <span className="text-text-muted text-[13px]">{t.who}</span>,
    },
    {
      header: "Reference",
      field: "reference",
      sortable: true,
      isMono: true,
      render: (t) => (
        <span className="font-mono text-[13px] text-text-muted bg-surface-muted px-1.5 py-0.5 rounded border border-border">
          {t.reference || "—"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Stock movements"
        description="Complete audit log of all stock received, sold, used or adjusted."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              disabled={transactions.length === 0}
              className="inline-flex items-center gap-2 h-10 px-3.5 text-[14px] font-medium text-text bg-surface border border-border-strong hover:bg-surface-muted rounded-btn transition-colors disabled:opacity-40"
            >
              <Download className="w-4 h-4 stroke-[1.75]" />
              <span>Export CSV</span>
            </button>
            <Link
              to="/stock/sale"
              className="inline-flex items-center gap-2 h-10 px-4 text-[14px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-btn transition-colors shadow-sm"
            >
              <ShoppingCart className="w-4 h-4 stroke-[2]" />
              <span>Record sale</span>
            </Link>
          </div>
        }
      />

      {/* Filter Bar */}
      <FilterBar>
        {/* Date presets */}
        <DateRangeFilter
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={setDateRange}
        />

        {/* Product and Type dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            aria-label="Filter by product"
            className="h-10 px-3 text-[13px] bg-surface border border-border rounded-input text-text outline-none focus:border-primary"
          >
            <option value="">All products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by movement type"
            className="h-10 px-3 text-[13px] bg-surface border border-border rounded-input text-text outline-none focus:border-primary"
          >
            <option value="">All movement types</option>
            <option value="STOCK_IN">Stock in</option>
            <option value="SOLD">Sold</option>
            <option value="DAMAGED">Damaged</option>
            <option value="CORRECTION">Correction</option>
            <option value="USED_IN_PRODUCTION">Used in production</option>
            <option value="PRODUCED">Produced</option>
          </select>
        </div>
      </FilterBar>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={transactions}
        keyField="id"
        caption="Stock transactions audit trail"
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        emptyMessage="No stock movements found for the selected filters."
        pageSize={15}
      />
    </div>
  );
}
