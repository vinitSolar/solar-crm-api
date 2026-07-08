import type { ISurveyDocumentType, ISurveyDocumentTypeSafe, ISiteSurveyDocument, ISiteSurveyDocumentSafe } from "../interfaces/survey-documents.interface.js";

export function toSurveyDocumentTypeSafe(type: ISurveyDocumentType): ISurveyDocumentTypeSafe {
    return {
        uid: type.uid,
        name: type.name,
        description: type.description,
        isRequired: type.isRequired,
        allowMultiple: type.allowMultiple,
        sortOrder: type.sortOrder,
        isSystem: type.isSystem,
        isActive: type.isActive,
        isDeleted: type.isDeleted,
        createdAt: type.createdAt,
        updatedAt: type.updatedAt,
    };
}

export function toSiteSurveyDocumentSafe(doc: ISiteSurveyDocument): ISiteSurveyDocumentSafe {
    return {
        uid: doc.uid,
        siteSurveyUid: doc.siteSurveyUid,
        documentTypeUid: doc.documentTypeUid,
        documentTypeName: doc.documentTypeName,
        originalName: doc.originalName,
        fileUrl: doc.fileUrl,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        remarks: doc.remarks,
        createdAt: doc.createdAt,
    };
}

export function groupSurveyDocuments(docs: ISiteSurveyDocumentSafe[]): import("../interfaces/survey-documents.interface.js").IGroupedSurveyDocuments[] {
    const grouped = new Map<string, import("../interfaces/survey-documents.interface.js").IGroupedSurveyDocuments>();

    for (const doc of docs) {
        if (!grouped.has(doc.documentTypeUid)) {
            grouped.set(doc.documentTypeUid, {
                documentTypeUid: doc.documentTypeUid,
                documentTypeName: doc.documentTypeName,
                files: []
            });
        }
        
        grouped.get(doc.documentTypeUid)!.files.push({
            uid: doc.uid,
            originalName: doc.originalName,
            fileUrl: doc.fileUrl,
            mimeType: doc.mimeType,
            fileSize: doc.fileSize,
            remarks: doc.remarks,
            createdAt: doc.createdAt
        });
    }

    return Array.from(grouped.values());
}
