// Seeds an empty products table from the shared sample data (Member 1).
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pool from "../src/db.js";

const samplePath = new URL("../data/sample_products.json", import.meta.url);
const products = JSON.parse(await readFile(fileURLToPath(samplePath), "utf8"));

try {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM products");
  if (rows[0].count === 0) {
    for (const product of products) {
      await pool.query(
        `INSERT INTO products
          (id, name, category, source_type, current_stock, reorder_level, unit_price,
           daily_demand, expiry_date, lead_time_days)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          product.id, product.name, product.category, product.source_type,
          product.current_stock, product.reorder_level, product.unit_price,
          product.daily_demand, product.expiry_date, product.lead_time_days,
        ],
      );
    }
    console.log(`Seeded ${products.length} products.`);
  } else {
    console.log("Products table is not empty; skipping seed.");
  }
} finally {
  await pool.end();
}
