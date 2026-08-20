export interface INote {
    id: number;
    uid: string;
    tenantUid: string;
    module: string;
    moduleUid: string;
    note: string;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string | null;
    updatedBy?: string | null;
    deletedBy?: string | null;
}

export interface ICreateNote {
    module: string;
    moduleUid: string;
    note: string;
}

export interface IUpdateNote {
    note: string;
}

export interface INoteSafe {
    uid: string;
    module: string;
    moduleUid: string;
    note: string;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string | null;
    updatedBy?: string | null;
    deletedBy?: string | null;
}

export interface IPaginationQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: "active" | "deleted" | "all";
    module?: string;
}

export interface INotePaginationQuery extends IPaginationQuery {
    module: string;
    moduleUid: string;
}
