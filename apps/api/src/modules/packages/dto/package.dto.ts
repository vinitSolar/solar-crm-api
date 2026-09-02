export interface PackageProductDTO {
    productUid: string;
    quantity: number;
    remarks?: string;
}

export interface PackageScopeOfWorkDTO {
    scopeOfWorkUid: string;
    sortOrder?: number;
}

export interface CreatePackageDTO {
    name: string;
    packageCode?: string;
    description?: string;
    capacityKw?: number;
    recomendedPrice: number;
    gst?: number;
    products: PackageProductDTO[];
    scopeOfWork?: PackageScopeOfWorkDTO[];
}

export interface UpdatePackageDTO {
    name?: string;
    packageCode?: string;
    description?: string;
    capacityKw?: number;
    recomendedPrice?: number;
    gst?: number;
    isActive?: number; // 0 or 1
    products?: PackageProductDTO[];
    scopeOfWork?: PackageScopeOfWorkDTO[];
}

export interface PackageResponseDTO {
    uid: string;
    name: string;
    packageCode: string;
    description: string | null;
    capacityKw: number | null;
    recomendedPrice: number;
    gst: number | null;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    products?: any[]; // Detailed products including joined fields
    scopeOfWork?: any[];
}
