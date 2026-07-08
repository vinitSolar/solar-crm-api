import "@packages/config/index.js";
import pool from "../packages/connection.js";

async function run() {
    try {
        const result = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'leads'");
        console.log(result.rows.map(x=>x.column_name));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
