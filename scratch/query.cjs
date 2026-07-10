const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query("SELECT email, is_deleted, is_active FROM users WHERE email ILIKE '%shahvinit315%'");
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
