export interface PackageProductDTO {
    productUid: string;
    quantity: number;
    remarks?: string;
}

export interface CreatePackageDTO {
    name: string;
    packageCode: string;
    description?: string;
    capacityKw?: number;
    price: number;
    products: PackageProductDTO[];
}

export interface UpdatePackageDTO {
    name?: string;
    packageCode?: string;
    description?: string;
    capacityKw?: number;
    price?: number;
    isActive?: number; // 0 or 1
    products?: PackageProductDTO[];
}

export interface PackageResponseDTO {
    uid: string;
    name: string;
    packageCode: string;
    description: string | null;
    capacityKw: number | null;
    price: number;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    products?: any[]; // Detailed products including joined fields
}
