import type { IUserSafe } from "../interfaces/auth.interface.js";

/**
 * Login request DTO.
 * Validated by `loginSchema` in auth.validator.ts.
 */
export interface LoginRequestDto {
    email: string;
    password: string;
}

/**
 * Login response DTO.
 * Returned on successful authentication.
 */
export interface LoginResponseDto {
    // user: IUserSafe;
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}
