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
    const cols = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('products', 'packages', 'package_products', 'quotations', 'quotation_items', 'product_categories', 'product_brands')
      ORDER BY table_name, ordinal_position
    `);
    console.log('--- COLUMNS ---');
    cols.rows.forEach(r => console.log(`${r.table_name}.${r.column_name} (${r.data_type})`));

    console.log('\n--- ALL PRODUCTS (SELECT *) ---');
    const prods = await pool.query('SELECT * FROM products LIMIT 50');
    console.log('Count:', prods.rows.length);
    console.log(JSON.stringify(prods.rows, null, 2));

    console.log('\n--- ALL PACKAGES (SELECT *) ---');
    const pkgs = await pool.query('SELECT * FROM packages LIMIT 10');
    console.log('Count:', pkgs.rows.length);
    console.log(JSON.stringify(pkgs.rows, null, 2));

    console.log('\n--- ALL QUOTATIONS (SELECT *) ---');
    const quotes = await pool.query('SELECT * FROM quotations ORDER BY id DESC LIMIT 5');
    console.log('Count:', quotes.rows.length);
    console.log(JSON.stringify(quotes.rows, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
