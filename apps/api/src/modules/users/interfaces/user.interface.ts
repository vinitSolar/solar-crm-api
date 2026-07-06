export interface IUser {
    id: number;
    uid: string;
    tenantUid: string;
    roleUid: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    password?: string;
    lastLogin: Date | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
    // Joined fields
    roleName?: string;
}

export interface ICreateUserRequest {
    roleUid: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export interface IUpdateUserRequest {
    roleUid?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    isActive?: number;
}

export interface IPaginationQuery {
    page: number;
    limit: number;
    search?: string;
    status?: "active" | "deleted" | "all";
}

export interface IUserListResponse {
    users: Partial<IUser>[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
