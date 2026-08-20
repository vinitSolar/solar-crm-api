import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Client } = pkg;

async function runMigration() {
    const client = new Client({
        user: 'postgres',
        password: 'vinit',
        host: 'localhost',
        port: 5432,
        database: 'solar_crm_india'
    });

    try {
        await client.connect();
        console.log("Connected to database");

        const sqlPath = path.join(process.cwd(), 'scripts', 'bank_details_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("Executing SQL...");
        await client.query(sql);
        console.log("Migration executed successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

runMigration();
