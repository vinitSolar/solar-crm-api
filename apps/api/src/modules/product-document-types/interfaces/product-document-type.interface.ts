export interface IProductDocumentType {
    id: string;
    uid: string;
    tenantUid: string;
    name: string;
    description: string | null;
    allowedExtensions: string;
    allowMultiple: number; // 0 or 1
    isRequired: number; // 0 or 1
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface IProductDocumentTypeSafe {
    uid: string;
    name: string;
    description: string | null;
    allowedExtensions: string;
    allowMultiple: number;
    isRequired: number;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateProductDocumentType {
    name: string;
    description?: string;
    allowedExtensions?: string;
    allowMultiple?: number;
    isRequired?: number;
}

export interface IUpdateProductDocumentType {
    name?: string;
    description?: string;
    allowedExtensions?: string;
    allowMultiple?: number;
    isRequired?: number;
    isActive?: number;
}

export interface IProductDocumentTypeDropdown {
    uid: string;
    name: string;
    description: string | null;
    allowedExtensions: string;
    allowMultiple: number; // 0 or 1
    isRequired: number; // 0 or 1
}
