import type { Request } from "express";

/**
 * Represents a user record from the `users` table.
 */
export interface IUser {
    id: number;
    uid: string;
    tenant_uid: string;
    role_uid: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    password: string | null;
    last_login: Date | null;
    is_active: number;
    is_deleted: number;
    created_at: Date;
    updated_at: Date;
    created_by: string | null;
    updated_by: string | null;
    deleted_by: string | null;
}

/**
 * Represents a user session from the `user_sessions` table.
 */
export interface IUserSession {
    id: number;
    uid: string;
    user_uid: string;
    refresh_token: string;
    expires_at: Date;
    is_active: number;
    is_deleted: number;
    created_at: Date;
    updated_at: Date;
    created_by: string | null;
    updated_by: string | null;
    deleted_by: string | null;
}

/**
 * Sanitized user object returned in API responses.
 * Excludes sensitive fields like `password`.
 */
export interface IUserSafe {
    uid: string;
    tenantUid: string;
    roleUid: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    lastLogin: Date | null;
    isActive: number;
}

/**
 * Login request payload.
 */
export interface ILoginRequest {
    email: string;
    password: string;
    tenantUid: string;
}

/**
 * Login response payload.
 */
export interface ILoginResponse {
    user: IUserSafe;
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}

/**
 * Refresh token request payload.
 */
export interface IRefreshTokenRequest {
    refreshToken: string;
}

/**
 * Refresh token response payload.
 */
export interface IRefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}

/**
 * Extends Express `Request` with authenticated user context.
 * Populated by the `authenticate` middleware.
 */
export interface IAuthenticatedRequest extends Request {
    user: IUserSafe;
    tenantUid: string;
    roleUid: string;
}
