export interface ISurveyDocumentType {
    id: string;
    uid: string;
    tenantUid: string;
    name: string;
    description: string | null;
    isRequired: number; // 0 or 1
    allowMultiple: number; // 0 or 1
    sortOrder: number;
    isSystem: number; // 0 or 1
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface ISurveyDocumentTypeSafe {
    uid: string;
    name: string;
    description: string | null;
    isRequired: number;
    allowMultiple: number;
    sortOrder: number;
    isSystem: number;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateSurveyDocumentType {
    name: string;
    description?: string;
    isRequired?: number;
    allowMultiple?: number;
    sortOrder?: number;
}

export interface IUpdateSurveyDocumentType {
    name?: string;
    description?: string;
    isRequired?: number;
    allowMultiple?: number;
    sortOrder?: number;
}

export interface ISiteSurveyDocument {
    id: string;
    uid: string;
    tenantUid: string;
    siteSurveyUid: string;
    documentTypeUid: string;
    documentTypeName?: string | undefined; // Joined from document_types
    originalName: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number; // in DB it's BIGINT so might be parsed as string or number
    remarks: string | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface ISiteSurveyDocumentSafe {
    uid: string;
    siteSurveyUid: string;
    documentTypeUid: string;
    documentTypeName?: string | undefined;
    originalName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number | string;
    remarks: string | null;
    createdAt: Date;
}

export interface IUploadedFile {
    uid: string;
    originalName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number | string;
    remarks: string | null;
    createdAt: Date;
}

export interface IGroupedSurveyDocuments {
    documentTypeUid: string;
    documentTypeName?: string;
    files: IUploadedFile[];
}

export interface ISurveyDocumentPaginationQuery {
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
