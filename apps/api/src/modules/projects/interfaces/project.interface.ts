export interface IProjectStatus {
    id: string;
    uid: string;
    tenantUid: string;
    name: string;
    color: string | null;
    sortOrder: number;
    isDefault: number;
    isClosed: number;
    description: string | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface IProject {
    id: string;
    uid: string;
    tenantUid: string;
    leadUid: string;
    quotationUid: string;
    projectNumber: string;
    projectName: string;
    projectStatusUid: string;
    projectManagerUid: string | null;
    projectDate: Date | null;
    remarks: string | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
    
    // joined fields
    statusName?: string;
    statusColor?: string | null;
    statusSortOrder?: number;
    statusIsClosed?: number;
    projectManagerName?: string | null;
    customerFirstName?: string;
    customerLastName?: string | null;
    customerMobileNumber?: string;
}

export interface ICreateProjectStatus {
    name: string;
    color?: string;
    sortOrder?: number;
    isDefault?: number;
    isClosed?: number;
    description?: string;
}

export interface IUpdateProjectStatus extends Partial<ICreateProjectStatus> {}

export interface ICreateProject {
    quotationUid: string;
    projectName: string;
    projectManagerUid?: string;
    projectDate?: Date | string;
    remarks?: string;
}

export interface IUpdateProject {
    projectName?: string;
    projectStatusUid?: string;
    projectManagerUid?: string;
    projectDate?: Date | string;
    remarks?: string;
}

export interface IProjectStatusSafe {
    uid: string;
    name: string;
    color: string | null;
    sortOrder: number;
    isDefault: number;
    isClosed: number;
    description: string | null;
    isActive: number;
    isDeleted: number;
}

export interface IProjectSafe {
    uid: string;
    leadUid: string;
    quotationUid: string;
    projectNumber: string;
    projectName: string;
    projectStatusUid: string;
    projectManagerUid: string | null;
    projectDate: Date | null;
    remarks: string | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    
    // joined info (can be nested or flat, flat is fine based on ILeadSafe pattern, let's nest if we have full objects or flat if just few fields)
    projectStatus?: IProjectStatusSafe | null;
    projectManagerName?: string | null;
    customerName?: string | null;
    customerMobileNumber?: string | null;
}

export interface IProjectDetail extends IProjectSafe {
    leadSummary?: any; // To be populated by service
    quotationSummary?: any; // To be populated by service
}

export interface IPaginationQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: "active" | "deleted" | "all";
    projectStatusUid?: string;
    projectManagerUid?: string;
    startDate?: string;
    endDate?: string;
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
