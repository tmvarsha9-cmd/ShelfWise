import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Filter } from "lucide-react";
import { getProducts } from "../../api/products";
import { getCategories } from "../../api/categories";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import StatusChip from "../../components/StatusChip";
import ProductFormDrawer from "./ProductFormDrawer";
import FilterBar from "../../components/FilterBar";
import { getProductStockStatus } from "../../lib/stockStatus";
import { formatCurrency, formatNumber } from "../../lib/format";
import { SOURCE_TYPES, SOURCE_TYPE_LABELS } from "../../lib/constants";

export default function ProductList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const {
    data: products = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["products", { search, categoryFilter, sourceFilter, stockStatusFilter }],
    queryFn: () =>
      getProducts({
        search,
        category: categoryFilter,
        source_type: sourceFilter,
        stock_status: stockStatusFilter,
      }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const columns = [
    {
      header: "Item code",
      field: "sku",
      sortable: true,
      isMono: true,
      headerClassName: "w-28",
    },
    {
      header: "Name",
      field: "name",
      sortable: true,
      render: (p) => (
        <div>
          <span className="font-semibold text-text">{p.name}</span>
          {p.has_expiry && (
            <span className="block text-[12px] text-text-muted">Perishable</span>
          )}
        </div>
      ),
    },
    {
      header: "Category",
      field: "category",
      sortable: true,
    },
    {
      header: "How you get it",
      field: "source_type",
      sortable: true,
      render: (p) => (
        <span className="text-[13px] text-text-muted">
          {SOURCE_TYPE_LABELS[p.source_type] || p.source_type}
        </span>
      ),
    },
    {
      header: "In stock",
      field: "current_stock",
      sortable: true,
      align: "right",
      render: (p) => (
        <span className="font-medium">
          {formatNumber(p.current_stock)} {p.unit}
        </span>
      ),
    },
    {
      header: "Reorder when",
      field: "reorder_level",
      sortable: true,
      align: "right",
      render: (p) => formatNumber(p.reorder_level),
    },
    {
      header: "Price",
      field: "unit_price",
      sortable: true,
      align: "right",
      render: (p) => formatCurrency(p.unit_price),
    },
    {
      header: "Status",
      field: "status",
      render: (p) => {
        const meta = getProductStockStatus(p);
        return <StatusChip variant={meta.variant} label={meta.label} />;
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        description="All items currently tracked in stock. Click any item to view batches and movement history."
        action={
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex items-center gap-2 h-11 px-4 text-[14px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-btn shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>Add product</span>
          </button>
        }
      />

      {/* Filter Bar */}
      <FilterBar>
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.75]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or item code…"
            className="w-full h-10 pl-9 pr-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className="h-10 px-3 text-[13px] bg-surface border border-border rounded-input text-text outline-none focus:border-primary"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* How you get it */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            aria-label="Filter by how you get it"
            className="h-10 px-3 text-[13px] bg-surface border border-border rounded-input text-text outline-none focus:border-primary"
          >
            <option value="">All sources</option>
            <option value={SOURCE_TYPES.PURCHASED}>Bought from supplier</option>
            <option value={SOURCE_TYPES.MANUFACTURED}>Made in-house</option>
          </select>

          {/* Stock Status */}
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            aria-label="Filter by stock status"
            className="h-10 px-3 text-[13px] bg-surface border border-border rounded-input text-text outline-none focus:border-primary"
          >
            <option value="">All stock levels</option>
            <option value="IN_STOCK">In stock</option>
            <option value="LOW_STOCK">Low stock</option>
            <option value="OUT_OF_STOCK">Out of stock</option>
          </select>
        </div>
      </FilterBar>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={products}
        keyField="id"
        caption="Products inventory list"
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        emptyMessage="No products match your search or filter criteria."
        emptyActionLabel="Add new product"
        onEmptyAction={() => setIsDrawerOpen(true)}
        onRowClick={(p) => navigate(`/products/${p.id}`)}
        pageSize={12}
      />

      {/* Add Product Drawer */}
      <ProductFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
