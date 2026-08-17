// ============================================================
// Master Document Type Interfaces
// ============================================================

export interface IMasterDocumentType {
  id: string;
  uid: string;
  tenantUid: string | null;
  name: string;
  category: number;
  description: string | null;
  allowedExtensions: string;
  allowMultiple: number;
  isRequired: number;
  applicableModules: string[];
  sortOrder: number;
  isSystem: number;
  /**
   * If true (1), this document type is common across all applicable modules.
   * Uploading it once will make it available to all specified modules.
   */
  isCommonForAllModules: number;
  isActive: number;
  isDeleted: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
}

export interface IMasterDocumentTypeSafe {
  uid: string;
  name: string;
  category: number;
  description: string | null;
  allowedExtensions: string;
  allowMultiple: number;
  isRequired: number;
  applicableModules: string[];
  sortOrder: number;
  isSystem: number;
  isCommonForAllModules: number;
  isActive: number;
  isDeleted: number;
  createdAt: Date;
  updatedAt: Date;
  files?: IContextDocument[];
}

export interface ICreateMasterDocumentType {
  name: string;
  category?: number;
  description?: string;
  allowedExtensions?: string;
  allowMultiple?: number;
  isRequired?: number;
  applicableModules?: string[];
  sortOrder?: number;
  isCommonForAllModules?: number;
}

export interface IUpdateMasterDocumentType {
  name?: string;
  category?: number;
  description?: string;
  allowedExtensions?: string;
  allowMultiple?: number;
  isRequired?: number;
  applicableModules?: string[];
  sortOrder?: number;
  isCommonForAllModules?: number;
  isActive?: number;
}

// ============================================================
// Master Document Interfaces
// ============================================================

export type EntityType = "customer" | "lead" | "franchise" | "product" | "project";

export type ModuleType =
  | "site_survey"
  | "subsidy_tracker"
  | "project"
  | "franchise"
  | "product"
  | "lead"
  | "customer";

export interface IMasterDocument {
  id: string;
  uid: string;
  tenantUid: string;
  documentTypeUid: string;
  entityType: EntityType;
  entityUid: string;
  originalName: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  documentNumber: string | null;
  remarks: string | null;
  version: number;
  isLatest: number;
  parentDocumentUid: string | null;
  isActive: number;
  isDeleted: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  // Joined fields
  documentTypeName?: string;
  documentTypeCategory?: number;
}

export interface IMasterDocumentSafe {
  uid: string;
  documentTypeUid: string;
  documentTypeName?: string;
  documentTypeCategory?: number;
  entityType: EntityType;
  entityUid: string;
  originalName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  documentNumber: string | null;
  remarks: string | null;
  version: number;
  isLatest: number;
  createdAt: Date;
  createdBy: string | null;
}

// ============================================================
// Document Association Interfaces
// ============================================================

export interface IDocumentAssociation {
  id: string;
  uid: string;
  tenantUid: string;
  masterDocumentUid: string;
  module: ModuleType;
  contextUid: string;
  remarks: string | null;
  isActive: number;
  isDeleted: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
}

export interface IDocumentAssociationSafe {
  uid: string;
  masterDocumentUid: string;
  module: ModuleType;
  contextUid: string;
  remarks: string | null;
  createdAt: Date;
}

// ============================================================
// Request / Response Interfaces
// ============================================================

export interface IUploadDocumentRequest {
  documentTypeUid: string;
  entityType: EntityType;
  entityUid: string;
  module: ModuleType;
  contextUid: string;
  documentNumber?: string;
  remarks?: string;
}

export interface ILinkDocumentRequest {
  masterDocumentUid: string;
  module: ModuleType;
  contextUid: string;
  remarks?: string;
}

export interface IDocumentWithAssociations extends IMasterDocumentSafe {
  associations: IDocumentAssociationSafe[];
}

export interface IContextDocument extends IMasterDocumentSafe {
  associationUid: string;
  associationRemarks: string | null;
}

export interface IGroupedContextDocuments {
  documentTypeUid: string;
  documentTypeName?: string;
  documentTypeCategory?: number;
  isRequired: number;
  allowMultiple: number;
  files: IContextDocument[];
}

export interface IPaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "deleted" | "all";
  module?: string;
  category?: number;
  contextUid?: string;
  entityType?: EntityType;
  entityUid?: string;
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
