export interface ILeadSource {
    id: string;
    uid: string;
    tenantUid: string;
    name: string;
    color: string | null;
    sortOrder: number;
    isDefault: number;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface ILeadStatus {
    id: string;
    uid: string;
    tenantUid: string;
    name: string;
    color: string | null;
    sortOrder: number;
    isDefault: number;
    isClosed: number;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface ILead {
    id: string;
    uid: string;
    tenantUid: string;
    leadNumber: string;
    firstName: string;
    lastName: string | null;
    mobileNumber: string;
    alternateNumber: string | null;
    email: string | null;
    address: string | null;
    state: string;
    city: string;
    pinCode: string | null;
    monthlyBillAmount: number | null;
    systemSize: number | null;
    followUpDate: Date | null;
    leadSourceUid: string;
    sourceName?: string | undefined;
    sourceColor?: string | null | undefined;
    sourceSortOrder?: number | undefined;
    sourceIsDefault?: number | undefined;
    sourceIsActive?: number | undefined;
    sourceIsDeleted?: number | undefined;
    statusUid: string;
    statusName?: string | undefined;
    statusColor?: string | null | undefined;
    statusSortOrder?: number | undefined;
    statusIsDefault?: number | undefined;
    statusIsClosed?: number | undefined;
    statusIsActive?: number | undefined;
    statusIsDeleted?: number | undefined;
    assignedTo: string | null;
    assignedUserName?: string | null | undefined;
    remarks: string | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface ICreateLeadSource {
    name: string;
    color?: string;
    sortOrder?: number;
    isDefault?: number;
}

export interface IUpdateLeadSource extends Partial<ICreateLeadSource> {}

export interface ICreateLeadStatus {
    name: string;
    color?: string;
    sortOrder?: number;
    isDefault?: number;
    isClosed?: number;
}

export interface IUpdateLeadStatus extends Partial<ICreateLeadStatus> {}

export interface ICreateLead {
    leadNumber?: string;
    firstName: string;
    lastName: string;
    mobileNumber: string;
    alternateNumber?: string;
    email?: string;
    address: string;
    state: string;
    city: string;
    pinCode: string;
    monthlyBillAmount?: number;
    systemSize: number;
    followUpDate?: Date | string;
    leadSourceUid?: string;
    statusUid?: string;
    assignedTo?: string;
    remarks?: string;
}

export interface IUpdateLead extends Partial<ICreateLead> {}

export interface ILeadSafe {
    uid: string;
    leadNumber: string;
    firstName: string;
    lastName: string | null;
    mobileNumber: string;
    alternateNumber: string | null;
    email: string | null;
    address: string | null;
    state: string;
    city: string;
    pinCode: string | null;
    monthlyBillAmount: number | null;
    systemSize: number | null;
    followUpDate: Date | null;
    leadSourceUid: string;
    sourceName?: string | undefined;
    statusUid: string;
    statusName?: string | undefined;
    assignedTo: string | null;
    assignedUserName?: string | null | undefined;
    remarks: string | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    leadSource?: ILeadSourceSafe | null;
    leadStatus?: ILeadStatusSafe | null;
}

export interface ILeadSourceSafe {
    uid: string;
    name: string;
    color: string | null;
    sortOrder: number;
    isDefault: number;
    isActive: number;
    isDeleted: number;
}

export interface ILeadStatusSafe {
    uid: string;
    name: string;
    color: string | null;
    sortOrder: number;
    isDefault: number;
    isClosed: number;
    isActive: number;
    isDeleted: number;
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
