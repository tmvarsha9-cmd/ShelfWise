// In-memory persistent mock database for StockSense frontend.
// Seeded with realistic Indian retail store data.

const STORAGE_KEY = "stocksense_mock_db_v1";

const initialCategories = [
  { id: 1, name: "Dairy", active: true },
  { id: 2, name: "Grocery", active: true },
  { id: 3, name: "Bakery", active: true },
  { id: 4, name: "Snacks", active: true },
  { id: 5, name: "Beverages", active: true },
  { id: 6, name: "Stationery", active: true },
  { id: 7, name: "Raw Materials", active: true },
];

const initialSuppliers = [
  {
    id: 1,
    name: "Nandini Dairy Distributors",
    contact_person: "Suresh Gowda",
    phone: "+91 98450 12345",
    email: "orders@nandinidist.in",
    lead_time_days: 1,
    min_order_qty: 20,
    notes: "Daily morning milk and dairy delivery between 5:30 AM and 7:00 AM.",
    active: true,
  },
  {
    id: 2,
    name: "Sri Krishna Wholesale Groceries",
    contact_person: "Ramesh Sharma",
    phone: "+91 98201 65432",
    email: "krishnagrocery@trade.co.in",
    lead_time_days: 4,
    min_order_qty: 15,
    notes: "Main staples, rice, sugar, and cooking oil supplier. Credit period 15 days.",
    active: true,
  },
  {
    id: 3,
    name: "Cauvery Poultry & Farm Fresh",
    contact_person: "Venkatesh Rao",
    phone: "+91 94481 98765",
    email: "supply@cauverypoultry.in",
    lead_time_days: 3,
    min_order_qty: 5,
    notes: "Fresh egg trays delivered twice weekly (Tuesday & Friday).",
    active: true,
  },
  {
    id: 4,
    name: "Vidya Stationery Mart",
    contact_person: "Anil Kumar",
    phone: "+91 98862 33445",
    email: "vidya.orders@stationery.in",
    lead_time_days: 7,
    min_order_qty: 25,
    notes: "Notebooks, registers, and billing paper rolls.",
    active: true,
  },
  {
    id: 5,
    name: "Apex Beverages Agency",
    contact_person: "Deepak Patel",
    phone: "+91 97123 44556",
    email: "apexbeverages@agency.com",
    lead_time_days: 5,
    min_order_qty: 12,
    notes: "Cold drinks, juices, and packaged soda.",
    active: true,
  },
  {
    id: 6,
    name: "Shakti Milling & Bakery Ingredients",
    contact_person: "Manoj Verma",
    phone: "+91 93210 77889",
    email: "orders@shaktimill.in",
    lead_time_days: 2,
    min_order_qty: 10,
    notes: "Commercial baking flour, yeast, baking agents, and food essences.",
    active: true,
  },
];

