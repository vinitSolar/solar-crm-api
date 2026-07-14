import type { IProductDocumentType, IProductDocumentTypeDropdown, IProductDocumentTypeSafe } from "../interfaces/product-document-type.interface.js";

export function toProductDocumentTypeDropdown(type: IProductDocumentType): IProductDocumentTypeDropdown {
    return {
        uid: type.uid,
        name: type.name,
        description: type.description,
        allowedExtensions: type.allowedExtensions,
        allowMultiple: type.allowMultiple,
        isRequired: type.isRequired,
    };
}

export function toProductDocumentTypeSafe(type: IProductDocumentType): IProductDocumentTypeSafe {
    return {
        uid: type.uid,
        name: type.name,
        description: type.description,
        allowedExtensions: type.allowedExtensions,
        allowMultiple: type.allowMultiple,
        isRequired: type.isRequired,
        isActive: type.isActive,
        isDeleted: type.isDeleted,
        createdAt: type.createdAt,
        updatedAt: type.updatedAt,
    };
}
