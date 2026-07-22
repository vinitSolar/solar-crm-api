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
                `INSERT INTO states (id, uid, code, name, created_at, updated_at, deleted_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (id) DO UPDATE SET 
                    uid = EXCLUDED.uid, 
                    code = EXCLUDED.code, 
                    name = EXCLUDED.name, 
                    updated_at = EXCLUDED.updated_at`,
                [
                    state.id,
                    state.uid || null,
                    state.code || null,
                    state.name,
                    state.created_at || new Date(),
                    state.updated_at || new Date(),
                    state.deleted_at || null
                ]
            );
        }

        console.log(`Seeding ${data.districts?.length || 0} districts...`);
        for (const district of (data.districts || [])) {
            await client.query(
                `INSERT INTO districts (id, uid, code, state_uid, name, created_at, updated_at, deleted_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (id) DO UPDATE SET 
                    uid = EXCLUDED.uid, 
                    code = EXCLUDED.code, 
                    state_uid = EXCLUDED.state_uid, 
                    name = EXCLUDED.name, 
                    updated_at = EXCLUDED.updated_at`,
                [
                    district.id,
                    district.uid || null,
                    district.code || null,
                    district.state_uid || district.state_id || null,
                    district.name,
                    district.created_at || new Date(),
                    district.updated_at || new Date(),
                    district.deleted_at || null
                ]
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
                    `INSERT INTO cities (id, uid, code, state_uid, district_uid, name, local_body_type, pincode, block, branch_type, region, created_at, updated_at, deleted_at) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                     ON CONFLICT (id) DO UPDATE SET 
                        uid = EXCLUDED.uid, 
                        code = EXCLUDED.code, 
                        state_uid = EXCLUDED.state_uid, 
                        district_uid = EXCLUDED.district_uid, 
                        name = EXCLUDED.name, 
                        local_body_type = EXCLUDED.local_body_type, 
                        pincode = EXCLUDED.pincode, 
                        block = EXCLUDED.block, 
                        branch_type = EXCLUDED.branch_type, 
                        region = EXCLUDED.region, 
                        updated_at = EXCLUDED.updated_at`,
                    [
                        city.id,
                        city.uid || null,
                        city.code || null,
                        city.state_uid || city.state_id || null,
                        city.district_uid || city.district_id || null,
                        city.name,
                        city.local_body_type || null,
                        city.pincode || null,
                        city.block || null,
                        city.branch_type || null,
                        city.region || null,
                        city.created_at || new Date(),
                        city.updated_at || new Date(),
                        city.deleted_at || null
                    ]
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
