import { pool } from '@packages/database/index.js';
import fs from 'fs';
import path from 'path';

async function run() {
    try {
        console.log('Dropping existing locations tables...');
        await pool.query('DROP TABLE IF EXISTS cities CASCADE;');
        await pool.query('DROP TABLE IF EXISTS villages CASCADE;');
        await pool.query('DROP TABLE IF EXISTS subdistricts CASCADE;');
        await pool.query('DROP TABLE IF EXISTS districts CASCADE;');
        await pool.query('DROP TABLE IF EXISTS states CASCADE;');
        console.log('Tables dropped.');

        const sqlPath = path.join(process.cwd(), 'packages', 'database', 'migrations', '20260715105946_create_locations_tables.sql');
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
