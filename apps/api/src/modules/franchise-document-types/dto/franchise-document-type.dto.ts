import type { IFranchiseDocumentType, IFranchiseDocumentTypeDropdown, IFranchiseDocumentTypeSafe } from "../interfaces/franchise-document-type.interface.js";

export function toFranchiseDocumentTypeSafe(type: IFranchiseDocumentType): IFranchiseDocumentTypeSafe {
    return {
        uid: type.uid,
        name: type.name,
        description: type.description,
        allowMultiple: type.allowMultiple,
        isRequired: type.isRequired,
        sortOrder: type.sortOrder,
        isActive: type.isActive,
        isDeleted: type.isDeleted,
        createdAt: type.createdAt,
        updatedAt: type.updatedAt,
    };
}

export function toFranchiseDocumentTypeDropdown(type: IFranchiseDocumentType): IFranchiseDocumentTypeDropdown {
    return {
        uid: type.uid,
        name: type.name,
        description: type.description,
        allowMultiple: type.allowMultiple,
        isRequired: type.isRequired,
        sortOrder: type.sortOrder,
    };
}
