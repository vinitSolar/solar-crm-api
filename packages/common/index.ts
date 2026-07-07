import { env } from "@packages/config/index.js";

/**
 * Common utilities for SunSelect CRM
 */

/**
 * Generates a random secure string, typically used for passwords or tokens.
 * Uses the charset and length defined in the environment configuration, 
 * or falls back to provided overrides.
 * 
 * @param length Optional length override. Defaults to env.SECURITY.PASSWORD_LENGTH
 * @param charset Optional charset override. Defaults to env.SECURITY.PASSWORD_CHARSET
 * @returns A randomly generated string.
 */
export function generateRandomString(
    length: number = env.SECURITY.PASSWORD_LENGTH,
    charset: string = env.SECURITY.PASSWORD_CHARSET
): string {
    let result = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        result += charset[randomIndex];
    }
    return result;
}
