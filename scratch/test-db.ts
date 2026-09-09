import dotenv from "dotenv";
dotenv.config({ override: true });

import { Pool } from "pg";

async function testConnection() {
    const dbUrl = process.env.DATABASE_URL;
    const host = process.env.DB_HOST;
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD || "";
    const database = process.env.DB_NAME;
    const isSsl = process.env.DB_SSL === "true" 
        || (Boolean(host) && host !== "localhost" && host !== "127.0.0.1")
        || Boolean(dbUrl && !dbUrl.includes("localhost"));

    console.log("=== DB Connection Diagnostics ===");
    console.log("DATABASE_URL set :", Boolean(dbUrl));
    if (dbUrl) {
        // Redact password in URL for display
        const redactedUrl = dbUrl.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:*****@");
        console.log("DATABASE_URL     :", redactedUrl);
    }
    console.log("DB_HOST          :", host);
    console.log("DB_USER          :", user);
    console.log("DB_NAME          :", database);
    console.log("DB_PASSWORD len  :", password.length, `(starts with '${password.slice(0, 4)}...', ends with '...${password.slice(-3)}')`);
    console.log("DB_SSL           :", isSsl);
    console.log("=================================");

    const pool = new Pool(
        dbUrl
            ? {
                connectionString: dbUrl,
                ssl: isSsl ? { rejectUnauthorized: false } : false,
            }
            : {
                host,
                port: Number(process.env.DB_PORT) || 5432,
                user,
                password,
                database,
                ssl: isSsl ? { rejectUnauthorized: false } : false,
            }
    );

    try {
        console.log("Connecting to PostgreSQL...");
        const client = await pool.connect();
        const res = await client.query("SELECT current_database(), current_user, version();");
        console.log("✅ SUCCESS! Connected to database successfully!");
        console.log("Database Details :", res.rows[0]);
        client.release();
    } catch (err: any) {
        console.error("❌ Connection failed!");
        console.error("Error code    :", err.code);
        console.error("Error message :", err.message);
    } finally {
        await pool.end();
    }
}

testConnection();
