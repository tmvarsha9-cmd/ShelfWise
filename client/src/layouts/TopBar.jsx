import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  Download,
  Bell,
  Menu,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../api/products";
import clsx from "clsx";

export default function TopBar({
  onToggleMobileMenu,
  alertCount = 3,
  user,
  onLogout,
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  // Load products for quick global search
  const { data: products = [] } = useQuery({
    queryKey: ["products", "global-search"],
    queryFn: () => getProducts(),
    staleTime: 60000,
  });

  const matchingProducts = searchQuery.trim()
    ? products
        .filter((p) => {
          const q = searchQuery.toLowerCase().trim();
          return (
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
          );
        })
        .slice(0, 6)
    : [];

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectProduct = (productId) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    navigate(`/products/${productId}`);
  };

  return (
    <header className="sticky top-0 z-20 bg-surface border-b border-border h-16 px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label="Open navigation menu"
          className="md:hidden p-2 rounded-btn text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
        >
          <Menu className="w-5 h-5 stroke-[1.75]" />
        </button>

        {/* Global Product Search */}
        <div ref={searchRef} className="relative w-full max-w-sm">
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.75]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search item code or name…"
              className="w-full h-10 pl-9 pr-3 text-[14px] bg-surface-muted border border-border rounded-input outline-none focus:border-primary focus:bg-surface transition-colors"
            />
          </div>

          {/* Quick Search Dropdown */}
          {isSearchOpen && matchingProducts.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border-strong rounded-card shadow-dropdown overflow-hidden z-30">
              <div className="p-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted border-b border-border bg-surface-muted/50 px-3">
                Matching items
              </div>
              <div className="py-1 max-h-60 overflow-y-auto">
                {matchingProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProduct(p.id)}
                    className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-primary-subtle text-[14px] transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-medium text-text">{p.name}</span>
                      <span className="font-mono text-[12px] text-text-muted bg-surface-muted px-1.5 py-0.5 rounded border border-border">
                        {p.sku}
                      </span>
                    </div>
                    <span className="text-[12px] text-text-muted tabular-nums shrink-0">
                      {p.current_stock} in stock
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Quick Action Buttons, Bell, User Menu */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Receive stock secondary button */}
        <Link
          to="/stock/receive"
          className="hidden sm:inline-flex items-center gap-2 h-10 px-3.5 text-[14px] font-medium text-text bg-surface border border-border-strong hover:bg-surface-muted rounded-btn transition-colors whitespace-nowrap"
        >
          <Download className="w-4 h-4 stroke-[1.75]" />
          <span>Receive stock</span>
        </Link>

        {/* Record a sale primary button (at least 44px tall touch target) */}
        <Link
          to="/stock/sale"
          className="inline-flex items-center gap-2 h-11 px-4 text-[14px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-btn shadow-sm transition-colors whitespace-nowrap"
        >
          <ShoppingCart className="w-4 h-4 stroke-[2]" />
          <span>Record a sale</span>
        </Link>

        {/* Alerts Bell */}
        <Link
          to="/alerts"
          aria-label={`View alerts (${alertCount} active)`}
          className="relative p-2 rounded-btn text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
        >
          <Bell className="w-5 h-5 stroke-[1.75]" />
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-status-danger rounded-full" />
          )}
        </Link>

        {/* User Menu */}
        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-btn hover:bg-surface-muted text-text transition-colors"
            aria-label="User profile menu"
          >
            <div className="w-8 h-8 rounded-full bg-primary-subtle text-primary border border-primary/20 flex items-center justify-center font-semibold text-[13px]">
              {user?.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-[13px] font-medium leading-none text-text">
                {user?.name || "Store User"}
              </span>
              <span className="text-[11px] text-text-muted capitalize">
                {user?.role || "Staff"}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted hidden xl:block" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-1 w-52 bg-surface border border-border-strong rounded-card shadow-dropdown py-1.5 z-30">
              <div className="px-3 py-2 border-b border-border">
                <div className="text-[13px] font-medium text-text">{user?.name}</div>
                <div className="text-[12px] text-text-muted">{user?.email}</div>
                <div className="text-[11px] text-primary font-medium capitalize mt-0.5">
                  Role: {user?.role}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onLogout();
                }}
                className="w-full px-3 py-2 text-left text-[13px] text-status-danger hover:bg-status-danger-bg flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4 stroke-[1.75]" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
