// Quick connectivity test — run from server/ directory
import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const { rows } = await pool.query("SELECT NOW() AS connected_at");
  console.log("CONNECTED:", rows[0].connected_at);

  const tableCheck = await pool.query(
    `SELECT EXISTS (
       SELECT FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'products'
     ) AS exists`
  );
  console.log("products table exists:", tableCheck.rows[0].exists);

  if (tableCheck.rows[0].exists) {
    const count = await pool.query("SELECT COUNT(*)::int AS count FROM products");
    console.log("products row count:", count.rows[0].count);
    const cols = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_name = 'products' ORDER BY ordinal_position`
    );
    console.log("columns:", cols.rows.map(c => c.column_name).join(", "));
  }
} catch (err) {
  console.error("ERROR:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
