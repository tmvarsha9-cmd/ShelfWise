import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "../layouts/AppShell";
import AuthLayout from "../layouts/AuthLayout";
import ProtectedRoute from "./ProtectedRoute";

// Pages
import Login from "../features/auth/Login";
import Dashboard from "../features/dashboard/Dashboard";
import Alerts from "../features/alerts/Alerts";
import ProductList from "../features/products/ProductList";
import ProductDetail from "../features/products/ProductDetail";
import Categories from "../features/products/Categories";
import StockHistory from "../features/stock/StockHistory";
import RecordSale from "../features/stock/RecordSale";
import ReceiveStock from "../features/stock/ReceiveStock";
import Suppliers from "../features/purchasing/Suppliers";
import PurchaseOrders from "../features/purchasing/PurchaseOrders";
import PurchaseOrderDetail from "../features/purchasing/PurchaseOrderDetail";
import RawMaterials from "../features/manufacturing/RawMaterials";
import Recipes from "../features/manufacturing/Recipes";
import ProductionOrders from "../features/manufacturing/ProductionOrders";
import StockAdvice from "../features/ai-insights/StockAdvice";
import WhatIfPlanner from "../features/simulator/WhatIfPlanner";
import Reports from "../features/reports/Reports";
import Help from "../features/help/Help";
import NotFound from "../features/NotFound";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Protected App routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/stock" element={<StockHistory />} />
          <Route path="/stock/sale" element={<RecordSale />} />
          <Route path="/stock/receive" element={<ReceiveStock />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/purchase-orders/:id" element={<PurchaseOrderDetail />} />
          <Route path="/materials" element={<RawMaterials />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/production-orders" element={<ProductionOrders />} />
          <Route path="/advice" element={<StockAdvice />} />
          <Route path="/planner" element={<WhatIfPlanner />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/:type" element={<Reports />} />
          <Route path="/help" element={<Help />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
