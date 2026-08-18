import type { IPaginationQuery } from "./lead.interface.js";

export interface ILeadNote {
    id: number;
    uid: string;
    tenantUid: string;
    leadUid: string;
    note: string;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    updatedBy?: string;
    deletedBy?: string;
}

export interface ICreateLeadNote {
    note: string;
}

export interface IUpdateLeadNote {
    note: string;
}

export interface ILeadNoteSafe {
    uid: string;
    leadUid: string;
    note: string;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    updatedBy?: string;
    deletedBy?: string;
}

export interface ILeadNotePaginationQuery extends IPaginationQuery {
    leadUid: string;
}
