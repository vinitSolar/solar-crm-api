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
    DATABASE_URL: z.string().optional(),
    DB_HOST: z.string().optional(),
    DB_PORT: z.coerce.number().int().positive().default(5432),
    DB_USER: z.string().optional(),
    DB_PASSWORD: z.string().optional(),
    DB_NAME: z.string().optional(),
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

    // Mail (SMTP / Nodemailer or HTTP API via Brevo / Resend)
    MAIL_PROVIDER: z.preprocess((val) => {
        if (typeof val === "string") {
            const normalized = val.trim().toLowerCase();
            if (normalized === "nodemailer" || normalized === "nodemailor" || normalized === "smtp") {
                return "nodemailer";
            }
            if (normalized === "brevo") {
                return "brevo";
            }
            if (normalized === "resend") {
                return "resend";
            }
            if (normalized === "auto") {
                return "auto";
            }
        }
        return val;
    }, z.enum(["nodemailer", "smtp", "brevo", "resend", "auto"]).default("auto")),
    BREVO_API_KEY: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    MAIL_HOST: z.string().optional().default("smtp.gmail.com"),
    MAIL_PORT: z.coerce.number().int().positive().optional().default(587),
    MAIL_USER: z.string().optional(),
    MAIL_PASSWORD: z.string().optional(),
    MAIL_FROM: z.string().min(1, "MAIL_FROM is required").default("noreply@sunselect.com"),

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

    // WhatsApp Cloud API (Meta)
    WHATSAPP_API_VERSION: z.string().optional().default("v26.0"),
    WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
    WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
    WHATSAPP_ACCESS_TOKEN: z.string().optional(),
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
    META_APP_SECRET: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;
