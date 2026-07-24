export interface IProductCategory {
    id: string;
    uid: string;
    name: string;
    description: string | null;
    image: string | null;
    sortOrder: number;
    isDynamic: number;
    isActive: number;
    isDeleted: number;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface ICreateProductCategoryRequest {
    name: string;
    description?: string;
    image?: string;
    sortOrder?: number;
}

export interface IUpdateProductCategoryRequest {
    name?: string;
    description?: string;
    image?: string;
    sortOrder?: number;
    isActive?: number;
}

export interface IProductCategoryPaginationQuery {
    page: number;
    limit: number;
    search?: string;
    status?: "active" | "deleted" | "all";
}
