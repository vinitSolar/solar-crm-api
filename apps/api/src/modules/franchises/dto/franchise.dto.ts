import type { ITenant, IFranchiseSafe, IFranchiseOwnerDetails, IFranchiseBusinessDetails, IFranchiseDocument, IFranchiseDocumentSafe } from "../interfaces/franchise.interface.js";
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
        tenantUid: tenant.uid,
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

/**
 * Maps a franchise document record to a safe DTO.
 */
export function toFranchiseDocumentSafe(doc: IFranchiseDocument): IFranchiseDocumentSafe {
    return {
        uid: doc.uid,
        documentTypeUid: doc.documentTypeUid,
        documentNumber: doc.documentNumber,
        originalFileName: doc.originalFileName,
        filePath: doc.filePath,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        uploadedAt: doc.createdAt,
    };
}
