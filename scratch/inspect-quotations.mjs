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
    const quotes = await pool.query(`
      SELECT q.id, q.uid, q.quotation_number, q.system_size, q.subtotal, q.gst_amount, q.grand_total,
             l.first_name, l.last_name, l.address, l.city, l.state
      FROM quotations q
      LEFT JOIN leads l ON l.uid::text = q.lead_uid::text
    `);
    for (const q of quotes.rows) {
      console.log(`=== QUOTATION: ${q.quotation_number}, System size: ${q.system_size} kW, Customer: ${q.first_name} ${q.last_name}`);
      const items = await pool.query(`
        SELECT qi.id, qi.product_name, qi.brand_name, qi.quantity, qi.unit_name, qi.price_per_unit, qi.line_total, qi.description,
               p.capacity, p.capacity_unit, p.warranty, p.model_number,
               c.name as category_name
        FROM quotation_items qi
        LEFT JOIN products p ON p.uid::text = qi.product_uid::text
        LEFT JOIN product_categories c ON c.uid::text = p.category_uid::text
        WHERE qi.quotation_uid = $1
      `, [q.uid]);
      console.log('ITEMS:', JSON.stringify(items.rows, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