const initialProducts = [
  {
    id: 1,
    sku: "BRD-001",
    name: "Bread",
    category: "Bakery",
    category_id: 3,
    source_type: "MANUFACTURED",
    unit: "pcs",
    current_stock: 20,
    reorder_level: 30,
    unit_price: 40,
    purchase_cost: 26,
    daily_demand: 15,
    expiry_date: "2026-10-27",
    lead_time_days: 2,
    min_order_qty: 1,
    supplier_id: null,
    active: true,
    has_expiry: true,
    shelf_life_days: 4,
  },
  {
    id: 2,
    sku: "MLK-001",
    name: "Milk 1L",
    category: "Dairy",
    category_id: 1,
    source_type: "PURCHASED",
    unit: "pack",
    current_stock: 120,
    reorder_level: 50,
    unit_price: 28,
    purchase_cost: 22,
    daily_demand: 30,
    expiry_date: "2026-10-26",
    lead_time_days: 1,
    min_order_qty: 20,
    supplier_id: 1,
    active: true,
    has_expiry: true,
    shelf_life_days: 2,
  },
  {
    id: 3,
    sku: "RIC-005",
    name: "Rice 5kg",
    category: "Grocery",
    category_id: 2,
    source_type: "PURCHASED",
    unit: "bag",
    current_stock: 200,
    reorder_level: 40,
    unit_price: 350,
    purchase_cost: 290,
    daily_demand: 6,
    expiry_date: null,
    lead_time_days: 5,
    min_order_qty: 10,
    supplier_id: 2,
    active: true,
    has_expiry: false,
    shelf_life_days: null,
  },
  {
    id: 4,
    sku: "EGG-030",
    name: "Eggs (tray)",
    category: "Dairy",
    category_id: 1,
    source_type: "PURCHASED",
    unit: "tray",
    current_stock: 45,
    reorder_level: 20,
    unit_price: 180,
    purchase_cost: 145,
    daily_demand: 8,
    expiry_date: "2026-11-14",
    lead_time_days: 3,
    min_order_qty: 5,
    supplier_id: 3,
    active: true,
    has_expiry: true,
    shelf_life_days: 21,
  },
  {
    id: 5,
    sku: "NTB-100",
    name: "Notebook",
    category: "Stationery",
    category_id: 6,
    source_type: "PURCHASED",
    unit: "pcs",
    current_stock: 80,
    reorder_level: 25,
    unit_price: 60,
    purchase_cost: 42,
    daily_demand: 4,
    expiry_date: null,
    lead_time_days: 7,
    min_order_qty: 25,
    supplier_id: 4,
    active: true,
    has_expiry: false,
    shelf_life_days: null,
  },
  {
    id: 6,
    sku: "OIL-001",
    name: "Cooking Oil 1L",
    category: "Grocery",
    category_id: 2,
    source_type: "PURCHASED",
    unit: "pouch",
    current_stock: 18,
    reorder_level: 20,
    unit_price: 160,
    purchase_cost: 135,
    daily_demand: 5,
    expiry_date: null,
    lead_time_days: 4,
    min_order_qty: 15,
    supplier_id: 2,
    active: true,
    has_expiry: false,
    shelf_life_days: null,
  },
  {
    id: 7,
    sku: "BSC-002",
    name: "Biscuits",
    category: "Snacks",
    category_id: 4,
    source_type: "MANUFACTURED",
    unit: "pack",
    current_stock: 150,
    reorder_level: 40,
    unit_price: 20,
    purchase_cost: 13,
    daily_demand: 12,
    expiry_date: "2026-12-20",
    lead_time_days: 4,
    min_order_qty: 1,
    supplier_id: null,
    active: true,
    has_expiry: true,
    shelf_life_days: 60,
  },
  {
    id: 8,
    sku: "CRD-001",
    name: "Curd",
    category: "Dairy",
    category_id: 1,
    source_type: "MANUFACTURED",
    unit: "cup",
    current_stock: 60,
    reorder_level: 25,
    unit_price: 35,
    purchase_cost: 24,
    daily_demand: 10,
    expiry_date: "2026-10-28",
    lead_time_days: 1,
    min_order_qty: 1,
    supplier_id: null,
    active: true,
    has_expiry: true,
    shelf_life_days: 5,
  },
  {
    id: 9,
    sku: "SGR-001",
    name: "Sugar 1kg",
    category: "Grocery",
    category_id: 2,
    source_type: "PURCHASED",
    unit: "kg",
    current_stock: 35,
    reorder_level: 30,
    unit_price: 48,
    purchase_cost: 38,
    daily_demand: 9,
    expiry_date: null,
    lead_time_days: 3,
    min_order_qty: 20,
    supplier_id: 2,
    active: true,
    has_expiry: false,
    shelf_life_days: null,
  },
  {
    id: 10,
    sku: "SFT-001",
    name: "Soft Drink 1L",
    category: "Beverages",
    category_id: 5,
    source_type: "PURCHASED",
    unit: "bottle",
    current_stock: 90,
    reorder_level: 30,
    unit_price: 40,
    purchase_cost: 30,
    daily_demand: 0,
    expiry_date: "2027-03-01",
    lead_time_days: 6,
    min_order_qty: 12,
    supplier_id: 5,
    active: true,
    has_expiry: true,
    shelf_life_days: 180,
  },
];

const initialMaterials = [
  {
    id: 101,
    sku: "RM-FLR-01",
    name: "Wheat Flour (Maida)",
    category: "Raw Materials",
    unit: "kg",
    current_stock: 150,
    reorder_level: 50,
    unit_cost: 32,
    supplier_id: 6,
    active: true,
  },
  {
    id: 102,
    sku: "RM-SGR-01",
    name: "Refined Sugar (Bulk)",
    category: "Raw Materials",
    unit: "kg",
    current_stock: 80,
    reorder_level: 30,
    unit_cost: 36,
    supplier_id: 2,
    active: true,
  },
  {
    id: 103,
    sku: "RM-YST-01",
    name: "Active Dry Yeast",
    category: "Raw Materials",
    unit: "kg",
    current_stock: 12,
    reorder_level: 5,
    unit_cost: 180,
    supplier_id: 6,
    active: true,
  },
  {
    id: 104,
    sku: "RM-CLT-01",
    name: "Live Starter Culture",
    category: "Raw Materials",
    unit: "litre",
    current_stock: 8,
    reorder_level: 3,
    unit_cost: 95,
    supplier_id: 1,
    active: true,
  },
];

const initialBoms = [
  {
    id: 1,
    product_id: 1,
    product_name: "Bread",
    yield_quantity: 1,
    yield_unit: "pcs",
    production_time_hours: 3,
    items: [
      { material_id: 101, material_name: "Wheat Flour (Maida)", quantity: 0.35, unit: "kg" },
      { material_id: 102, material_name: "Refined Sugar (Bulk)", quantity: 0.04, unit: "kg" },
      { material_id: 103, material_name: "Active Dry Yeast", quantity: 0.01, unit: "kg" },
    ],
  },
  {
    id: 2,
    product_id: 8,
    product_name: "Curd",
    yield_quantity: 1,
    yield_unit: "cup",
    production_time_hours: 6,
    items: [
      { material_id: 104, material_name: "Live Starter Culture", quantity: 0.05, unit: "litre" },
    ],
  },
];

