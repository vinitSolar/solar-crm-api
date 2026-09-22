import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Resolve logs directory at project root */
const LOGS_DIR = path.resolve(__dirname, "../../logs");

/** Ensure the logs directory exists on startup */
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/** Shared JSON format for file transports */
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
);

/** Colorized simple format for console */
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
        return `${timestamp} ${level}: ${message}${metaStr}`;
    }),
);

/**
 * Error log — only error-level entries.
 * Rotates daily, kept for 30 days, max 20 MB per file.
 */
const errorRotateTransport = new DailyRotateFile({
    dirname: LOGS_DIR,
    filename: "error-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    level: "error",
    maxSize: "20m",
    maxFiles: "30d",
    format: fileFormat,
    zippedArchive: true,
});

/**
 * Combined log — info and above (info, warn, error).
 * Rotates daily, kept for 14 days, max 20 MB per file.
 */
const combinedRotateTransport = new DailyRotateFile({
    dirname: LOGS_DIR,
    filename: "combined-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxSize: "20m",
    maxFiles: "14d",
    format: fileFormat,
    zippedArchive: true,
});

/**
 * Exceptions log — uncaught exceptions.
 * Rotates daily, kept for 30 days.
 */
const exceptionRotateTransport = new DailyRotateFile({
    dirname: LOGS_DIR,
    filename: "exceptions-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxSize: "20m",
    maxFiles: "30d",
    format: fileFormat,
    zippedArchive: true,
});

/**
 * Rejections log — unhandled promise rejections.
 * Rotates daily, kept for 30 days.
 */
const rejectionRotateTransport = new DailyRotateFile({
    dirname: LOGS_DIR,
    filename: "rejections-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxSize: "20m",
    maxFiles: "30d",
    format: fileFormat,
    zippedArchive: true,
});

export const logger = winston.createLogger({
    level: "info",
    format: fileFormat,
    transports: [
        /** Console — always active */
        new winston.transports.Console({ format: consoleFormat }),

        /** File — error only */
        errorRotateTransport,

        /** File — all levels (info, warn, error) */
        combinedRotateTransport,
    ],
    exceptionHandlers: [exceptionRotateTransport],
    rejectionHandlers: [rejectionRotateTransport],
    exitOnError: false,
});

