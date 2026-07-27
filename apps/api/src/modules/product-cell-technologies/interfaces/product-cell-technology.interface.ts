export interface IProductCellTechnology {
    id: string; // BIGINT mapping
    uid: string;
    name: string;
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

export interface ICreateProductCellTechnology {
    name: string;
    description?: string;
    sortOrder?: number;
}

export interface IUpdateProductCellTechnology {
    name?: string;
    description?: string | null;
    sortOrder?: number;
    isActive?: number;
}

export interface IPaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
