import bcrypt from "bcrypt";
import { BCRYPT_SALT_ROUNDS } from "../constants/auth.constants.js";

/**
 * Hashes a plaintext password using bcrypt.
 *
 * @param plainText - The raw password string to hash.
 * @returns The bcrypt hash string.
 */
export async function hashPassword(plainText: string): Promise<string> {
    // TODO: Implement password hashing
    // - Generate salt with configured rounds
    // - Return hashed password
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    return bcrypt.hash(plainText, salt);
}

/**
 * Compares a plaintext password against a bcrypt hash.
 *
 * @param plainText - The raw password to verify.
 * @param hash - The stored bcrypt hash.
 * @returns True if the password matches the hash.
 */
export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
    // TODO: Implement password comparison
    // - Compare plaintext against stored hash
    // - Return boolean result
    return bcrypt.compare(plainText, hash);
}
