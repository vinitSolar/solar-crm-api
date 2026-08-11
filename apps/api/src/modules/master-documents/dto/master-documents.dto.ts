import type {
  IMasterDocumentType,
  IMasterDocumentTypeSafe,
  IMasterDocument,
  IMasterDocumentSafe,
  IDocumentAssociation,
  IDocumentAssociationSafe,
  IContextDocument,
  IGroupedContextDocuments,
} from "../interfaces/master-documents.interface.js";

// ============================================================
// Master Document Type DTOs
// ============================================================

export function toMasterDocumentTypeSafe(
  type: IMasterDocumentType,
): IMasterDocumentTypeSafe {
  return {
    uid: type.uid,
    name: type.name,
    category: type.category,
    description: type.description,
    allowedExtensions: type.allowedExtensions,
    allowMultiple: type.allowMultiple,
    isRequired: type.isRequired,
    applicableModules: type.applicableModules,
    sortOrder: type.sortOrder,
    isSystem: type.isSystem,
    isCommonForAllModules: type.isCommonForAllModules,
    isActive: type.isActive,
    isDeleted: type.isDeleted,
    createdAt: type.createdAt,
    updatedAt: type.updatedAt,
  };
}

// ============================================================
// Master Document DTOs
// ============================================================

export function toMasterDocumentSafe(
  doc: IMasterDocument,
): IMasterDocumentSafe {
  const safeDoc: IMasterDocumentSafe = {
    uid: doc.uid,
    documentTypeUid: doc.documentTypeUid,
    entityType: doc.entityType,
    entityUid: doc.entityUid,
    originalName: doc.originalName,
    fileUrl: doc.fileUrl,
    mimeType: doc.mimeType,
    fileSize: doc.fileSize,
    documentNumber: doc.documentNumber,
    remarks: doc.remarks,
    version: doc.version,
    isLatest: doc.isLatest,
    createdAt: doc.createdAt,
    createdBy: doc.createdBy,
  };
  if (doc.documentTypeName !== undefined)
    safeDoc.documentTypeName = doc.documentTypeName;
  if (doc.documentTypeCategory !== undefined)
    safeDoc.documentTypeCategory = doc.documentTypeCategory;
  return safeDoc;
}

// ============================================================
// Document Association DTOs
// ============================================================

export function toDocumentAssociationSafe(
  assoc: IDocumentAssociation,
): IDocumentAssociationSafe {
  return {
    uid: assoc.uid,
    masterDocumentUid: assoc.masterDocumentUid,
    module: assoc.module,
    contextUid: assoc.contextUid,
    remarks: assoc.remarks,
    createdAt: assoc.createdAt,
  };
}

// ============================================================
// Grouping Utility
// ============================================================

export function groupContextDocuments(
  docs: IContextDocument[],
): IGroupedContextDocuments[] {
  const grouped = new Map<string, IGroupedContextDocuments>();

  for (const doc of docs) {
    if (!grouped.has(doc.documentTypeUid)) {
      const group: IGroupedContextDocuments = {
        documentTypeUid: doc.documentTypeUid,
        isRequired: 0,
        allowMultiple: 0,
        files: [],
      };
      if (doc.documentTypeName !== undefined)
        group.documentTypeName = doc.documentTypeName;
      if (doc.documentTypeCategory !== undefined)
        group.documentTypeCategory = doc.documentTypeCategory;

      grouped.set(doc.documentTypeUid, group);
    }
    grouped.get(doc.documentTypeUid)!.files.push(doc);
  }

  return Array.from(grouped.values());
}