const initialBatches = [
  { id: 1, product_id: 1, batch_code: "BCH-BRD-24A", received_date: "2026-10-23", expiry_date: "2026-10-27", initial_qty: 30, remaining_qty: 20 },
  { id: 2, product_id: 2, batch_code: "BCH-MLK-2410", received_date: "2026-10-24", expiry_date: "2026-10-26", initial_qty: 150, remaining_qty: 120 },
  { id: 3, product_id: 4, batch_code: "BCH-EGG-1022", received_date: "2026-10-22", expiry_date: "2026-11-14", initial_qty: 60, remaining_qty: 45 },
  { id: 4, product_id: 8, batch_code: "BCH-CRD-1023", received_date: "2026-10-23", expiry_date: "2026-10-28", initial_qty: 80, remaining_qty: 60 },
  { id: 5, product_id: 7, batch_code: "BCH-BSC-1015", received_date: "2026-10-15", expiry_date: "2026-12-20", initial_qty: 200, remaining_qty: 150 },
  { id: 6, product_id: 2, batch_code: "BCH-MLK-2409", received_date: "2026-10-20", expiry_date: "2026-10-22", initial_qty: 50, remaining_qty: 0 },
];

const initialPurchaseOrders = [
  {
    id: 1,
    po_number: "PO-2026-001",
    supplier_id: 1,
    supplier_name: "Nandini Dairy Distributors",
    status: "RECEIVED",
    created_at: "2026-10-20T08:00:00Z",
    expected_delivery_date: "2026-10-21",
    received_at: "2026-10-21T06:30:00Z",
    total_amount: 3300,
    items: [
      { product_id: 2, product_name: "Milk 1L", quantity: 150, unit_cost: 22, received_qty: 150 },
    ],
  },
  {
    id: 2,
    po_number: "PO-2026-002",
    supplier_id: 2,
    supplier_name: "Sri Krishna Wholesale Groceries",
    status: "PARTIALLY_RECEIVED",
    created_at: "2026-10-21T10:15:00Z",
    expected_delivery_date: "2026-10-25",
    total_amount: 19800,
    items: [
      { product_id: 3, product_name: "Rice 5kg", quantity: 50, unit_cost: 290, received_qty: 30 },
      { product_id: 6, product_name: "Cooking Oil 1L", quantity: 40, unit_cost: 135, received_qty: 0 },
    ],
  },
  {
    id: 3,
    po_number: "PO-2026-003",
    supplier_id: 3,
    supplier_name: "Cauvery Poultry & Farm Fresh",
    status: "CONFIRMED",
    created_at: "2026-10-23T11:00:00Z",
    expected_delivery_date: "2026-10-26",
    total_amount: 5800,
    items: [
      { product_id: 4, product_name: "Eggs (tray)", quantity: 40, unit_cost: 145, received_qty: 0 },
    ],
  },
  {
    id: 4,
    po_number: "PO-2026-004",
    supplier_id: 6,
    supplier_name: "Shakti Milling & Bakery Ingredients",
    status: "CONFIRMED",
    created_at: "2026-10-18T09:30:00Z",
    expected_delivery_date: "2026-10-20", // Past date => Delayed!
    total_amount: 6800,
    items: [
      { product_id: 101, product_name: "Wheat Flour (Maida)", quantity: 150, unit_cost: 32, received_qty: 0 },
      { product_id: 103, product_name: "Active Dry Yeast", quantity: 10, unit_cost: 180, received_qty: 0 },
    ],
  },
  {
    id: 5,
    po_number: "PO-2026-005",
    supplier_id: 4,
    supplier_name: "Vidya Stationery Mart",
    status: "DRAFT",
    created_at: "2026-10-24T09:00:00Z",
    expected_delivery_date: "2026-10-31",
    total_amount: 2100,
    items: [
      { product_id: 5, product_name: "Notebook", quantity: 50, unit_cost: 42, received_qty: 0 },
    ],
  },
  {
    id: 6,
    po_number: "PO-2026-006",
    supplier_id: 5,
    supplier_name: "Apex Beverages Agency",
    status: "CANCELLED",
    created_at: "2026-10-15T14:00:00Z",
    expected_delivery_date: "2026-10-20",
    total_amount: 1440,
    items: [
      { product_id: 10, product_name: "Soft Drink 1L", quantity: 48, unit_cost: 30, received_qty: 0 },
    ],
  },
  {
    id: 7,
    po_number: "PO-2026-007",
    supplier_id: 2,
    supplier_name: "Sri Krishna Wholesale Groceries",
    status: "CONFIRMED",
    created_at: "2026-10-24T07:45:00Z",
    expected_delivery_date: "2026-10-27",
    total_amount: 3800,
    items: [
      { product_id: 9, product_name: "Sugar 1kg", quantity: 100, unit_cost: 38, received_qty: 0 },
    ],
  },
  {
    id: 8,
    po_number: "PO-2026-008",
    supplier_id: 1,
    supplier_name: "Nandini Dairy Distributors",
    status: "DRAFT",
    created_at: "2026-10-24T10:30:00Z",
    expected_delivery_date: "2026-10-25",
    total_amount: 1100,
    items: [
      { product_id: 2, product_name: "Milk 1L", quantity: 50, unit_cost: 22, received_qty: 0 },
    ],
  },
];

