import { z } from "zod";

const booleanEnv = z.preprocess((val) => {
    if (typeof val === "string") {
        return val.toLowerCase() === "true" || val === "1";
    }
    return Boolean(val);
}, z.boolean());

export const envSchema = z.object({
    // Application
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(5000),
    APP_NAME: z.string().min(1, "APP_NAME is required"),
    APP_URL: z.string().url("APP_URL must be a valid URL"),

    // PostgreSQL
    DB_HOST: z.string().min(1, "DB_HOST is required"),
    DB_PORT: z.coerce.number().int().positive().default(5432),
    DB_USER: z.string().min(1, "DB_USER is required"),
    DB_PASSWORD: z.string().min(1, "DB_PASSWORD is required"),
    DB_NAME: z.string().min(1, "DB_NAME is required"),
    DB_SSL: booleanEnv.default(false),

    // JWT
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    JWT_EXPIRES_IN: z.string().min(1, "JWT_EXPIRES_IN is required"),
    JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
    JWT_REFRESH_EXPIRES_IN: z.string().min(1, "JWT_REFRESH_EXPIRES_IN is required"),

    // Redis
    REDIS_HOST: z.string().min(1, "REDIS_HOST is required"),
    REDIS_PORT: z.coerce.number().int().positive().default(6379),
    REDIS_PASSWORD: z.string().optional(),

    // BullMQ
    QUEUE_PREFIX: z.string().min(1, "QUEUE_PREFIX is required").default("sunselect"),

    // Logger
    LOG_LEVEL: z.enum(["error", "warn", "info", "http", "verbose", "debug", "silly"]).default("info"),

    // Mail
    MAIL_HOST: z.string().min(1, "MAIL_HOST is required"),
    MAIL_PORT: z.coerce.number().int().positive(),
    MAIL_USER: z.string().min(1, "MAIL_USER is required"),
    MAIL_PASSWORD: z.string().min(1, "MAIL_PASSWORD is required"),
    MAIL_FROM: z.string().email("MAIL_FROM must be a valid email"),

    // Storage (Cloudflare R2)
    R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID is required"),
    R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required"),
    R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required"),
    R2_BUCKET: z.string().min(1, "R2_BUCKET is required"),
    R2_PUBLIC_URL: z.string().url("R2_PUBLIC_URL must be a valid URL"),
});

export type EnvConfig = z.infer<typeof envSchema>;
