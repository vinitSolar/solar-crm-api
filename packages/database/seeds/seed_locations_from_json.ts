import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function seedLocationsFromJson() {
    const locationsPath = path.resolve(process.cwd(), 'locations.json');
    if (!fs.existsSync(locationsPath)) {
        console.error(`Locations file not found at ${locationsPath}`);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));

    const client = new pg.Client({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        await client.connect();
        await client.query('BEGIN');

        console.log(`Seeding ${data.states?.length || 0} states...`);
        for (const state of (data.states || [])) {
            await client.query(
                `INSERT INTO states (id, name, created_at, updated_at, deleted_at) 
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
                [state.id, state.name, state.created_at, state.updated_at, state.deleted_at]
            );
        }

        console.log(`Seeding ${data.districts?.length || 0} districts...`);
        for (const district of (data.districts || [])) {
            await client.query(
                `INSERT INTO districts (id, state_id, name, created_at, updated_at, deleted_at) 
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, state_id = EXCLUDED.state_id`,
                [district.id, district.state_id, district.name, district.created_at, district.updated_at, district.deleted_at]
            );
        }

        console.log(`Seeding ${data.cities?.length || 0} cities...`);
        const cities = data.cities || [];
        const batchSize = 1000;
        for (let i = 0; i < cities.length; i += batchSize) {
            const batch = cities.slice(i, i + batchSize);
            console.log(`Processing city batch ${i} to ${i + batch.length}...`);
            for (const city of batch) {
                await client.query(
                    `INSERT INTO cities (id, state_id, district_id, name, pincode, created_at, updated_at, deleted_at) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                     ON CONFLICT (id) DO UPDATE SET 
                     name = EXCLUDED.name, state_id = EXCLUDED.state_id, 
                     district_id = EXCLUDED.district_id, pincode = EXCLUDED.pincode`,
                    [city.id, city.state_id, city.district_id, city.name, city.pincode, city.created_at, city.updated_at, city.deleted_at]
                );
            }
        }

        await client.query('COMMIT');
        console.log('Successfully seeded locations from json.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error seeding locations:', err);
    } finally {
        await client.end();
        process.exit(0);
    }
}

seedLocationsFromJson();
