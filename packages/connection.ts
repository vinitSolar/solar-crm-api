import { Pool } from "pg";

const isSsl = process.env.DB_SSL === "true" 
    || (Boolean(process.env.DB_HOST) && process.env.DB_HOST !== "localhost" && process.env.DB_HOST !== "127.0.0.1")
    || Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost"));

const pool = new Pool(
    process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: isSsl ? { rejectUnauthorized: false } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        }
        : {
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT) || 5432,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: isSsl ? { rejectUnauthorized: false } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        }
);

export default pool;