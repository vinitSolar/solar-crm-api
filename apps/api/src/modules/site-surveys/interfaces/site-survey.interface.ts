export interface ISiteSurvey {
    id: string;
    uid: string;
    tenantUid: string;
    leadUid: string;
    leadName?: string | undefined; // from join
    assignedTo: string;
    assignedUserName?: string | undefined; // from join
    scheduledAt: Date;
    status: number; // 0 = Scheduled, 1 = Completed, 2 = Cancelled, 3 = Rescheduled
    remarks: string | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface ICreateSiteSurvey {
    leadUid: string;
    assignedTo: string;
    scheduledAt: Date | string;
    remarks?: string;
}

export interface IUpdateSiteSurvey {
    assignedTo?: string;
    scheduledAt?: Date | string;
    status?: number;
    remarks?: string;
}

export interface ISiteSurveySafe {
    uid: string;
    leadUid: string;
    leadName?: string | undefined;
    assignedTo: string;
    assignedUserName?: string | undefined;
    scheduledAt: Date;
    status: number;
    remarks: string | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IPaginationQuery {
    page?: number;
    limit?: number;
    search?: string;
    surveyStatus?: number;
    status?: "active" | "deleted" | "all"; // active, deleted, all
    scheduledDate?: string;
    fromDate?: string;
    toDate?: string;
    assignedTo?: string;
    leadUid?: string;
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
