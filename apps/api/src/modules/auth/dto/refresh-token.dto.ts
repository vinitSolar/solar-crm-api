/**
 * Refresh token request DTO.
 * Validated by `refreshTokenSchema` in auth.validator.ts.
 */
export interface RefreshTokenRequestDto {
    refreshToken: string;
}

/**
 * Refresh token response DTO.
 * Returned on successful token rotation.
 */
export interface RefreshTokenResponseDto {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}
