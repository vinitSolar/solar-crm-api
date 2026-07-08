import 'dotenv/config';
import pool from '../packages/connection.js';

async function check() {
  const tenants = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'tenants'");
  console.log('tenants:', tenants.rows.map(r=>r.column_name).join(', '));

  const owner = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'franchise_owner_details'");
  console.log('owner:', owner.rows.map(r=>r.column_name).join(', '));

  const business = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'franchise_business_details'");
  console.log('business:', business.rows.map(r=>r.column_name).join(', '));

  process.exit(0);
}
check();
