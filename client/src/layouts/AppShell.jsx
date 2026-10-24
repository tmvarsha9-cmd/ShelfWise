import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { getInventorySummary } from "../api/inventory";
import { getCurrentUser, logout } from "../api/auth";

export default function AppShell() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const user = getCurrentUser();

  const { data: summary } = useQuery({
    queryKey: ["inventory", "summary"],
    queryFn: () => getInventorySummary(),
    staleTime: 30000,
  });

  const alertCount = (summary?.low_stock || 0) + (summary?.out_of_stock || 0) + (summary?.expiring_soon || 0);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-bg text-text flex">
      {/* Sidebar navigation */}
      <Sidebar
        alertCount={alertCount}
        user={user}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px] md:pl-[72px] transition-all">
        <TopBar
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          alertCount={alertCount}
          user={user}
          onLogout={handleLogout}
        />

        <main className="flex-1 w-full max-w-[1280px] mx-auto p-4 md:p-6 pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
