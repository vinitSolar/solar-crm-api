export interface IRole {
    id: number;
    uid: string;
    tenant_uid: string;
    name: string;
    description: string | null;
    is_system: number;
    is_active: number;
    is_deleted: number;
    created_at: Date;
    updated_at: Date;
    created_by: string | null;
    updated_by: string | null;
    deleted_by: string | null;
}

export interface IRoleSafe {
    uid: string;
    name: string;
    description: string | null;
    isSystem: number;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
}

export interface ICreateRoleRequest {
    name: string;
    description?: string;
}

export interface IUpdateRoleRequest {
    name?: string;
    description?: string;
    isActive?: number;
}

export interface IPaginationQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: "active" | "deleted" | "all";
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
