# StockSense

StockSense is an inventory and stock management web application built for small and medium retail shops, supermarkets, and local production businesses.

Designed with a warm, tidy stockroom ledger aesthetic: high contrast, tabular figures, plain language for shop staff, and clear separation between factual stock data and estimated replenishment advice.

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- (Optional) PostgreSQL if running against the full database backend

### Quick Start (Standalone / Demo Mode)
By default, the client runs with seeded in-memory state that persists across page reloads in `sessionStorage`:
```bash
cd client
npm install
npm run dev
```
Open **[http://localhost:5174](http://localhost:5174)** in your browser.

### Running with the Backend Server
To connect the client to the Express API server:
1. Start the backend:
   ```bash
   cd server
   npm install
   npm run dev
   ```
2. Start the frontend:
   ```bash
   cd client
   VITE_USE_MOCKS=false npm run dev
   ```
*(Note: When `VITE_USE_MOCKS` is set to `true` or omitted, all transaction, product, and order mutations update the in-memory store, while AI endpoints seamlessly fall back to deterministic fixtures if the server is offline).*

---

## Demo Credentials

You can sign in on `/login` using the following demo credentials:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin / Store Owner** | `admin@store.local` | `admin123` | Full access to all modules, settings, and margins |
| **Manager** | `manager@store.local` | `manager123` | Full access to stock, buying, and reports |
| **Counter Staff** | `staff@store.local` | `staff123` | Fast sale and stock receiving; financial reports hidden |
| **Production Operator** | `production@store.local` | `prod123` | Making section, raw materials, recipes, and production orders |

---

## Application Pages & Navigation

### 1. Dashboard (`/`)
- **Today at a glance**: 6 primary figure tiles (Active products, Stock valuation, Low stock count, Out of stock count, Expiring soon within 7 days, and Pending supplier deliveries).
- **Needs attention**: Top 5 urgent replenishment recommendations from stock advice.
- **Stock by category**: Horizontal distribution bar chart across retail departments.
- **Recent stock movements**: Live audit log of the last 8 stock movements.
- **Quick actions strip**: Direct one-click access to Record a sale, Receive stock, Add product, and Create purchase order.

### 2. Alerts (`/alerts`)
- Grouped notifications for Low stock, Out of stock, Predicted stockout, Expired items, Expiring soon, Raw material shortages, and Delayed supplier purchase orders.
- Explicit labeling distinguishing factual states (`Fact`) from projected replenishment estimates (`Estimate`).

### 3. Inventory
- **Products (`/products`)**: Filterable and sortable catalog with item codes, category, "How you get it" source type, in-stock count, and status chips.
- **Add / Edit Product Drawer**: Form divided into Basics, How you get it (radio cards), Stock rules, and Expiry.
- **Product Detail (`/products/:id`)**: Header summary with soft-delete dialog ("Remove Bread? History is kept"), and tabs for:
  - *Overview*: Cost, price, gross margin, lead time, reorder levels.
  - *Batches*: FEFO-ordered batch ledger with received dates and expiry tracking.
  - *Stock history*: Transaction log specific to the item.
  - *Advice*: Item-specific replenishment card with on-demand explanation.
- **Categories (`/categories`)**: Inline category management to add, rename, and deactivate shop departments.

### 4. Stock Movements
- **Record a sale (`/stock/sale`)**: Fast counter screen with multi-item entry, quantity steppers, live remaining stock feedback ("After this, 18 will be left"), and automatic idempotency key generation.
- **Receive stock (`/stock/receive`)**: Receipt screen with optional Purchase Order linking (prefills lines and costs), batch code assignment, unit cost, and expiry date logging.
- **Stock history (`/stock`)**: Complete audit log with date range presets (Today, Last 7 days, This month, Custom), movement type filter, signed quantities (+/-), and CSV export.

### 5. Buying
- **Suppliers (`/suppliers`)**: Vendor directory with delivery lead times, minimum order quantities, and contact information.
- **Purchase orders (`/purchase-orders`)**: Order tracking (Draft, Confirmed, Partly received, Received, Cancelled, Delayed) with line-item creation drawer and running total.
- **Purchase order detail (`/purchase-orders/:id`)**: Ordered vs received item quantities, plain-text status progress timeline, "Receive goods" action, and order cancellation with confirmation.

### 6. Making (In-house Manufacturing)
- **Raw materials (`/materials`)**: Physical stock tracking and reorder thresholds for ingredients (flour, yeast, sugar, starter culture).
- **Recipes (BOM) (`/recipes`)**: Formulas defining what materials go into 1 unit of a manufactured product.
- **Production orders (`/production-orders`)**: Production planning with automated raw materials availability check. Blocks completion if any ingredient is short and specifies exact quantities deducted upon completion.

### 7. Insights
- **Stock advice (`/advice`)**: Deterministic replenishment calculations from `GET /api/insights`. Features summary metric tiles, traceable calculation input rows, and on-demand AI explanations (`POST /api/explain/:id`) tagged as "AI-written" or "Standard explanation".
- **What-if planner (`/planner`)**: Scenario simulation (`POST /api/simulate`) with quick presets (+30% festival week, +20% promotion, -20% quiet week), custom slider, debounced evaluation, and a side-by-side comparison chart with a supplier delivery time reference line.
- **Reports (`/reports`)**: 9 retail reports (Sales, Time-slot performance, Footfall, Current stock, Top products, High/low stock, Expired products, Stockout products, and Products by category) with filter bars, CSV export, and collapsible calculation notes.

### 8. Help & Guides (`/help`)
- Step-by-step guidance on recording sales, receiving deliveries, and interpreting stock advice.
- Plain-language retail glossary explaining Days left, Reorder point, Safety stock, Delivery time, Expiry risk, and How you get it.

---

## Technical Stack

- **Framework**: React 18 + Vite
- **Routing**: React Router DOM (v6) with protected route shell
- **State & Data Fetching**: TanStack React Query (v5)
- **Styling**: Tailwind CSS + Custom Design System Tokens (`tokens.css`)
- **Typography**: IBM Plex Sans (body & headings), IBM Plex Mono (item & batch codes)
- **Charts**: Recharts
- **Icons**: Lucide React