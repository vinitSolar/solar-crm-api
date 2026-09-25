import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const pCols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'products'`);
    console.log('PRODUCTS COLUMNS:', pCols.rows.map(r => r.column_name).join(', '));

    const res = await pool.query(`
      SELECT p.*, b.name as brand_name, c.name as category_name, u.name as unit_name
      FROM products p
      LEFT JOIN product_categories c ON c.uid::text = p.category_uid::text
      LEFT JOIN product_brands b ON b.uid::text = p.brand_uid::text
      LEFT JOIN product_units u ON u.uid::text = p.unit_uid::text
      ORDER BY c.name, p.name
    `);
    console.log(`TOTAL PRODUCTS: ${res.rows.length}`);
    res.rows.forEach(r => {
      console.log(`- [${r.category_name || 'NO CAT'}] ${r.name} | Brand: ${r.brand_name} | Cap: ${r.capacity} ${r.capacity_unit} | Warr: ${r.warranty} | Price: ${r.price_per_unit || r.price}`);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
