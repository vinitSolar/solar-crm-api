import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from "../packages/connection.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    try {
        console.log("Applying migration 013_remove_tenant_uid_from_franchise_document_types.sql...");
        const sqlPath = path.join(__dirname, '../packages/database/migrations/013_remove_tenant_uid_from_franchise_document_types.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        await pool.query(sql);
        console.log("Success! Migration applied.");
    } catch (e) {
        console.error("Error applying migration:", e);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

run();
