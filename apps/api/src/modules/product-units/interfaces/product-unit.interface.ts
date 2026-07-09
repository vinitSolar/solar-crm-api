export interface IProductUnit {
    id: string;
    uid: string;
    name: string;
    shortName: string | null;
    description: string | null;
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

export interface ICreateProductUnitRequest {
    name: string;
    shortName?: string;
    description?: string;
    sortOrder?: number;
}

export interface IUpdateProductUnitRequest {
    name?: string;
    shortName?: string;
    description?: string;
    sortOrder?: number;
    isActive?: number;
}

export interface IProductUnitPaginationQuery {
    page: number;
    limit: number;
    search?: string;
    status?: "active" | "deleted" | "all";
}
