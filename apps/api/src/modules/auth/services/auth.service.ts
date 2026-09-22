import type { AuthRepository } from "../repositories/auth.repository.js";
import type { LoginRequestDto, LoginResponseDto } from "../dto/login.dto.js";
import type { RefreshTokenRequestDto, RefreshTokenResponseDto } from "../dto/refresh-token.dto.js";
import type { LogoutRequestDto } from "../dto/logout.dto.js";
import { comparePassword, hashPassword } from "../utils/bcrypt.js";
import { verifyRefreshToken, generateResetPasswordToken, verifyResetPasswordToken } from "../utils/jwt.js";
import { generateTokenPair, buildLoginResponse, buildRefreshResponse } from "../utils/token.js";
import { AUTH_MESSAGES, USER_STATUS, OTP_EXPIRY_SECONDS } from "../constants/auth.constants.js";
import { logger } from "@packages/logger/index.js";
import { env } from "@packages/config/env.js";
import { v4 as uuidv4 } from "uuid";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { redisClient, safeCacheDel } from "@packages/redis/index.js";
import { notificationService } from "../../notification/services/notification.service.js";
import { NOTIFICATION_CHANNEL, NOTIFICATION_TEMPLATE } from "../../notification/constants/notification.constants.js";
import { isRedisAvailable } from "../../notification/helpers/redis-health.helper.js";
import type { OtpRepository } from "../repositories/otp.repository.js";
import type { DeviceTokenRepository } from "../../users/repositories/device-token.repository.js";

/**
 * Authentication Service.
 *
 * Contains all business logic for authentication operations.
 * No SQL queries — delegates data access to AuthRepository.
 */
export class AuthService {
    private readonly authRepository: AuthRepository;
    private readonly otpRepository: OtpRepository;
    private readonly deviceTokenRepository: DeviceTokenRepository;

    constructor(
        authRepository: AuthRepository,
        otpRepository: OtpRepository,
        deviceTokenRepository: DeviceTokenRepository
    ) {
        this.authRepository = authRepository;
        this.otpRepository = otpRepository;
        this.deviceTokenRepository = deviceTokenRepository;
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

        // Step 5.5: Register mobile device token if provided
        if (dto.deviceToken && dto.deviceType) {
            try {
                await this.deviceTokenRepository.upsertToken(
                    user.tenant_uid,
                    user.uid,
                    {
                        deviceToken: dto.deviceToken,
                        deviceType: dto.deviceType,
                        deviceName: dto.deviceName || null
                    },
                    user.uid
                );
                logger.info("Mobile device token registered during login", {
                    userUid: user.uid,
                    deviceType: dto.deviceType
                });
            } catch (deviceTokenErr) {
                logger.error("Failed to register device token during login:", deviceTokenErr);
            }
        }

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

        // Step 5.5: Replace session in database and invalidate old session cache
        const expiresAt = this.parseExpiryToDate(env.JWT.REFRESH_EXPIRES_IN);
        await this.authRepository.deleteSession(dto.refreshToken);
        await this.authRepository.createSession(sessionUid, user.uid, tokens.refreshToken, expiresAt);

        // Invalidate old session cache so auth middleware doesn't serve stale data
        if (session.uid) {
            safeCacheDel(`cache:auth:session:${session.uid}`).catch(() => {});
        }

        // Step 6: Build and return response
        logger.info("Token refresh successful", { userUid: user.uid });
        return buildRefreshResponse(tokens);
    }

