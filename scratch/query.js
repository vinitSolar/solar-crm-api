import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Client } = pg;

async function run() {
  const client = new Client({ 
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
  });
  await client.connect();
  try {
    const res = await client.query("SELECT * FROM roles LIMIT 1");
    console.log("Role keys:");
    console.log(Object.keys(res.rows[0] || {}));
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
