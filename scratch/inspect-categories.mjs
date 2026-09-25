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
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_categories'
    `);
    console.log('CATEGORY COLUMNS:', cols.rows);

    const cats = await pool.query('SELECT * FROM product_categories');
    console.log('CATEGORIES DATA:', JSON.stringify(cats.rows, null, 2));

    const pCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name IN ('image', 'images', 'image_url', 'icon')
    `);
    console.log('PRODUCT IMAGE COLS:', pCols.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
main();
