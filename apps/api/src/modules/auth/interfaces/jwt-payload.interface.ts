/**
 * JWT access token payload.
 * Embedded in every signed access token.
 */
export interface IJwtPayload {
    sessionUid: string;
    userUid: string;
    tenantUid: string;
    roleUid: string;
    email: string | null;
}

/**
 * JWT refresh token payload.
 * Minimal claims for token rotation.
 */
export interface IJwtRefreshPayload {
    userUid: string;
    tenantUid: string;
}

/**
 * JWT reset password token payload.
 * Issued after OTP verification to authorize password reset.
 */
export interface IJwtResetPasswordPayload {
    email: string;
    purpose: "password_reset";
}
