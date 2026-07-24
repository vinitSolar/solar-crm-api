export interface ISubsidyTracker {
    id: number;
    uid: string;
    tenantUid: string;
    projectUid: string;
    leadUid: string;
    subsidyUid: string | null;
    name: string | null;
    
    portalStatus: number;
    netMeterStatus: number;
    
    portalReferenceNumber: string | null;
    discomReferenceNumber: string | null;
    
    expectedSubsidyAmount: number | null;
    approvedSubsidyAmount: number | null;
    receivedSubsidyAmount: number | null;
    
    approvedDate: Date | null;
    disbursedDate: Date | null;
    
    remarks: string | null;
    
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface ICreateSubsidyTracker {
    projectUid: string;
    leadUid: string;
    name: string | null;
    subsidyUid?: string | null;
    expectedSubsidyAmount?: number | null;
}

export interface IUpdateSubsidyTracker {
    portalStatus?: number;
    netMeterStatus?: number;
    portalReferenceNumber?: string | null;
    discomReferenceNumber?: string | null;
    approvedSubsidyAmount?: number | null;
    receivedSubsidyAmount?: number | null;
    approvedDate?: Date | string | null;
    disbursedDate?: Date | string | null;
    remarks?: string | null;
}

export interface ISubsidyTrackerSafe extends Omit<ISubsidyTracker, "id" | "isDeleted" | "deletedBy"> {}

export interface IPaginationQuery {
    page?: number;
    limit?: number;
    search?: string;
    portalStatus?: number;
    netMeterStatus?: number;
    subsidyUid?: string;
}

export interface IPaginatedResponse<T> {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    data: T[];
}