const initialProductionOrders = [
  {
    id: 1,
    order_number: "PRD-2026-001",
    product_id: 1,
    product_name: "Bread",
    planned_quantity: 50,
    actual_quantity: 50,
    status: "COMPLETED",
    planned_date: "2026-10-23",
    completed_at: "2026-10-23T16:00:00Z",
    materials_used: [
      { material_id: 101, material_name: "Wheat Flour (Maida)", needed: 17.5, used: 17.5, unit: "kg" },
      { material_id: 102, material_name: "Refined Sugar (Bulk)", needed: 2.0, used: 2.0, unit: "kg" },
      { material_id: 103, material_name: "Active Dry Yeast", needed: 0.5, used: 0.5, unit: "kg" },
    ],
  },
  {
    id: 2,
    order_number: "PRD-2026-002",
    product_id: 8,
    product_name: "Curd",
    planned_quantity: 40,
    actual_quantity: null,
    status: "IN_PROGRESS",
    planned_date: "2026-10-24",
    materials_used: [
      { material_id: 104, material_name: "Live Starter Culture", needed: 2.0, available: 8.0, unit: "litre" },
    ],
  },
  {
    id: 3,
    order_number: "PRD-2026-003",
    product_id: 1,
    product_name: "Bread",
    planned_quantity: 100,
    actual_quantity: null,
    status: "PLANNED",
    planned_date: "2026-10-25",
    materials_used: [
      { material_id: 101, material_name: "Wheat Flour (Maida)", needed: 35.0, available: 150.0, unit: "kg" },
      { material_id: 102, material_name: "Refined Sugar (Bulk)", needed: 4.0, available: 80.0, unit: "kg" },
      { material_id: 103, material_name: "Active Dry Yeast", needed: 1.0, available: 12.0, unit: "kg" },
    ],
  },
];

// Generate 40 stock movements across the last 14 days
function generateInitialTransactions() {
  const list = [];
  let id = 1;
  const now = new Date("2026-10-24T11:00:00Z");

  const templates = [
    { type: "STOCK_IN", sign: 1, qty: 150, product_id: 2, name: "Milk 1L", who: "Suresh (Store Staff)", ref: "PO-2026-001", daysAgo: 3 },
    { type: "PRODUCED", sign: 1, qty: 50, product_id: 1, name: "Bread", who: "Prakash (Production)", ref: "PRD-2026-001", daysAgo: 1 },
    { type: "USED_IN_PRODUCTION", sign: -1, qty: 17.5, product_id: 101, name: "Wheat Flour", who: "Prakash (Production)", ref: "PRD-2026-001", daysAgo: 1 },
    { type: "SOLD", sign: -1, qty: 15, product_id: 1, name: "Bread", who: "Varun (Counter)", ref: "POS-4401", daysAgo: 0 },
    { type: "SOLD", sign: -1, qty: 25, product_id: 2, name: "Milk 1L", who: "Varun (Counter)", ref: "POS-4402", daysAgo: 0 },
    { type: "DAMAGED", sign: -1, qty: 2, product_id: 4, name: "Eggs (tray)", who: "Suresh (Store Staff)", ref: "DMG-1024", daysAgo: 0 },
    { type: "STOCK_IN", sign: 1, qty: 30, product_id: 3, name: "Rice 5kg", who: "Ramesh (Manager)", ref: "PO-2026-002", daysAgo: 2 },
    { type: "CORRECTION", sign: 1, qty: 5, product_id: 9, name: "Sugar 1kg", who: "Ramesh (Manager)", ref: "AUDIT-OCT", daysAgo: 4 },
  ];

  // Fill up to 40 movements with realistic varied history
  for (let d = 13; d >= 0; d--) {
    const dDate = new Date(now.getTime() - d * 86400000);
    const dateStr = dDate.toISOString().slice(0, 10);
    // 2 to 4 transactions per day
    const dayCount = 2 + (d % 3);
    for (let c = 0; c < dayCount; c++) {
      const tmpl = templates[(id + c) % templates.length];
      const hours = 8 + ((id * 3) % 12);
      const minutes = (id * 17) % 60;
      const ts = `${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00Z`;
      list.unshift({
        id: id++,
        created_at: ts,
        product_id: tmpl.product_id,
        product_name: tmpl.name,
        type: tmpl.type,
        quantity: tmpl.sign * (tmpl.qty > 5 ? Math.round(tmpl.qty * (0.8 + 0.1 * (id % 5))) : tmpl.qty),
        who: tmpl.who,
        reference: `${tmpl.ref}-${id}`,
        note: tmpl.type === "DAMAGED" ? "Broken during handling" : "",
      });
    }
  }

  return list;
}

