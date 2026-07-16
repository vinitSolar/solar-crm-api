import 'dotenv/config';
import { pool } from '../index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    try {
        console.log('Dropping existing locations tables...');
        await pool.query('DROP TABLE IF EXISTS cities CASCADE;');
        await pool.query('DROP TABLE IF EXISTS villages CASCADE;');
        await pool.query('DROP TABLE IF EXISTS subdistricts CASCADE;');
        await pool.query('DROP TABLE IF EXISTS districts CASCADE;');
        await pool.query('DROP TABLE IF EXISTS states CASCADE;');
        await pool.query("DELETE FROM _migrations WHERE name = '20260715105946_create_locations_tables.sql'");
        console.log('Tables and migration entry dropped.');

        const sqlPath = path.join(__dirname, 'migrations', '20260715105946_create_locations_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('Running migration...');
        await pool.query(sql);
        console.log('Migration completed.');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

run();
