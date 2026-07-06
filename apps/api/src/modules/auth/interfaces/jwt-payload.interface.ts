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
