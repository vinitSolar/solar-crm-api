import dotenv from "dotenv";
import { envSchema } from "./validation.js";
import type { EnvConfig } from "./validation.js";

// Load environment variables from .env file
dotenv.config();

// Validate environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    const errors = parsedEnv.error.format();
    throw new Error(`❌ Invalid environment variables: ${JSON.stringify(errors, null, 2)}`);
}

const config: EnvConfig = parsedEnv.data;

export const env = {
    APP: {
        NODE_ENV: config.NODE_ENV,
        PORT: config.PORT,
        NAME: config.APP_NAME,
        URL: config.APP_URL,
    },
    DB: {
        HOST: config.DB_HOST,
        PORT: config.DB_PORT,
        USER: config.DB_USER,
        PASSWORD: config.DB_PASSWORD,
        NAME: config.DB_NAME,
        SSL: config.DB_SSL,
    },
    JWT: {
        SECRET: config.JWT_SECRET,
        EXPIRES_IN: config.JWT_EXPIRES_IN,
        REFRESH_SECRET: config.JWT_REFRESH_SECRET,
        REFRESH_EXPIRES_IN: config.JWT_REFRESH_EXPIRES_IN,
    },
    REDIS: {
        HOST: config.REDIS_HOST,
        PORT: config.REDIS_PORT,
        PASSWORD: config.REDIS_PASSWORD,
    },
    QUEUE: {
        PREFIX: config.QUEUE_PREFIX,
    },
    LOGGER: {
        LEVEL: config.LOG_LEVEL,
    },
    MAIL: {
        HOST: config.MAIL_HOST,
        PORT: config.MAIL_PORT,
        USER: config.MAIL_USER,
        PASSWORD: config.MAIL_PASSWORD,
        FROM: config.MAIL_FROM,
    },
    STORAGE: {
        ACCOUNT_ID: config.R2_ACCOUNT_ID,
        ACCESS_KEY_ID: config.R2_ACCESS_KEY_ID,
        SECRET_ACCESS_KEY: config.R2_SECRET_ACCESS_KEY,
        BUCKET: config.R2_BUCKET,
        PUBLIC_URL: config.R2_PUBLIC_URL,
    },
} as const;
