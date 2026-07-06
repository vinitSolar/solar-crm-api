import bcrypt from "bcrypt";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const SALT_ROUNDS = 10;

async function seed() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    const client = await pool.connect();

    try {
        const password = "Admin@123";
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const tenantUid = uuidv4();
        const roleUid = uuidv4();
        const userUid = uuidv4();

        console.info("🌱 Starting database seed...");

        await client.query("BEGIN");

        // 1. Tenant: Head Office
        await client.query(
            `INSERT INTO tenants (uid, code, name, type, email, timezone, is_active, is_deleted, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (code) DO NOTHING`,
            [
                tenantUid,
                "HO",
                "SunSelect Solar India",
                0,
                "admin@sunselect.com",
                "Asia/Kolkata",
                1,
                0,
                "SYSTEM",
            ]
        );
        console.info(`✅ Tenant: SunSelect Solar India (Head Office) — ${tenantUid}`);

        // 2. Role: Master
        await client.query(
            `INSERT INTO roles (uid, tenant_uid, name, description, is_system, is_active, is_deleted, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (uid) DO NOTHING`,
            [
                roleUid,
                tenantUid,
                "Master",
                "Super administrator role with full system access. This is a system-defined role and cannot be modified or deleted.",
                1,
                1,
                0,
                "SYSTEM",
            ]
        );
        console.info(`✅ Role: Master (System Role) — ${roleUid}`);

        // 3. User: Admin
        await client.query(
            `INSERT INTO users (uid, tenant_uid, role_uid, first_name, last_name, email, password, is_active, is_deleted, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (email) DO NOTHING`,
            [
                userUid,
                tenantUid,
                roleUid,
                "Admin",
                "User",
                "admin@sunselect.com",
                hashedPassword,
                1,
                0,
                "SYSTEM",
            ]
        );
        console.info(`✅ User: admin@sunselect.com (Admin@123) — ${userUid}`);

        await client.query("COMMIT");

        console.info("🎉 Database seed completed successfully!");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("❌ Seed failed:", error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
