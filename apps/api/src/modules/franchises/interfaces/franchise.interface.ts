/**
 * Represents a tenant record from the `tenants` table.
 */
export interface ITenant {
    id: number;
    uid: string;
    code: string;
    name: string;
    type: number;
    email: string | null;
    mobile: string | null;
    logo: string | null;
    timezone: string;
    onboardingStatus: number;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

/**
 * Represents a franchise owner details record from the `franchise_owner_details` table.
 */
export interface IFranchiseOwnerDetails {
    id: number;
    uid: string;
    tenantUid: string;
    fullName: string;
    dateOfBirth: string | null;
    profilePhoto: string | null;
    mobileNumber: string;
    alternateNumber: string | null;
    email: string | null;
    residentialAddress: string | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

/**
 * Represents a franchise business details record from the `franchise_business_details` table.
 */
export interface IFranchiseBusinessDetails {
    id: number;
    uid: string;
    tenantUid: string;
    businessName: string;
    gstNumber: string;
    panNumber: string;
    cinNumber: string | null;
    msmeRegistrationNumber: string | null;
    tradeLicenseNumber: string | null;
    businessAddress: string | null;
    city: string | null;
    state: string | null;
    pinCode: string | null;
    outletName: string | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

/**
 * Request body shape for creating a franchise.
 */
export interface ICreateFranchiseRequest {
    franchise: {
        name: string;
        code: string;
        email?: string;
        mobile?: string;
        logo?: string;
    };
    owner: {
        fullName: string;
        dateOfBirth?: string;
        profilePhoto?: string;
        mobileNumber: string;
        alternateNumber?: string;
        email?: string;
        residentialAddress?: string;
    };
    business: {
        businessName: string;
        gstNumber: string;
        panNumber: string;
        cinNumber?: string;
        msmeRegistrationNumber?: string;
        tradeLicenseNumber?: string;
        businessAddress?: string;
        city?: string;
        state?: string;
        pinCode?: string;
        outletName?: string;
    };
}

/**
 * Request body shape for updating a franchise.
 */
export interface IUpdateFranchiseRequest {
    franchise?: {
        name?: string;
        email?: string;
        mobile?: string;
        logo?: string;
    };
    owner?: {
        fullName?: string;
        dateOfBirth?: string;
        profilePhoto?: string;
        mobileNumber?: string;
        alternateNumber?: string;
        email?: string;
        residentialAddress?: string;
    };
    business?: {
        businessName?: string;
        gstNumber?: string;
        panNumber?: string;
        cinNumber?: string;
        msmeRegistrationNumber?: string;
        tradeLicenseNumber?: string;
        businessAddress?: string;
        city?: string;
        state?: string;
        pinCode?: string;
        outletName?: string;
    };
}

/**
 * Response shape after successfully creating a franchise.
 */
export interface ICreateFranchiseResponse {
    tenantUid: string;
    franchiseName: string;
    franchiseCode: string;
    onboardingStatus: number;
    adminEmail?: string;
    adminPassword?: string;
}

/**
 * Safe franchise response for list/get operations.
 */
export interface IFranchiseSafe {
    uid: string;
    code: string;
    name: string;
    email: string | null;
    mobile: string | null;
    logo: string | null;
    onboardingStatus: number;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
}

/**
 * Full franchise detail response (tenant + owner + business).
 */
export interface IFranchiseDetail {
    franchise: IFranchiseSafe;
    owner: Omit<IFranchiseOwnerDetails, "id"> | null;
    business: Omit<IFranchiseBusinessDetails, "id"> | null;
}

/**
 * Pagination query for franchise list.
 */
export interface IFranchisePaginationQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: "active" | "deleted" | "all";
}

/**
 * Paginated response wrapper.
 */
export interface IPaginatedFranchiseResponse {
    data: IFranchiseSafe[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
