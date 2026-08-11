import 'dotenv/config';
import pool from "../packages/connection.js";

async function run() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'franchise_document_types';
        `);
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
        process.exit(0);
    }
}
run();
