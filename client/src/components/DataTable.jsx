import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import Spinner from "./Spinner";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import clsx from "clsx";

export default function DataTable({
  columns = [],
  data = [],
  keyField = "id",
  caption,
  isLoading = false,
  error = null,
  onRetry = null,
  emptyMessage = "No items to display.",
  emptyActionLabel,
  onEmptyAction,
  onRowClick,
  pageSize = 10,
  className,
}) {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (field) => {
    if (!field) return;
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortField(null);
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center bg-surface border border-border rounded-card min-h-[220px]">
        <Spinner size="lg" />
        <span className="text-[14px] text-text-muted mt-3">Loading records…</span>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message={typeof error === "string" ? error : error.message}
        onRetry={onRetry}
      />
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        description={emptyMessage}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className={clsx("bg-surface border border-border rounded-card overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[15px]" aria-label={caption}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="sticky top-0 z-10 bg-surface-muted border-b border-border text-[12px] uppercase tracking-wider text-text-muted select-none">
            <tr>
              {columns.map((col) => {
                const isSorted = sortField === col.field;
                return (
                  <th
                    key={col.field || col.header}
                    scope="col"
                    onClick={() => col.sortable && handleSort(col.field)}
                    className={clsx(
                      "py-3 px-4 font-semibold whitespace-nowrap",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      col.sortable && "cursor-pointer hover:text-text",
                      col.headerClassName
                    )}
                  >
                    <div
                      className={clsx(
                        "inline-flex items-center gap-1.5",
                        col.align === "right" && "flex-row-reverse"
                      )}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-text-muted">
                          {isSorted ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="w-3.5 h-3.5 stroke-[2] text-primary" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 stroke-[2] text-primary" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-text">
            {paginatedData.map((row, idx) => {
              const rowKey = row[keyField] ?? idx;
              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={clsx(
                    "transition-colors",
                    onRowClick ? "cursor-pointer hover:bg-surface-muted/60" : "hover:bg-surface-muted/30"
                  )}
                >
                  {columns.map((col) => {
                    const value = col.render ? col.render(row) : row[col.field];
                    return (
                      <td
                        key={col.field || col.header}
                        className={clsx(
                          "py-3 px-4",
                          col.align === "right" && "text-right tabular-nums",
                          col.align === "center" && "text-center",
                          col.isMono && "font-mono text-[14px]",
                          col.className
                        )}
                      >
                        {value !== undefined && value !== null ? value : "—"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-muted/40 text-[13px] text-text-muted">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} records
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="p-1.5 rounded border border-border bg-surface hover:bg-surface-muted disabled:opacity-40 disabled:hover:bg-surface transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-text px-1 tabular-nums">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="p-1.5 rounded border border-border bg-surface hover:bg-surface-muted disabled:opacity-40 disabled:hover:bg-surface transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
