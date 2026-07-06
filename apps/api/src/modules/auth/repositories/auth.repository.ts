import type { Pool } from "pg";
import type { IUser, IUserSession } from "../interfaces/auth.interface.js";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@packages/logger/index.js";

/**
 * Authentication Repository.
 *
 * Responsible for all database operations related to authentication.
 * Contains ONLY SQL queries — no business logic.
 */
export class AuthRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    /**
     * Finds a user by email within a specific tenant.
     * Used during login to locate the authenticating user.
     *
     * @param email - The user's email address.
     * @param tenantUid - The tenant UID for multi-tenant isolation.
     * @returns The user record or null if not found.
     */
    async findByEmail(email: string): Promise<IUser | null> {
        // TODO: Implement SQL query
        // - SELECT from users WHERE email = $1 AND tenant_uid = $2 AND is_deleted = 0
        // - Return mapped IUser or null
        logger.debug("AuthRepository.findByEmail", { email });

        const query = `
            SELECT id, uid, tenant_uid, role_uid, first_name, last_name,
                   email, password, last_login,
                   is_active, is_deleted, created_at, updated_at,
                   created_by, updated_by, deleted_by
            FROM users
            WHERE email = $1
              AND is_deleted = 0
        `;

        const result = await this.pool.query(query, [email]);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0] as IUser;
    }

    /**
     * Finds a user by their unique identifier (UID).
     * Used during token refresh to verify the user still exists and is active.
     *
     * @param uid - The user's UID.
     * @returns The user record or null if not found.
     */
    async findByUid(uid: string): Promise<IUser | null> {
        // TODO: Implement SQL query
        // - SELECT from users WHERE uid = $1 AND is_deleted = 0
        // - Return mapped IUser or null
        logger.debug("AuthRepository.findByUid", { uid });

        const query = `
            SELECT id, uid, tenant_uid, role_uid, first_name, last_name,
                   email, password, last_login,
                   is_active, is_deleted, created_at, updated_at,
                   created_by, updated_by, deleted_by
            FROM users
            WHERE uid = $1
              AND is_deleted = 0
        `;

        const result = await this.pool.query(query, [uid]);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0] as IUser;
    }

    /**
     * Updates the `last_login` timestamp for a user.
     * Called after successful authentication.
     *
     * @param uid - The user's UID.
     */
    async updateLastLogin(uid: string): Promise<void> {
        // TODO: Implement SQL query
        // - UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE uid = $1
        logger.debug("AuthRepository.updateLastLogin", { uid });

        const query = `
            UPDATE users
            SET last_login = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE uid = $1
        `;

        await this.pool.query(query, [uid]);
    }

    /**
     * Creates a new user session in the database.
     *
     * @param sessionUid - The unique session ID (UUID).
     * @param userUid - The user's UID.
     * @param refreshToken - The refresh token string.
     * @param expiresAt - Expiration timestamp for the refresh token.
     */
    async createSession(sessionUid: string, userUid: string, refreshToken: string, expiresAt: Date): Promise<void> {
        logger.debug("AuthRepository.createSession", { sessionUid, userUid });

        const query = `
            INSERT INTO user_sessions (uid, user_uid, refresh_token, expires_at)
            VALUES ($1, $2, $3, $4)
        `;

        await this.pool.query(query, [sessionUid, userUid, refreshToken, expiresAt]);
    }

    /**
     * Finds a user session by its refresh token.
     *
     * @param refreshToken - The refresh token string.
     * @returns The user session record or null if not found.
     */
    async findSessionByToken(refreshToken: string): Promise<IUserSession | null> {
        logger.debug("AuthRepository.findSessionByToken");

        const query = `
            SELECT id, uid, user_uid, refresh_token, expires_at, is_active, is_deleted, created_at, updated_at
            FROM user_sessions
            WHERE refresh_token = $1
              AND is_active = 1
              AND is_deleted = 0
        `;

        const result = await this.pool.query(query, [refreshToken]);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0] as IUserSession;
    }

    /**
     * Finds a user session by its session UID.
     *
     * @param sessionUid - The session UID.
     * @returns The user session record or null if not found.
     */
    async findSessionByUid(sessionUid: string): Promise<IUserSession | null> {
        logger.debug("AuthRepository.findSessionByUid");

        const query = `
            SELECT id, uid, user_uid, refresh_token, expires_at, is_active, is_deleted, created_at, updated_at
            FROM user_sessions
            WHERE uid = $1
              AND is_active = 1
              AND is_deleted = 0
        `;

        const result = await this.pool.query(query, [sessionUid]);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0] as IUserSession;
    }

    /**
     * Inactivates a user session in the database (soft delete).
     *
     * @param refreshToken - The refresh token of the session to inactivate.
     */
    async deleteSession(refreshToken: string): Promise<void> {
        logger.debug("AuthRepository.deleteSession (soft delete)");

        const query = `
            UPDATE user_sessions
            SET is_active = 0,
                updated_at = CURRENT_TIMESTAMP
            WHERE refresh_token = $1
        `;

        await this.pool.query(query, [refreshToken]);
    }
}
