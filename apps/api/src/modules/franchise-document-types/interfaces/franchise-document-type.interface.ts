export interface IFranchiseDocumentType {
    id: string;
    uid: string;
    tenantUid: string;
    name: string;
    description: string | null;
    allowMultiple: number; // 0 or 1
    isRequired: number; // 0 or 1
    sortOrder: number;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface IFranchiseDocumentTypeSafe {
    uid: string;
    name: string;
    description: string | null;
    allowMultiple: number;
    isRequired: number;
    sortOrder: number;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateFranchiseDocumentType {
    name: string;
    description?: string;
    allowMultiple?: number;
    isRequired?: number;
    sortOrder?: number;
}

export interface IUpdateFranchiseDocumentType {
    name?: string;
    description?: string;
    allowMultiple?: number;
    isRequired?: number;
    sortOrder?: number;
    isActive?: number;
}

export interface IFranchiseDocumentTypeDropdown {
    uid: string;
    name: string;
    description: string | null;
    allowMultiple: number;
    isRequired: number;
    sortOrder: number;
}
