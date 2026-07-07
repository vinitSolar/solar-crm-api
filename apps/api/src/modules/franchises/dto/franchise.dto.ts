import type { ITenant, IFranchiseSafe, IFranchiseOwnerDetails, IFranchiseBusinessDetails } from "../interfaces/franchise.interface.js";
import type { ICreateFranchiseResponse } from "../interfaces/franchise.interface.js";

/**
 * Maps a tenant record to the franchise creation response DTO.
 * Only exposes fields relevant to the API response.
 */
export function toCreateFranchiseDTO(
    tenant: ITenant, 
    credentials?: { adminEmail?: string; adminPassword?: string }
): ICreateFranchiseResponse {
    return {
        franchiseUid: tenant.uid,
        franchiseName: tenant.name,
        franchiseCode: tenant.code,
        onboardingStatus: tenant.onboardingStatus,
        ...(credentials?.adminEmail && { adminEmail: credentials.adminEmail }),
        ...(credentials?.adminPassword && { adminPassword: credentials.adminPassword }),
    };
}

/**
 * Maps a tenant record to a safe franchise DTO for list/get operations.
 * Strips internal fields (id, type, timezone, updatedBy, deletedBy, updatedAt).
 */
export function toFranchiseSafe(tenant: ITenant): IFranchiseSafe {
    return {
        uid: tenant.uid,
        code: tenant.code,
        name: tenant.name,
        email: tenant.email,
        mobile: tenant.mobile,
        logo: tenant.logo,
        onboardingStatus: tenant.onboardingStatus,
        isActive: tenant.isActive,
        isDeleted: tenant.isDeleted,
        createdAt: tenant.createdAt,
    };
}

/**
 * Strips the internal `id` field from owner details for API responses.
 */
export function toOwnerDetailsSafe(owner: IFranchiseOwnerDetails): Omit<IFranchiseOwnerDetails, "id"> {
    const { id, ...safe } = owner;
    return safe;
}

/**
 * Strips the internal `id` field from business details for API responses.
 */
export function toBusinessDetailsSafe(business: IFranchiseBusinessDetails): Omit<IFranchiseBusinessDetails, "id"> {
    const { id, ...safe } = business;
    return safe;
}
