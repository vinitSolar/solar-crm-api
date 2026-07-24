import 'dotenv/config';
import pool from '../connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    try {
        const migrations = [
            '20260722120000_create_installation_milestones.sql',
            '20260722120100_create_project_installation_milestones.sql',
            '20260722120200_create_project_installation_milestone_documents.sql',
            '20260722120300_seed_milestone_menus.sql'
        ];
        
        for (const file of migrations) {
            const sqlPath = path.join(__dirname, 'migrations', file);
            const sql = fs.readFileSync(sqlPath, 'utf8');
            console.log(`Running migration ${file}...`);
            await pool.query(sql);
            console.log(`Migration ${file} completed.`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

run();
