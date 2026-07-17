export interface IAuditLog {
    id: number;
    uid: string;
    tenantUid: string | null;
    module: string;
    recordUid: string;
    action: string;
    message: string;
    metadata: Record<string, any> | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    createdBy: string | null;
}

export interface IAuditLogPayload {
    tenantUid?: string | null | undefined;
    module: string;
    recordUid: string;
    action: string;
    message: string;
    metadata?: Record<string, any> | null | undefined;
    ipAddress?: string | null | undefined;
    userAgent?: string | null | undefined;
    createdBy?: string | null | undefined;
}

export interface IAuditLogUpdatePayload {
    tenantUid?: string | null | undefined;
    module: string;
    recordUid: string;
    oldRecord: Record<string, any>;
    newRecord: Record<string, any>;
    moduleNameLabel?: string | undefined;
    actionByName?: string | undefined;
    ipAddress?: string | null | undefined;
    userAgent?: string | null | undefined;
    createdBy?: string | null | undefined;
    excludeFields?: string[] | undefined;
    fieldLabels?: Record<string, string> | undefined;
}

export interface IAuditLogFilter {
    module?: string;
    recordUid?: string;
    tenantUid?: string;
    createdBy?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
}

export interface IAuditLogListRequest {
    page?: number;
    limit?: number;
    search?: string;
    filters?: IAuditLogFilter;
}
