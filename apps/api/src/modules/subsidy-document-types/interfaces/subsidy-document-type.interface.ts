/**
 * Represents a subsidy document type record from the database.
 */
export interface ISubsidyDocumentType {
    id: number;
    uid: string;
    name: string;
    description: string | null;
    allow_multiple: number;
    is_required: number;
    sort_order: number;
    is_active: number;
    is_deleted: number;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    created_by: string | null;
    updated_by: string | null;
    deleted_by: string | null;
}

/**
 * Sanitized subsidy document type object returned in API responses.
 */
export interface ISubsidyDocumentTypeSafe {
    uid: string;
    name: string;
    description: string | null;
    allowMultiple: boolean;
    isRequired: boolean;
    sortOrder: number;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * DTO for creating a new subsidy document type.
 */
export interface ICreateSubsidyDocumentType {
    name: string;
    description?: string | null;
    allowMultiple?: boolean;
    isRequired?: boolean;
    sortOrder?: number;
}

/**
 * DTO for updating an existing subsidy document type.
 */
export interface IUpdateSubsidyDocumentType {
    name?: string;
    description?: string | null;
    allowMultiple?: boolean;
    isRequired?: boolean;
    sortOrder?: number;
    isActive?: boolean;
}

/**
 * Dropdown representation for subsidy document types.
 */
export interface ISubsidyDocumentTypeDropdown {
    uid: string;
    name: string;
    allowMultiple: boolean;
    isRequired: boolean;
    sortOrder: number;
}