    /**
     * Logs out the user by deleting their session from the database
     * and deactivating active mobile device tokens so logged-out users do not receive push notifications.
     *
     * @param dto - Logout request DTO containing the refreshToken and optional deviceToken.
     */
    async logout(dto: LogoutRequestDto | string): Promise<void> {
        const refreshToken = typeof dto === "string" ? dto : dto.refreshToken;
        const deviceToken = typeof dto === "string" ? undefined : dto.deviceToken;

        logger.info("AuthService.logout attempt");

        // Step 1: Look up session to identify the user before deleting session
        const session = await this.authRepository.findSessionByToken(refreshToken);

        // Step 2: Deactivate device token(s) so logged-out users do not receive push notifications
        if (deviceToken) {
            // Specific device token provided: deactivate this device
            await this.deviceTokenRepository.deactivateByToken(deviceToken);
            logger.info("Deactivated specific mobile device token during logout", {
                deviceTokenPrefix: deviceToken.substring(0, 15) + "..."
            });
        } else if (session && session.user_uid) {
            // No specific deviceToken provided: deactivate all active device tokens for this user
            const count = await this.deviceTokenRepository.deactivateAllByUser(session.user_uid);
            logger.info("Deactivated all active mobile device tokens for user during logout", {
                userUid: session.user_uid,
                deactivatedCount: count
            });
        }

        // Step 3: Delete session from database and invalidate cache
        await this.authRepository.deleteSession(refreshToken);

        // Invalidate session cache so auth middleware rejects immediately
        if (session?.uid) {
            safeCacheDel(`cache:auth:session:${session.uid}`).catch(() => {});
        }
        
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

    /**
     * Changes the user's password.
     * 
     * @param userUid - The user's UID.
     * @param data - The old and new passwords.
     */
    async changePassword(userUid: string, data: any): Promise<void> {
        logger.info("AuthService.changePassword attempt", { userUid });

        const user = await this.authRepository.findByUid(userUid);
        if (!user) {
            throw new CustomError(AUTH_MESSAGES.USER_NOT_FOUND, 404);
        }

        if (!user.password) {
            throw new CustomError(AUTH_MESSAGES.OLD_PASSWORD_INCORRECT, 401);
        }

        const isPasswordValid = await comparePassword(data.oldPassword, user.password);
        if (!isPasswordValid) {
            throw new CustomError(AUTH_MESSAGES.OLD_PASSWORD_INCORRECT, 401);
        }

        const hashedPassword = await hashPassword(data.newPassword);
        await this.authRepository.updatePassword(userUid, hashedPassword);
        
        logger.info("Password changed successfully", { userUid });
    }

    /**
     * Initiates the forgot password flow by generating an OTP and sending it via email.
     * 
     * @param email - The user's email address.
     */
    async forgotPassword(email: string): Promise<void> {
        logger.info("AuthService.forgotPassword attempt", { email });

        const normalizedEmail = email.toLowerCase().trim();
        const user = await this.authRepository.findByEmail(normalizedEmail);
        
        if (!user) {
            logger.warn("Forgot password requested for non-existent email", { email: normalizedEmail });
            throw new CustomError(AUTH_MESSAGES.USER_NOT_FOUND, 404);
        }

        if (user.is_active !== USER_STATUS.ACTIVE) {
            logger.warn("Forgot password requested for inactive user", { email: normalizedEmail, userUid: user.uid });
            throw new CustomError(AUTH_MESSAGES.USER_INACTIVE, 400);
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const redisKey = `auth:otp:${normalizedEmail}`;

        // Store OTP in Redis or Fallback DB
        let storedInRedis = false;
        if (isRedisAvailable()) {
            try {
                await redisClient.setex(redisKey, OTP_EXPIRY_SECONDS, otp);
                storedInRedis = true;
            } catch (redisError: any) {
                logger.warn(`Redis setex failed: ${redisError?.message || redisError}. Using Postgres fallback.`, { email });
            }
        }

        if (!storedInRedis) {
            logger.info("Using Postgres fallback for OTP generation", { email: normalizedEmail });
            const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);
            await this.otpRepository.saveOtp(normalizedEmail, otp, expiresAt);
        }

        // Dispatch email notification
        await notificationService.send({
            tenantUid: user.tenant_uid,
            module: "Auth",
            referenceUid: user.uid,
            channel: NOTIFICATION_CHANNEL.EMAIL,
            template: NOTIFICATION_TEMPLATE.PASSWORD_RESET,
            recipient: normalizedEmail,
            variables: {
                firstName: user.first_name || "",
                lastName: user.last_name || "",
                otp: otp,
                expiryMinutes: Math.floor(OTP_EXPIRY_SECONDS / 60).toString(),
                logoUrl: `${env.APP.URL || 'http://localhost:5000'}/public/assets/email/sunselect-logo.svg`
            },
            createdBy: "SYSTEM"
        });

        logger.info("Forgot password OTP generated and sent", { userUid: user.uid });
    }

    /**
     * Verifies the OTP for password reset.
     * On success, deletes the OTP and returns a signed resetToken (valid for 15 minutes).
     *
     * @param email - User's email address.
     * @param otp - 6-digit OTP string.
     */
    async verifyOtp(email: string, otp: string): Promise<{ email: string; resetToken: string }> {
        const normalizedEmail = email.toLowerCase().trim();
        logger.info("AuthService.verifyOtp attempt", { email: normalizedEmail });

        let isValid = false;

        if (isRedisAvailable()) {
            try {
                const redisKey = `auth:otp:${normalizedEmail}`;
                const storedOtp = await redisClient.get(redisKey);
                if (storedOtp && storedOtp === otp) {
                    isValid = true;
                    await redisClient.del(redisKey).catch(() => {});
                }
            } catch (redisError: any) {
                logger.warn(`Redis get failed during OTP verification: ${redisError?.message || redisError}. Checking Postgres fallback.`, { email: normalizedEmail });
            }
        }

        if (!isValid) {
            isValid = await this.otpRepository.verifyOtp(normalizedEmail, otp);
        }

        if (!isValid) {
            logger.warn("OTP verification failed: Invalid or expired OTP", { email: normalizedEmail });
            throw new CustomError(AUTH_MESSAGES.OTP_INVALID, 400);
        }

        const resetToken = generateResetPasswordToken(normalizedEmail);

        if (isRedisAvailable()) {
            try {
                await redisClient.setex(`auth:reset-token:${normalizedEmail}`, 900, resetToken);
                await redisClient.setex(`auth:reset-verified:${normalizedEmail}`, 900, "true");
            } catch (redisErr: any) {
                logger.warn("Failed to cache reset token in Redis", { error: redisErr?.message });
            }
        }

        logger.info("OTP verified successfully and reset token generated", { email: normalizedEmail });
        return { email: normalizedEmail, resetToken };
    }

    /**
     * Resets the user's password using resetToken, verified session, or OTP.
     *
     * @param data - The email, newPassword, and optional resetToken or otp.
     */
    async resetPassword(data: { email: string; resetToken?: string; otp?: string; newPassword: string }): Promise<void> {
        const normalizedEmail = data.email.toLowerCase().trim();
        logger.info("AuthService.resetPassword attempt", { email: normalizedEmail });

        let isAuthorized = false;

        // 1. Validate resetToken if supplied
        if (data.resetToken) {
            const decoded = verifyResetPasswordToken(data.resetToken);
            if (decoded && decoded.email === normalizedEmail) {
                isAuthorized = true;
            } else {
                throw new CustomError(AUTH_MESSAGES.RESET_TOKEN_INVALID, 400);
            }
        }

        // 2. Check if verified session exists in Redis
        if (!isAuthorized && !data.otp && isRedisAvailable()) {
            try {
                const verifiedKey = `auth:reset-verified:${normalizedEmail}`;
                const isVerified = await redisClient.get(verifiedKey);
                if (isVerified === "true") {
                    isAuthorized = true;
                }
            } catch (redisErr: any) {
                logger.warn("Failed to check verified status in Redis", { error: redisErr?.message });
            }
        }

        // 3. Legacy support: verify OTP directly if provided
        if (!isAuthorized && data.otp) {
            let isValidOtp = false;
            if (isRedisAvailable()) {
                try {
                    const redisKey = `auth:otp:${normalizedEmail}`;
                    const storedOtp = await redisClient.get(redisKey);
                    if (storedOtp && storedOtp === data.otp) {
                        isValidOtp = true;
                        await redisClient.del(redisKey).catch(() => {});
                    }
                } catch (redisError: any) {
                    logger.warn(`Redis get failed during OTP verification: ${redisError?.message || redisError}. Checking Postgres fallback.`, { email: normalizedEmail });
                }
            }
            if (!isValidOtp) {
                isValidOtp = await this.otpRepository.verifyOtp(normalizedEmail, data.otp);
            }

            if (isValidOtp) {
                isAuthorized = true;
            } else {
                throw new CustomError(AUTH_MESSAGES.OTP_INVALID, 400);
            }
        }

        if (!isAuthorized) {
            logger.warn("Reset password failed: Verification required", { email: normalizedEmail });
            throw new CustomError(AUTH_MESSAGES.RESET_VERIFICATION_REQUIRED, 400);
        }

        const [user, hashedPassword] = await Promise.all([
            this.authRepository.findByEmail(normalizedEmail),
            hashPassword(data.newPassword)
        ]);

        if (!user) {
            logger.warn("Reset password failed: User not found", { email: normalizedEmail });
            throw new CustomError(AUTH_MESSAGES.USER_NOT_FOUND, 404);
        }

        await this.authRepository.updatePassword(user.uid, hashedPassword);

        if (isRedisAvailable()) {
            try {
                await redisClient.del(
                    `auth:reset-token:${normalizedEmail}`,
                    `auth:reset-verified:${normalizedEmail}`,
                    `auth:otp:${normalizedEmail}`
                );
            } catch (redisErr: any) {
                logger.warn("Failed to clean up reset keys in Redis", { error: redisErr?.message });
            }
        }

        logger.info("Password reset successfully", { userUid: user.uid });
    }
}
