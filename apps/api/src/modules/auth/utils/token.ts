import type { IUser, IUserSafe } from "../interfaces/auth.interface.js";
import type { IJwtPayload, IJwtRefreshPayload } from "../interfaces/jwt-payload.interface.js";
import type { LoginResponseDto } from "../dto/login.dto.js";
import type { RefreshTokenResponseDto } from "../dto/refresh-token.dto.js";
import { generateAccessToken, generateRefreshToken } from "./jwt.js";
import { env } from "@packages/config/index.js";

/**
 * Generates both access and refresh tokens for a user.
 *
 * @param user - The authenticated user record.
 * @returns Object containing accessToken and refreshToken strings.
 */
export function generateTokenPair(user: IUser, sessionUid: string): { accessToken: string; refreshToken: string } {
    // TODO: Implement token pair generation
    // - Build JWT payload from user record
    // - Generate access token
    // - Generate refresh token
    // - Return both tokens

    const accessPayload: IJwtPayload = {
        sessionUid,
        userUid: user.uid,
        tenantUid: user.tenant_uid,
        roleUid: user.role_uid,
        email: user.email,
    };

    const refreshPayload: IJwtRefreshPayload = {
        userUid: user.uid,
        tenantUid: user.tenant_uid,
    };

    return {
        accessToken: generateAccessToken(accessPayload),
        refreshToken: generateRefreshToken(refreshPayload),
    };
}

/**
 * Sanitizes a user record by removing sensitive fields.
 *
 * @param user - The raw user database record.
 * @returns A safe user object without password or internal IDs.
 */
export function sanitizeUser(user: IUser): IUserSafe {
    return {
        uid: user.uid,
        tenantUid: user.tenant_uid,
        roleUid: user.role_uid,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        lastLogin: user.last_login,
        isActive: user.is_active,
    };
}

/**
 * Builds a complete login response DTO from user and tokens.
 *
 * @param user - The authenticated user record.
 * @param tokens - The generated access and refresh tokens.
 * @returns Login response DTO ready for the API response.
 */
export function buildLoginResponse(
    user: IUser,
    tokens: { accessToken: string; refreshToken: string },
): LoginResponseDto {
    // TODO: Implement login response builder
    // - Sanitize user data
    // - Attach tokens
    // - Include token expiry info
    return {
        // user: sanitizeUser(user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: env.JWT.EXPIRES_IN,
    };
}

/**
 * Builds a refresh token response DTO.
 *
 * @param tokens - The newly generated access and refresh tokens.
 * @returns Refresh token response DTO ready for the API response.
 */
export function buildRefreshResponse(
    tokens: { accessToken: string; refreshToken: string },
): RefreshTokenResponseDto {
    return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: env.JWT.EXPIRES_IN,
    };
}
