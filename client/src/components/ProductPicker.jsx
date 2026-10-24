import { useState, useRef, useEffect } from "react";
import { Search, Check, ChevronDown } from "lucide-react";
import clsx from "clsx";

export default function ProductPicker({
  products = [],
  value,
  onChange,
  placeholder = "Search product by name or item code...",
  disabled = false,
  className,
  id,
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedProduct = products.find(
    (p) => String(p.id) === String(value) || String(p.product_id) === String(value)
  );

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = products.filter((p) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    const name = (p.name || "").toLowerCase();
    const sku = (p.sku || "").toLowerCase();
    const cat = (p.category || "").toLowerCase();
    return name.includes(q) || sku.includes(q) || cat.includes(q);
  });

  const handleSelect = (product) => {
    onChange(product.id || product.product_id, product);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className={clsx("relative", className)}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={clsx(
          "min-h-[44px] px-3 py-2 bg-surface border border-border-strong rounded-input flex items-center justify-between gap-2 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
          disabled && "opacity-50 cursor-not-allowed bg-surface-muted"
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Search className="w-4 h-4 text-text-muted shrink-0 stroke-[1.75]" />
          {selectedProduct ? (
            <div className="flex items-center gap-2 truncate text-[15px]">
              <span className="font-medium text-text">{selectedProduct.name}</span>
              {selectedProduct.sku && (
                <span className="font-mono text-[13px] text-text-muted bg-surface-muted px-1.5 py-0.5 rounded border border-border">
                  {selectedProduct.sku}
                </span>
              )}
              <span className="text-[13px] text-text-muted">
                ({selectedProduct.current_stock} {selectedProduct.unit || "in stock"})
              </span>
            </div>
          ) : (
            <span className="text-[14px] text-text-muted">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={clsx(
            "w-4 h-4 text-text-muted shrink-0 transition-transform duration-150",
            isOpen && "rotate-180"
          )}
        />
      </div>

      {isOpen && (
        <div className="absolute z-40 top-full left-0 right-0 mt-1 bg-surface border border-border-strong rounded-card shadow-dropdown max-h-64 overflow-y-auto">
          <div className="p-2 border-b border-border sticky top-0 bg-surface">
            <input
              id={id}
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to filter..."
              className="w-full h-9 px-3 text-[14px] bg-surface-muted border border-border rounded-input outline-none focus:border-primary"
            />
          </div>

          <div className="py-1">
            {filtered.length === 0 ? (
              <div className="p-3 text-[13px] text-text-muted text-center">
                No matching products found
              </div>
            ) : (
              filtered.map((p) => {
                const isSelected =
                  selectedProduct &&
                  (selectedProduct.id === p.id || selectedProduct.product_id === p.product_id);
                return (
                  <div
                    key={p.id || p.product_id}
                    onClick={() => handleSelect(p)}
                    className={clsx(
                      "px-3 py-2 flex items-center justify-between gap-3 text-[14px] cursor-pointer hover:bg-primary-subtle transition-colors",
                      isSelected && "bg-primary-subtle/70 font-medium"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-text font-medium">{p.name}</span>
                      {p.sku && (
                        <span className="font-mono text-[12px] text-text-muted bg-surface-muted px-1 py-0.2 rounded border border-border">
                          {p.sku}
                        </span>
                      )}
                      <span className="text-[12px] text-text-muted">
                        • {p.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[13px] tabular-nums text-text-muted font-medium">
                        {p.current_stock} {p.unit || "units"} left
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