// Generate 60 sales for reports across varied days, time-slots, categories
function generateInitialSales() {
  const sales = [];
  let id = 1;
  const now = new Date("2026-10-24T11:00:00Z");
  const prods = [
    { id: 1, name: "Bread", cat: "Bakery", price: 40, cost: 26 },
    { id: 2, name: "Milk 1L", cat: "Dairy", price: 28, cost: 22 },
    { id: 3, name: "Rice 5kg", cat: "Grocery", price: 350, cost: 290 },
    { id: 4, name: "Eggs (tray)", cat: "Dairy", price: 180, cost: 145 },
    { id: 5, name: "Notebook", cat: "Stationery", price: 60, cost: 42 },
    { id: 6, name: "Cooking Oil 1L", cat: "Grocery", price: 160, cost: 135 },
    { id: 7, name: "Biscuits", cat: "Snacks", price: 20, cost: 13 },
    { id: 8, name: "Curd", cat: "Dairy", price: 35, cost: 24 },
    { id: 9, name: "Sugar 1kg", cat: "Grocery", price: 48, cost: 38 },
  ];

  // Distribute over 14 days
  for (let d = 13; d >= 0; d--) {
    const dDate = new Date(now.getTime() - d * 86400000);
    const dateStr = dDate.toISOString().slice(0, 10);
    const dailyTxCount = 4 + (d % 3);

    for (let t = 0; t < dailyTxCount; t++) {
      const p = prods[(id + t) % prods.length];
      const hour = 7 + Math.floor((t * 3.2) % 14); // 7 to 21
      let slot = "Morning (7 AM - 12 PM)";
      if (hour >= 12 && hour < 17) slot = "Afternoon (12 PM - 5 PM)";
      if (hour >= 17) slot = "Evening (5 PM - 10 PM)";

      const qty = 1 + ((id * 2) % 6);
      const total = qty * p.price;
      const ts = `${dateStr}T${String(hour).padStart(2, "0")}:${String((id * 13) % 60).padStart(2, "0")}:00Z`;

      sales.push({
        id: id++,
        date: dateStr,
        created_at: ts,
        time_slot: slot,
        product_id: p.id,
        product_name: p.name,
        category: p.cat,
        quantity: qty,
        unit_price: p.price,
        unit_cost: p.cost,
        total_revenue: total,
        gross_profit: total - qty * p.cost,
      });
      if (sales.length >= 65) break;
    }
    if (sales.length >= 65) break;
  }
  return sales;
}

// Load or initialize mock store
class MockStore {
  constructor() {
    this.load();
  }

  load() {
    try {
      const data = sessionStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.products = parsed.products;
        this.categories = parsed.categories;
        this.suppliers = parsed.suppliers;
        this.materials = parsed.materials;
        this.boms = parsed.boms;
        this.batches = parsed.batches;
        this.purchaseOrders = parsed.purchaseOrders;
        this.productionOrders = parsed.productionOrders;
        this.transactions = parsed.transactions;
        this.sales = parsed.sales;
        this.user = parsed.user || {
          name: "Ramesh Sharma",
          email: "admin@store.local",
          role: "admin",
        };
        return;
      }
    } catch {
      // Fallback to fresh seed
    }

