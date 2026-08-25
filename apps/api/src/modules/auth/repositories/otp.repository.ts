import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@packages/logger/index.js";

export class OtpRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    /**
     * Store OTP in the fallback otps table
     */
    async saveOtp(email: string, otp: string, expiresAt: Date): Promise<boolean> {
        try {
            const uid = uuidv4();
            
            // Upsert OTP (replace if already exists for this email)
            await this.pool.query(
                `INSERT INTO otps (uid, email, otp, expires_at)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (email) 
                 DO UPDATE SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at, created_at = CURRENT_TIMESTAMP`,
                [uid, email, otp, expiresAt]
            );
            return true;
        } catch (error) {
            logger.error("Failed to save OTP in fallback DB", { error, email });
            return false;
        }
    }

    /**
     * Verify OTP from the fallback otps table.
     * Returns true if verified successfully and deletes the OTP.
     */
    async verifyOtp(email: string, otp: string): Promise<boolean> {
        try {
            const result = await this.pool.query(
                `SELECT * FROM otps WHERE email = $1 AND otp = $2 AND expires_at > CURRENT_TIMESTAMP`,
                [email, otp]
            );

            if (result.rows.length > 0) {
                // If found and valid, delete it to prevent reuse
                await this.deleteOtp(email);
                return true;
            }
            return false;
        } catch (error) {
            logger.error("Failed to verify OTP in fallback DB", { error, email });
            return false;
        }
    }

    /**
     * Delete OTP manually
     */
    async deleteOtp(email: string): Promise<boolean> {
        try {
            await this.pool.query(`DELETE FROM otps WHERE email = $1`, [email]);
            return true;
        } catch (error) {
            logger.error("Failed to delete OTP from fallback DB", { error, email });
            return false;
        }
    }
}
