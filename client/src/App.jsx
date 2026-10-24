// Application shell and page routes.
import { Link, Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Inventory from "./pages/Inventory.jsx";
import AIInsights from "./pages/AIInsights.jsx";

export default function App() {
  return (
    <main>
      <header>
        <h1>StockSense</h1>
        <nav aria-label="Main navigation">
          <Link to="/">Dashboard</Link>{" | "}
          <Link to="/inventory">Inventory</Link>{" | "}
          <Link to="/insights">AI Insights</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/insights" element={<AIInsights />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}
