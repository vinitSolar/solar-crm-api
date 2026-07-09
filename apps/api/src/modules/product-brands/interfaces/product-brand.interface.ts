export interface IProductBrand {
    id: string;
    uid: string;
    name: string;
    description: string | null;
    logo: string | null;
    sortOrder: number;
    isActive: number;
    isDeleted: number;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface ICreateProductBrandRequest {
    name: string;
    description?: string;
    logo?: string;
    sortOrder?: number;
}

export interface IUpdateProductBrandRequest {
    name?: string;
    description?: string;
    logo?: string;
    sortOrder?: number;
    isActive?: number;
}

export interface IProductBrandPaginationQuery {
    page: number;
    limit: number;
    search?: string;
    status?: "active" | "deleted" | "all";
}
