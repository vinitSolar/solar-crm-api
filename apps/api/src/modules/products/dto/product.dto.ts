import type { IProduct } from "../interfaces/product.interface.js";
import type { IProductDocument } from "../repositories/product-document.repository.js";

export interface IProductDocumentSafe {
    uid: string;
    productUid: string;
    documentTypeUid: string;
    documentTypeName?: string | undefined;
    originalFileName: string;
    storedFileName: string;
    filePath: string;
    mimeType: string;
    fileSize: number;
    createdAt: Date;
}

export const toProductDocumentSafe = (doc: IProductDocument): IProductDocumentSafe => {
    return {
        uid: doc.uid,
        productUid: doc.productUid,
        documentTypeUid: doc.documentTypeUid,
        documentTypeName: doc.documentTypeName,
        originalFileName: doc.originalFileName,
        storedFileName: doc.storedFileName,
        filePath: doc.filePath,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        createdAt: doc.createdAt,
    };
};

export interface IProductSpecificationValueSafe {
    specificationUid: string;
    value: string;
    specificationName?: string | undefined;
}

export interface IProductSafe {
    uid: string;
    categoryUid: string;
    brandUid: string;
    unitUid: string;
    name: string;
    productCode: string;
    pricePerUnit: number;
    gstPercentage: number;
    capacity: string | null;
    capacityUnit: string | null;
    warranty: string | null;
    description: string | null;
    modelNumber: string | null;
    images: string[];
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    brandName?: string | undefined;
    categoryName?: string | undefined;
    unitName?: string | undefined;
    documents?: IProductDocumentSafe[];
    specifications?: IProductSpecificationValueSafe[];
}

export const toProductSafe = (product: IProduct, documents?: IProductDocument[]): IProductSafe => {
    return {
        uid: product.uid,
        categoryUid: product.categoryUid,
        brandUid: product.brandUid,
        unitUid: product.unitUid,
        name: product.name,
        productCode: product.productCode,
        pricePerUnit: Number(product.pricePerUnit),
        gstPercentage: Number(product.gstPercentage),
        capacity: product.capacity,
        capacityUnit: product.capacityUnit,
        warranty: product.warranty,
        description: product.description,
        modelNumber: product.modelNumber,
        images: product.images || [],
        isActive: product.isActive === 1,
        isDeleted: product.isDeleted === 1,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        brandName: product.brandName,
        categoryName: product.categoryName,
        unitName: product.unitName,
        documents: documents ? documents.map(toProductDocumentSafe) : [],
        specifications: product.specifications?.map(s => ({
            specificationUid: s.specificationUid,
            value: s.value,
            specificationName: s.specificationName,
        })) || [],
    };
};

export interface IProductDropdown {
    uid: string;
    name: string;
    productCode: string;
    pricePerUnit: number;
    gstPercentage: number;
    unitUid: string;
    modelNumber: string | null;
    brandName?: string | undefined;
    categoryName?: string | undefined;
    unitName?: string | undefined;
}

export const toProductDropdown = (product: IProduct): IProductDropdown => {
    return {
        uid: product.uid,
        name: product.name,
        productCode: product.productCode,
        pricePerUnit: Number(product.pricePerUnit),
        gstPercentage: Number(product.gstPercentage),
        unitUid: product.unitUid,
        modelNumber: product.modelNumber,
        brandName: product.brandName,
        categoryName: product.categoryName,
        unitName: product.unitName,
    };
};
