import type { AuthRepository } from "../repositories/auth.repository.js";
import type { LoginRequestDto, LoginResponseDto } from "../dto/login.dto.js";
import type { RefreshTokenRequestDto, RefreshTokenResponseDto } from "../dto/refresh-token.dto.js";
import { comparePassword } from "../utils/bcrypt.js";
import { verifyRefreshToken } from "../utils/jwt.js";
import { generateTokenPair, buildLoginResponse, buildRefreshResponse } from "../utils/token.js";
import { AUTH_MESSAGES, USER_STATUS } from "../constants/auth.constants.js";
import { logger } from "@packages/logger/index.js";
import { env } from "@packages/config/env.js";
import { v4 as uuidv4 } from "uuid";
import { CustomError } from "../../../middlewares/error.middleware.js";

/**
 * Authentication Service.
 *
 * Contains all business logic for authentication operations.
 * No SQL queries — delegates data access to AuthRepository.
 */
export class AuthService {
    private readonly authRepository: AuthRepository;

    constructor(authRepository: AuthRepository) {
        this.authRepository = authRepository;
    }

    /**
     * Authenticates a user with email and password.
     *
     * Flow:
     * 1. Find user by email within tenant
     * 2. Verify account is active
     * 3. Compare password hash
     * 4. Generate access + refresh tokens
     * 5. Update last login timestamp
     * 6. Return login response DTO
     *
     * @param dto - Login request DTO containing email, password, tenantUid.
     * @returns Login response DTO on success.
     * @throws Error with appropriate message on failure.
     */
    async login(dto: LoginRequestDto): Promise<LoginResponseDto> {
        // TODO: Implement login business logic
        logger.info("AuthService.login attempt", { email: dto.email });

        // Step 1: Find user by email within tenant
        const user = await this.authRepository.findByEmail(dto.email);

        if (!user) {
            logger.warn("Login failed: user not found", { email: dto.email });
            throw new CustomError(AUTH_MESSAGES.LOGIN_FAILED, 401);
        }

        // Step 2: Verify account is active
        if (user.is_active === USER_STATUS.INACTIVE) {
            logger.warn("Login failed: user inactive", { userUid: user.uid });
            throw new CustomError(AUTH_MESSAGES.USER_INACTIVE, 401);
        }

        if (user.is_active === USER_STATUS.LOCKED) {
            logger.warn("Login failed: user locked", { userUid: user.uid });
            throw new CustomError(AUTH_MESSAGES.USER_LOCKED, 401);
        }

        // Step 3: Compare password hash
        if (!user.password) {
            logger.warn("Login failed: no password set", { userUid: user.uid });
            throw new CustomError(AUTH_MESSAGES.LOGIN_FAILED, 401);
        }

        const isPasswordValid = await comparePassword(dto.password, user.password);

        if (!isPasswordValid) {
            logger.warn("Login failed: invalid password", { email: dto.email });
            throw new CustomError(AUTH_MESSAGES.LOGIN_FAILED, 401);
        }

        // Step 4: Generate session ID and token pair
        const sessionUid = uuidv4();
        const tokens = generateTokenPair(user, sessionUid);

        // Step 4.5: Store session in database
        const expiresAt = this.parseExpiryToDate(env.JWT.REFRESH_EXPIRES_IN);
        await this.authRepository.createSession(sessionUid, user.uid, tokens.refreshToken, expiresAt);

        // Step 5: Update last login timestamp
        await this.authRepository.updateLastLogin(user.uid);

        // Step 6: Build and return response
        logger.info("Login successful", { userUid: user.uid, tenantUid: user.tenant_uid });
        return buildLoginResponse(user, tokens);
    }

