import { Pool, types } from "pg";

// Parse TIMESTAMP (OID 1114) without timezone directly as UTC Date
types.setTypeParser(1114, (stringValue) => {
    return stringValue ? new Date(`${stringValue.replace(" ", "T")}Z`) : null;
});

// Parse DATE (OID 1082) as a raw string to avoid timezone shifts
types.setTypeParser(1082, (stringValue) => {
    return stringValue || null;
});

const isSsl = process.env.DB_SSL !== undefined
    ? process.env.DB_SSL === "true"
    : (
        (Boolean(process.env.DB_HOST) && process.env.DB_HOST !== "localhost" && process.env.DB_HOST !== "127.0.0.1" && process.env.DB_HOST !== "host.docker.internal")
        || Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost") && !process.env.DATABASE_URL.includes("host.docker.internal"))
    );

const pool = new Pool(
    process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            password: process.env.DB_PASSWORD,
            ssl: isSsl ? { rejectUnauthorized: false } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
            keepAlive: true,
            keepAliveInitialDelayMillis: 10000,
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
            keepAlive: true,
            keepAliveInitialDelayMillis: 10000,
        }
);

// Ensure every PostgreSQL connection in the pool uses UTC timezone
pool.on("connect", (client) => {
    client.query("SET timezone = 'UTC'").catch(() => {});
});

export default pool;