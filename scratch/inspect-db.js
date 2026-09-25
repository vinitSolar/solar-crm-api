const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log('--- PACKAGES ---');
    const pkgs = await pool.query('SELECT uid, name, capacity_kw, is_deleted FROM packages LIMIT 10');
    console.log(JSON.stringify(pkgs.rows, null, 2));

    console.log('\n--- PACKAGE PRODUCTS ---');
    const pkgProducts = await pool.query(`
      SELECT pp.package_uid, pp.quantity, p.name as product_name, p.capacity, p.capacity_unit, p.warranty, b.name as brand_name, c.name as category_name
      FROM package_products pp
      JOIN products p ON p.uid::text = pp.product_uid::text
      LEFT JOIN product_categories c ON c.uid::text = p.category_uid::text
      LEFT JOIN product_brands b ON b.uid::text = p.brand_uid::text
      LIMIT 30
    `);
    console.log(JSON.stringify(pkgProducts.rows, null, 2));

    console.log('\n--- ALL PRODUCT CATEGORIES ---');
    const cats = await pool.query('SELECT uid, name FROM product_categories LIMIT 20');
    console.log(JSON.stringify(cats.rows, null, 2));

    console.log('\n--- RECENT QUOTATIONS WITH ITEMS ---');
    const quotes = await pool.query(`
      SELECT q.uid, q.quotation_number, q.package_uid, q.system_size_kw, pkg.name as package_name
      FROM quotations q
      LEFT JOIN packages pkg ON pkg.uid::text = q.package_uid::text
      ORDER BY q.created_at DESC
      LIMIT 5
    `);
    console.log(JSON.stringify(quotes.rows, null, 2));

    if (quotes.rows.length > 0) {
      const qUid = quotes.rows[0].uid;
      console.log(`\n--- ITEMS FOR QUOTATION ${quotes.rows[0].quotation_number} (${qUid}) ---`);
      const items = await pool.query(`
        SELECT qi.*, p.name as product_name, p.capacity, p.capacity_unit, p.warranty, b.name as brand_name, c.name as category_name
        FROM quotation_items qi
        LEFT JOIN products p ON p.uid::text = qi.product_uid::text
        LEFT JOIN product_categories c ON c.uid::text = p.category_uid::text
        LEFT JOIN product_brands b ON b.uid::text = p.brand_uid::text
        WHERE qi.quotation_uid = $1
      `, [qUid]);
      console.log(JSON.stringify(items.rows, null, 2));
    }

    console.log('\n--- ALL PRODUCTS SAMPLE ---');
    const allProds = await pool.query(`
      SELECT p.uid, p.name, p.capacity, p.capacity_unit, p.warranty, b.name as brand_name, c.name as category_name
      FROM products p
      LEFT JOIN product_categories c ON c.uid::text = p.category_uid::text
      LEFT JOIN product_brands b ON b.uid::text = p.brand_uid::text
      LIMIT 25
    `);
    console.log(JSON.stringify(allProds.rows, null, 2));

  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await pool.end();
  }
}

main();