    /**
     * Refreshes an expired access token using a valid refresh token.
     *
     * Flow:
     * 1. Verify the refresh token signature
     * 2. Find the user by UID from the token payload
     * 3. Verify user is still active
     * 4. Generate new token pair
     * 5. Return refresh response DTO
     *
     * @param dto - Refresh token request DTO containing the refresh token.
     * @returns New token pair response DTO.
     * @throws Error with appropriate message on failure.
     */
    async refreshToken(dto: RefreshTokenRequestDto): Promise<RefreshTokenResponseDto> {
        // TODO: Implement refresh token business logic
        logger.info("AuthService.refreshToken attempt");

        // Step 1: Verify the refresh token
        const payload = verifyRefreshToken(dto.refreshToken);

        if (!payload) {
            logger.warn("Refresh token verification failed");
            throw new CustomError(AUTH_MESSAGES.REFRESH_FAILED, 401);
        }

        // Step 2: Check if session exists in database and is not expired
        const session = await this.authRepository.findSessionByToken(dto.refreshToken);

        if (!session || session.user_uid !== payload.userUid || session.expires_at < new Date()) {
            logger.warn("Refresh failed: session invalid or expired");
            throw new CustomError(AUTH_MESSAGES.SESSION_INVALID, 401);
        }

        // Step 3: Find the user
        const user = await this.authRepository.findByUid(payload.userUid);

        if (!user) {
            logger.warn("Refresh failed: user not found", { userUid: payload.userUid });
            throw new CustomError(AUTH_MESSAGES.USER_NOT_FOUND, 401);
        }

        // Step 4: Verify user is still active
        if (user.is_active !== USER_STATUS.ACTIVE) {
            logger.warn("Refresh failed: user not active", { userUid: user.uid });
            throw new CustomError(AUTH_MESSAGES.USER_INACTIVE, 401);
        }

        // Step 5: Generate session ID and new token pair
        const sessionUid = uuidv4();
        const tokens = generateTokenPair(user, sessionUid);

        // Step 5.5: Replace session in database
        const expiresAt = this.parseExpiryToDate(env.JWT.REFRESH_EXPIRES_IN);
        await this.authRepository.deleteSession(dto.refreshToken);
        await this.authRepository.createSession(sessionUid, user.uid, tokens.refreshToken, expiresAt);

        // Step 6: Build and return response
        logger.info("Token refresh successful", { userUid: user.uid });
        return buildRefreshResponse(tokens);
    }

    /**
     * Logs out the user by deleting their session from Redis.
     *
     * @param refreshToken - The refresh token of the session to invalidate.
     */
    async logout(refreshToken: string): Promise<void> {
        logger.info("AuthService.logout attempt");
        
        await this.authRepository.deleteSession(refreshToken);
        
        logger.info("Logout successful");
    }

    /**
     * Helper to parse JWT expiresIn strings (like "7d") to a future Date object.
     */
    private parseExpiryToDate(expiresIn: string): Date {
        const match = expiresIn.match(/^(\d+)([dhms])$/);
        const date = new Date();
        
        if (!match) {
            date.setDate(date.getDate() + 7); // Default 7 days
            return date;
        }
        
        const value = parseInt(match[1]!, 10);
        const unit = match[2];
        
        switch (unit) {
            case 'd': date.setDate(date.getDate() + value); break;
            case 'h': date.setHours(date.getHours() + value); break;
            case 'm': date.setMinutes(date.getMinutes() + value); break;
            case 's': date.setSeconds(date.getSeconds() + value); break;
            default: date.setDate(date.getDate() + 7);
        }
        
        return date;
    }

    /**
     * Retrieves aggregated permissions for a user and their role.
     *
     * @param userUid - The user's UID.
     * @param roleUid - The user's role UID.
     * @param tenantUid - The tenant's UID.
     * @returns Aggregated permissions.
     */
    async getPermissions(userUid: string, roleUid: string, tenantUid: string) {
        logger.info("AuthService.getPermissions", { userUid, roleUid, tenantUid });
        return await this.authRepository.getPermissions(userUid, roleUid, tenantUid);
    }
}
