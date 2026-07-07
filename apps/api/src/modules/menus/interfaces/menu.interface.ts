export interface ICreateMenuRequest {
    name: string;
    code: string;
    route?: string;
    icon?: string;
    parentUid?: string;
    sortOrder?: number;
}

export interface IUpdateMenuRequest {
    name?: string;
    code?: string;
    route?: string;
    icon?: string;
    parentUid?: string;
    sortOrder?: number;
    isActive?: number;
}

export interface IMenuPaginationQuery {
    page: number;
    limit: number;
    search?: string;
    status?: "active" | "deleted" | "all";
}