    this.reset();
  }

  save() {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          products: this.products,
          categories: this.categories,
          suppliers: this.suppliers,
          materials: this.materials,
          boms: this.boms,
          batches: this.batches,
          purchaseOrders: this.purchaseOrders,
          productionOrders: this.productionOrders,
          transactions: this.transactions,
          sales: this.sales,
          user: this.user,
        })
      );
    } catch {
      // Ignore sessionStorage errors
    }
  }

  reset() {
    this.categories = [...initialCategories];
    this.suppliers = [...initialSuppliers];
    this.products = JSON.parse(JSON.stringify(initialProducts));
    this.materials = JSON.parse(JSON.stringify(initialMaterials));
    this.boms = JSON.parse(JSON.stringify(initialBoms));
    this.batches = JSON.parse(JSON.stringify(initialBatches));
    this.purchaseOrders = JSON.parse(JSON.stringify(initialPurchaseOrders));
    this.productionOrders = JSON.parse(JSON.stringify(initialProductionOrders));
    this.transactions = generateInitialTransactions();
    this.sales = generateInitialSales();
    this.user = {
      name: "Ramesh Sharma",
      email: "admin@store.local",
      role: "admin",
    };
    this.save();
  }

  // --- Products ---
  getProducts(filters = {}) {
    let list = this.products.filter((p) => p.active !== false);

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    if (filters.category) {
      list = list.filter((p) => p.category === filters.category);
    }
    if (filters.source_type) {
      list = list.filter((p) => p.source_type === filters.source_type);
    }
    if (filters.stock_status) {
      list = list.filter((p) => {
        const stock = p.current_stock;
        if (filters.stock_status === "OUT_OF_STOCK") return stock <= 0;
        if (filters.stock_status === "LOW_STOCK") return stock > 0 && stock <= p.reorder_level;
        if (filters.stock_status === "IN_STOCK") return stock > p.reorder_level;
        return true;
      });
    }

    return list;
  }

  getProductById(id) {
    const numId = Number(id);
    return this.products.find((p) => p.id === numId);
  }

  addProduct(data) {
    const nextId = Math.max(...this.products.map((p) => p.id), 0) + 1;
    // Check duplicate sku
    if (this.products.some((p) => p.sku.toLowerCase() === (data.sku || "").toLowerCase() && p.active !== false)) {
      const err = new Error("Item code already exists");
      err.code = "DUPLICATE_SKU";
      err.field = "sku";
      throw err;
    }

    const newProduct = {
      id: nextId,
      sku: data.sku || `ITEM-${String(nextId).padStart(3, "0")}`,
      name: data.name,
      category: data.category || "General",
      category_id: data.category_id || 1,
      source_type: data.source_type || "PURCHASED",
      unit: data.unit || "pcs",
      current_stock: Number(data.current_stock) || 0,
      reorder_level: Number(data.reorder_level) || 10,
      unit_price: Number(data.unit_price) || 0,
      purchase_cost: Number(data.purchase_cost) || 0,
      daily_demand: Number(data.daily_demand) || 0,
      expiry_date: data.has_expiry ? data.expiry_date : null,
      lead_time_days: Number(data.lead_time_days) || 2,
      min_order_qty: Number(data.min_order_qty) || 1,
      supplier_id: data.supplier_id ? Number(data.supplier_id) : null,
      active: true,
      has_expiry: Boolean(data.has_expiry),
      shelf_life_days: data.has_expiry ? Number(data.shelf_life_days) : null,
    };

    this.products.push(newProduct);

    if (newProduct.current_stock > 0) {
      this.transactions.unshift({
        id: this.transactions.length + 1,
        created_at: new Date().toISOString(),
        product_id: newProduct.id,
        product_name: newProduct.name,
        type: "STOCK_IN",
        quantity: newProduct.current_stock,
        who: this.user.name,
        reference: "INITIAL_STOCK",
        note: "Initial stock when product was added",
      });
    }

    this.save();
    return newProduct;
  }

  updateProduct(id, updates) {
    const numId = Number(id);
    const index = this.products.findIndex((p) => p.id === numId);
    if (index === -1) {
      const err = new Error("Product not found");
      err.status = 404;
      throw err;
    }

    if (updates.sku) {
      const exists = this.products.some(
        (p) => p.id !== numId && p.sku.toLowerCase() === updates.sku.toLowerCase() && p.active !== false
      );
      if (exists) {
        const err = new Error("Item code already exists");
        err.field = "sku";
        throw err;
      }
    }

    this.products[index] = { ...this.products[index], ...updates };
    this.save();
    return this.products[index];
  }

  removeProduct(id) {
    const numId = Number(id);
    const prod = this.getProductById(numId);
    if (!prod) {
      const err = new Error("Product not found");
      err.status = 404;
      throw err;
    }
    // Soft delete: active = false
    prod.active = false;
    this.save();
    return { success: true, message: `Product ${prod.name} removed. History is kept.` };
  }

  // --- Inventory Transactions & Issues ---
  recordIssue({ items, reason, note, idempotencyKey }) {
    // Validate all items have enough stock
    for (const item of items) {
      const p = this.getProductById(item.product_id);
      if (!p) {
        throw new Error(`Product ID ${item.product_id} not found`);
      }
      const qty = Number(item.quantity);
      if (qty <= 0) {
        throw new Error("Quantity must be greater than zero");
      }
      if (p.current_stock < qty) {
        const err = new Error(`Only ${p.current_stock} ${p.name} left. You can't sell ${qty}.`);
        err.status = 409;
        throw err;
      }
    }

    const recorded = [];
    const now = new Date();
    const type = reason === "SALE" ? "SOLD" : reason;

    for (const item of items) {
      const p = this.getProductById(item.product_id);
      const qty = Number(item.quantity);
      p.current_stock -= qty;

      const tx = {
        id: this.transactions.length + 1,
        created_at: now.toISOString(),
        product_id: p.id,
        product_name: p.name,
        type: type,
        quantity: -qty,
        who: this.user.name,
        reference: `ISS-${Date.now().toString().slice(-4)}`,
        note: note || "",
        idempotency_key: idempotencyKey,
      };
      this.transactions.unshift(tx);

      // Record in sales if it was a sale
      if (reason === "SALE") {
        const hour = now.getHours();
        let slot = "Morning (7 AM - 12 PM)";
        if (hour >= 12 && hour < 17) slot = "Afternoon (12 PM - 5 PM)";
        if (hour >= 17) slot = "Evening (5 PM - 10 PM)";

        this.sales.unshift({
          id: this.sales.length + 1,
          date: now.toISOString().slice(0, 10),
          created_at: now.toISOString(),
          time_slot: slot,
          product_id: p.id,
          product_name: p.name,
          category: p.category,
          quantity: qty,
          unit_price: p.unit_price,
          unit_cost: p.purchase_cost,
          total_revenue: qty * p.unit_price,
          gross_profit: qty * (p.unit_price - p.purchase_cost),
        });
      }

      recorded.push({
        product_id: p.id,
        name: p.name,
        quantity: qty,
        remaining_stock: p.current_stock,
      });
    }

    this.save();
    return {
      success: true,
      items: recorded,
      message: `Sale recorded. ${recorded.map((r) => `${r.name} now has ${r.remaining_stock} left`).join(", ")}.`,
    };
  }

  // --- Receive stock ---
  receiveStock({ purchase_order_id, lines }) {
    let po = null;
    if (purchase_order_id) {
      po = this.purchaseOrders.find((o) => o.id === Number(purchase_order_id));
    }

    const now = new Date();
    const updatedProducts = [];

    for (const line of lines) {
      const qty = Number(line.quantity_received || line.quantity);
      if (qty <= 0) continue;

      const p = this.getProductById(line.product_id);
      if (!p) continue;

      p.current_stock += qty;
      if (line.unit_cost) {
        p.purchase_cost = Number(line.unit_cost);
      }
      if (line.expiry_date) {
        p.expiry_date = line.expiry_date;
      }

      // Add batch
      const batchCode = line.batch_code || `BCH-${p.sku}-${now.toISOString().slice(5, 10).replace("-", "")}`;
      this.batches.unshift({
        id: this.batches.length + 1,
        product_id: p.id,
        batch_code: batchCode,
        received_date: now.toISOString().slice(0, 10),
        expiry_date: line.expiry_date || null,
        initial_qty: qty,
        remaining_qty: qty,
      });

      // Record transaction
      this.transactions.unshift({
        id: this.transactions.length + 1,
        created_at: now.toISOString(),
        product_id: p.id,
        product_name: p.name,
        type: "STOCK_IN",
        quantity: qty,
        who: this.user.name,
        reference: po ? po.po_number : "DIRECT_RECEIVE",
        note: `Received into batch ${batchCode}`,
      });

      // Update PO line received_qty if PO exists
      if (po && po.items) {
        const poItem = po.items.find((i) => i.product_id === p.id);
        if (poItem) {
          poItem.received_qty = (poItem.received_qty || 0) + qty;
        }
      }

      updatedProducts.push({ name: p.name, current_stock: p.current_stock });
    }

    if (po) {
      const allReceived = po.items.every((i) => (i.received_qty || 0) >= i.quantity);
      const someReceived = po.items.some((i) => (i.received_qty || 0) > 0);
      po.status = allReceived ? "RECEIVED" : someReceived ? "PARTIALLY_RECEIVED" : po.status;
      if (allReceived) {
        po.received_at = now.toISOString();
      }
    }

    this.save();
    return {
      success: true,
      message: `Stock received successfully.`,
      updatedProducts,
    };
  }

  // --- Purchase Orders ---
  createPurchaseOrder(data) {
    const nextId = Math.max(...this.purchaseOrders.map((p) => p.id), 0) + 1;
    const supplier = this.suppliers.find((s) => s.id === Number(data.supplier_id));
    const items = (data.items || []).map((it) => {
      const p = this.getProductById(it.product_id);
      return {
        product_id: Number(it.product_id),
        product_name: p ? p.name : "Item",
        quantity: Number(it.quantity),
        unit_cost: Number(it.unit_cost),
        received_qty: 0,
      };
    });

    const total = items.reduce((sum, it) => sum + it.quantity * it.unit_cost, 0);

    const po = {
      id: nextId,
      po_number: `PO-2026-${String(nextId).padStart(3, "0")}`,
      supplier_id: Number(data.supplier_id),
      supplier_name: supplier ? supplier.name : "Supplier",
      status: "CONFIRMED",
      created_at: new Date().toISOString(),
      expected_delivery_date: data.expected_delivery_date,
      total_amount: total,
      items,
    };

    this.purchaseOrders.unshift(po);
    this.save();
    return po;
  }

  cancelPurchaseOrder(id) {
    const po = this.purchaseOrders.find((p) => p.id === Number(id));
    if (!po) throw new Error("Purchase order not found");
    if (po.status === "RECEIVED") {
      throw new Error("Cannot cancel an already received purchase order");
    }
    po.status = "CANCELLED";
    this.save();
    return po;
  }

  // --- Production Orders ---
  createProductionOrder(data) {
    const nextId = Math.max(...this.productionOrders.map((p) => p.id), 0) + 1;
    const p = this.getProductById(data.product_id);
    const bom = this.boms.find((b) => b.product_id === Number(data.product_id));
    const qty = Number(data.planned_quantity);

    const materialsUsed = (bom ? bom.items : []).map((item) => {
      const mat = this.materials.find((m) => m.id === item.material_id);
      return {
        material_id: item.material_id,
        material_name: item.material_name,
        needed: item.quantity * qty,
        available: mat ? mat.current_stock : 0,
        unit: item.unit,
      };
    });

    const order = {
      id: nextId,
      order_number: `PRD-2026-${String(nextId).padStart(3, "0")}`,
      product_id: Number(data.product_id),
      product_name: p ? p.name : "Manufactured Product",
      planned_quantity: qty,
      actual_quantity: null,
      status: "PLANNED",
      planned_date: data.planned_date || new Date().toISOString().slice(0, 10),
      materials_used: materialsUsed,
    };

    this.productionOrders.unshift(order);
    this.save();
    return order;
  }

  completeProductionOrder(id, actualQuantity) {
    const order = this.productionOrders.find((o) => o.id === Number(id));
    if (!order) throw new Error("Production order not found");
    if (order.status === "COMPLETED") throw new Error("Order already completed");

    const qty = Number(actualQuantity || order.planned_quantity);
    const p = this.getProductById(order.product_id);
    if (!p) throw new Error("Target product not found");

    // Check material shortages
    for (const matItem of order.materials_used) {
      const mat = this.materials.find((m) => m.id === matItem.material_id);
      const needed = matItem.needed;
      if (!mat || mat.current_stock < needed) {
        throw new Error(`Cannot complete: Short of ${matItem.material_name}`);
      }
    }

    // Deduct materials
    for (const matItem of order.materials_used) {
      const mat = this.materials.find((m) => m.id === matItem.material_id);
      mat.current_stock -= matItem.needed;
      this.transactions.unshift({
        id: this.transactions.length + 1,
        created_at: new Date().toISOString(),
        product_id: mat.id,
        product_name: mat.name,
        type: "USED_IN_PRODUCTION",
        quantity: -matItem.needed,
        who: this.user.name,
        reference: order.order_number,
        note: `Used to produce ${qty} ${p.name}`,
      });
    }

    // Add finished product stock
    p.current_stock += qty;
    order.actual_quantity = qty;
    order.status = "COMPLETED";
    order.completed_at = new Date().toISOString();

    this.transactions.unshift({
      id: this.transactions.length + 1,
      created_at: new Date().toISOString(),
      product_id: p.id,
      product_name: p.name,
      type: "PRODUCED",
      quantity: qty,
      who: this.user.name,
      reference: order.order_number,
      note: `Completed production run`,
    });

    this.save();
    return order;
  }

  // --- Summary endpoint: GET /api/inventory/summary ---
  getSummary() {
    const activeProducts = this.products.filter((p) => p.active !== false);
    const stockValue = activeProducts.reduce(
      (sum, p) => sum + p.current_stock * (p.purchase_cost || p.unit_price * 0.7),
      0
    );
    const outOfStock = activeProducts.filter((p) => p.current_stock <= 0).length;
    const lowStock = activeProducts.filter(
      (p) => p.current_stock > 0 && p.current_stock <= p.reorder_level
    ).length;

    // Expiring soon: within 7 days
    const now = new Date();
    const todayMidnight = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const expiringSoon = activeProducts.filter((p) => {
      if (!p.expiry_date || p.current_stock <= 0) return false;
      const [y, m, d] = p.expiry_date.slice(0, 10).split("-").map(Number);
      const diff = Math.round((Date.UTC(y, m - 1, d) - todayMidnight) / 86400000);
      return diff > 0 && diff <= 7;
    }).length;

    // Deliveries pending: POs in CONFIRMED, PARTIALLY_RECEIVED, or DRAFT
    const pendingDeliveries = this.purchaseOrders.filter((po) =>
      ["CONFIRMED", "PARTIALLY_RECEIVED", "DRAFT"].includes(po.status)
    ).length;

    // Stock by category for chart
    const catMap = {};
    activeProducts.forEach((p) => {
      catMap[p.category] = (catMap[p.category] || 0) + p.current_stock;
    });
    const stockByCategory = Object.entries(catMap).map(([category, count]) => ({
      category,
      count,
    }));

    return {
      active_products: activeProducts.length,
      stock_value: Math.round(stockValue),
      low_stock: lowStock,
      out_of_stock: outOfStock,
      expiring_soon: expiringSoon,
      pending_deliveries: pendingDeliveries,
      recent_movements: this.transactions.slice(0, 8),
      stock_by_category: stockByCategory,
    };
  }
}

export const mockStore = new MockStore();
