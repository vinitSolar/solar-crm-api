export interface IProduct {
    id: string;
    uid: string;
    categoryUid: string;
    brandUid: string;
    unitUid: string;
    name: string;
    productCode: string;
    pricePerUnit: string | number;
    gstPercentage: string | number;
    capacity: string | null;
    capacityUnit: string | null;
    warranty: string | null;
    description: string | null;
    isActive: number;
    isDeleted: number;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface ICreateProductRequest {
    categoryUid: string;
    brandUid: string;
    unitUid: string;
    name: string;
    productCode: string;
    pricePerUnit: number;
    gstPercentage: number;
    capacity?: string;
    capacityUnit?: string;
    warranty?: string;
    description?: string;
}

export interface IUpdateProductRequest {
    categoryUid?: string;
    brandUid?: string;
    unitUid?: string;
    name?: string;
    productCode?: string;
    pricePerUnit?: number;
    gstPercentage?: number;
    capacity?: string;
    capacityUnit?: string;
    warranty?: string;
    description?: string;
    isActive?: number;
}

export interface IProductPaginationQuery {
    page: number;
    limit: number;
    search?: string;
    categoryUid?: string;
    brandUid?: string;
    status?: "active" | "deleted" | "all";
}
