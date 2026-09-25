import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';

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
    const qRes = await pool.query(`
      SELECT q.*, 
             l.first_name, l.last_name, l.address, l.city, l.state, l.pin_code,
             l.mobile_number, l.email
      FROM quotations q
      LEFT JOIN leads l ON l.uid::text = q.lead_uid::text
      WHERE q.quotation_number = 'QT-202609100001'
    `);
    const quote = qRes.rows[0];
    console.log('Quotation:', quote.quotation_number);

    const itemsRes = await pool.query(`
      SELECT qi.*, 
             p.capacity, p.capacity_unit, p.warranty, p.model_number,
             c.name as category_name, c.uid as category_uid
      FROM quotation_items qi
      LEFT JOIN products p ON p.uid::text = qi.product_uid::text
      LEFT JOIN product_categories c ON c.uid::text = p.category_uid::text
      WHERE qi.quotation_uid = $1
    `, [quote.uid]);
    console.log('Items:', itemsRes.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
main();
