import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  AlertTriangle,
  Package,
  Tags,
  ArrowLeftRight,
  Truck,
  FileText,
  Boxes,
  ScrollText,
  Factory,
  Lightbulb,
  Sliders,
  BarChart3,
  HelpCircle,
  X,
} from "lucide-react";
import { STORE_NAME } from "../lib/constants";
import clsx from "clsx";

export default function Sidebar({
  alertCount = 3,
  user,
  isOpenMobile,
  onCloseMobile,
}) {
  const role = user?.role || "admin";

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/alerts", label: "Alerts", icon: AlertTriangle, badge: alertCount },
    {
      group: "INVENTORY",
      items: [
        { to: "/products", label: "Products", icon: Package },
        { to: "/categories", label: "Categories", icon: Tags, hide: role === "production" },
        { to: "/stock", label: "Stock movements", icon: ArrowLeftRight },
      ].filter((i) => !i.hide),
    },
    {
      group: "BUYING",
      hide: role === "production",
      items: [
        { to: "/suppliers", label: "Suppliers", icon: Truck },
        { to: "/purchase-orders", label: "Purchase orders", icon: FileText },
      ],
    },
    {
      group: "MAKING",
      items: [
        { to: "/materials", label: "Raw materials", icon: Boxes },
        { to: "/recipes", label: "Recipes", icon: ScrollText },
        { to: "/production-orders", label: "Production orders", icon: Factory },
      ],
    },
    {
      group: "INSIGHTS",
      items: [
        { to: "/advice", label: "Stock advice", icon: Lightbulb },
        { to: "/planner", label: "What-if planner", icon: Sliders },
        { to: "/reports", label: "Reports", icon: BarChart3, hide: role === "staff" },
      ].filter((i) => !i.hide),
    },
    { to: "/help", label: "Help", icon: HelpCircle },
  ].filter((item) => !item.hide);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar-bg text-sidebar-text">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#23352E] flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Geometric box mark in kraft brown accent */}
          <div className="w-8 h-8 rounded-chip bg-kraft flex items-center justify-center shrink-0 text-white font-mono font-bold text-lg shadow-sm">
            <span className="border border-white/40 w-5 h-5 flex items-center justify-center rounded-[2px]">
              S
            </span>
          </div>
          <div className="overflow-hidden">
            <div className="text-[17px] font-semibold tracking-tight text-white leading-tight">
              StockSense
            </div>
            <div className="text-[12px] text-[#93A59E] truncate max-w-[150px]">
              {STORE_NAME}
            </div>
          </div>
        </div>

        {isOpenMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="md:hidden text-sidebar-text hover:text-white p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav
        aria-label="Sidebar Navigation"
        className="flex-1 overflow-y-auto px-3 py-4 space-y-4 text-[14px]"
      >
        {navItems.map((item, idx) => {
          if (item.group) {
            return (
              <div key={idx} className="space-y-1 pt-2">
                <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#7A8C85]">
                  {item.group}
                </div>
                {item.items.map((sub) => (
                  <NavLink
                    key={sub.to}
                    to={sub.to}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      clsx(
                        "flex items-center justify-between px-3 py-2 rounded-btn transition-colors group",
                        isActive
                          ? "bg-[#253931] text-white font-medium"
                          : "text-[#B7C7C0] hover:text-white hover:bg-[#1E2E27]"
                      )
                    }
                  >
                    <div className="flex items-center gap-3 truncate">
                      <sub.icon className="w-4 h-4 shrink-0 stroke-[1.75] opacity-80 group-hover:opacity-100" />
                      <span className="truncate">{sub.label}</span>
                    </div>
                  </NavLink>
                ))}
              </div>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                clsx(
                  "flex items-center justify-between px-3 py-2 rounded-btn transition-colors group",
                  isActive
                    ? "bg-[#253931] text-white font-medium"
                    : "text-[#B7C7C0] hover:text-white hover:bg-[#1E2E27]"
                )
              }
            >
              <div className="flex items-center gap-3 truncate">
                <item.icon className="w-4 h-4 shrink-0 stroke-[1.75] opacity-80 group-hover:opacity-100" />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1.5 py-0.2 text-[11px] font-semibold bg-status-danger text-white rounded-full tabular-nums">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Role Footer */}
      {user && (
        <div className="p-3 border-t border-[#23352E] bg-[#141E1A] text-[13px] flex items-center justify-between">
          <div className="overflow-hidden">
            <div className="font-medium text-white truncate">{user.name}</div>
            <div className="text-[12px] text-[#7A8C85] capitalize">{user.role}</div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-[240px] shrink-0 fixed inset-y-0 left-0 z-30 shadow-none border-r border-[#23352E]">
        {sidebarContent}
      </aside>

      {/* Tablet icon rail (768px - 1023px) */}
      <aside className="hidden md:block lg:hidden w-[72px] shrink-0 fixed inset-y-0 left-0 z-30 border-r border-[#23352E] bg-sidebar-bg text-sidebar-text">
        <div className="p-4 border-b border-[#23352E] flex justify-center">
          <div className="w-9 h-9 rounded-chip bg-kraft flex items-center justify-center text-white font-mono font-bold text-lg">
            S
          </div>
        </div>
        <nav className="p-2 space-y-2 overflow-y-auto">
          {navItems.flatMap((i) => (i.group ? i.items : [i])).map((sub) => (
            <NavLink
              key={sub.to}
              to={sub.to}
              title={sub.label}
              className={({ isActive }) =>
                clsx(
                  "w-11 h-11 mx-auto flex items-center justify-center rounded-btn transition-colors relative",
                  isActive ? "bg-[#253931] text-white" : "text-[#B7C7C0] hover:text-white hover:bg-[#1E2E27]"
                )
              }
            >
              <sub.icon className="w-5 h-5 stroke-[1.75]" />
              {sub.badge > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-status-danger rounded-full" />
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile Drawer (under 768px) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[1px]"
            onClick={onCloseMobile}
          />
          <div className="relative w-[280px] max-w-[80%] h-full shadow-dialog z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
