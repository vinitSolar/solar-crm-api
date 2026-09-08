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

    // Security
    PASSWORD_CHARSET: z.string().default("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+"),
    PASSWORD_LENGTH: z.coerce.number().int().positive().default(12),

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

    // Storage (AWS S3 / Cloudflare R2 / Local)
    STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
    AWS_REGION: z.string().optional().default("ap-south-1"),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_S3_BUCKET: z.string().optional(),
    AWS_S3_PUBLIC_URL: z.string().url("AWS_S3_PUBLIC_URL must be a valid URL").optional().or(z.literal("")),
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET: z.string().optional(),
    R2_PUBLIC_URL: z.string().url("R2_PUBLIC_URL must be a valid URL").optional().or(z.literal("")),

    // Firebase Cloud Messaging (FCM)
    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;
