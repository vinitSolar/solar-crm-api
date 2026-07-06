import jwt from "jsonwebtoken";
import { env } from "@packages/config/index.js";
import { logger } from "@packages/logger/index.js";
import type { IJwtPayload, IJwtRefreshPayload } from "../interfaces/jwt-payload.interface.js";

/**
 * Converts a time duration string (e.g., "15m", "7d") to seconds.
 * Falls back to treating the value as seconds if no unit is found.
 */
function parseExpiresIn(value: string): number {
    const match = value.match(/^(\d+)(s|m|h|d)$/);
    if (!match) {
        return parseInt(value, 10);
    }

    const num = parseInt(match[1] as string, 10);
    const unit = match[2];

    switch (unit) {
        case "s": return num;
        case "m": return num * 60;
        case "h": return num * 3600;
        case "d": return num * 86400;
        default: return num;
    }
}

/**
 * Generates a signed JWT access token.
 *
 * @param payload - The claims to embed in the token.
 * @returns Signed JWT string.
 */
export function generateAccessToken(payload: IJwtPayload): string {
    // TODO: Implement access token generation
    // - Sign with env.JWT.SECRET
    // - Set expiration to env.JWT.EXPIRES_IN
    // - Log token generation event
    logger.debug("Generating access token", { userUid: payload.userUid });

    return jwt.sign(payload, env.JWT.SECRET, {
        expiresIn: parseExpiresIn(env.JWT.EXPIRES_IN),
    });
}

/**
 * Generates a signed JWT refresh token.
 *
 * @param payload - Minimal claims for refresh token.
 * @returns Signed JWT string.
 */
export function generateRefreshToken(payload: IJwtRefreshPayload): string {
    // TODO: Implement refresh token generation
    // - Sign with env.JWT.REFRESH_SECRET
    // - Set expiration to env.JWT.REFRESH_EXPIRES_IN
    // - Log token generation event
    logger.debug("Generating refresh token", { userUid: payload.userUid });

    return jwt.sign(payload, env.JWT.REFRESH_SECRET, {
        expiresIn: parseExpiresIn(env.JWT.REFRESH_EXPIRES_IN),
    });
}

/**
 * Verifies and decodes an access token.
 *
 * @param token - The JWT string to verify.
 * @returns Decoded payload or null if invalid/expired.
 */
export function verifyAccessToken(token: string): IJwtPayload | null {
    // TODO: Implement access token verification
    // - Verify with env.JWT.SECRET
    // - Return decoded payload or null on failure
    // - Log verification failures
    try {
        const decoded = jwt.verify(token, env.JWT.SECRET) as IJwtPayload;
        return decoded;
    } catch (error) {
        logger.warn("Access token verification failed", { error });
        return null;
    }
}

/**
 * Verifies and decodes a refresh token.
 *
 * @param token - The JWT refresh token string to verify.
 * @returns Decoded payload or null if invalid/expired.
 */
export function verifyRefreshToken(token: string): IJwtRefreshPayload | null {
    // TODO: Implement refresh token verification
    // - Verify with env.JWT.REFRESH_SECRET
    // - Return decoded payload or null on failure
    // - Log verification failures
    try {
        const decoded = jwt.verify(token, env.JWT.REFRESH_SECRET) as IJwtRefreshPayload;
        return decoded;
    } catch (error) {
        logger.warn("Refresh token verification failed", { error });
        return null;
    }
}
