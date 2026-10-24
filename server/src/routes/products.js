// Product list, creation, and stock update endpoints (Member 1).
import { Router } from "express";
import pool from "../db.js";

const router = Router();
const fields = [
  "name", "category", "source_type", "current_stock", "reorder_level",
  "unit_price", "daily_demand", "expiry_date", "lead_time_days",
];

router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, name, category, source_type, current_stock, reorder_level,
             unit_price, daily_demand, to_char(expiry_date, 'YYYY-MM-DD') AS expiry_date,
             lead_time_days
      FROM products ORDER BY id
    `);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const values = fields.map((field) => req.body[field] ?? null);
    const { rows } = await pool.query(
      `INSERT INTO products (${fields.join(", ")}) VALUES (${fields.map((_, i) => `$${i + 1}`).join(", ")})
       RETURNING id, name, category, source_type, current_stock, reorder_level, unit_price,
                 daily_demand, to_char(expiry_date, 'YYYY-MM-DD') AS expiry_date, lead_time_days`,
      values,
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/stock", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE products SET current_stock = $1 WHERE id = $2
       RETURNING id, name, category, source_type, current_stock, reorder_level, unit_price,
                 daily_demand, to_char(expiry_date, 'YYYY-MM-DD') AS expiry_date, lead_time_days`,
      [req.body.current_stock, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "Product not found" });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
