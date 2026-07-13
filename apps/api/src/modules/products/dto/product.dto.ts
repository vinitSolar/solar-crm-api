import type { IProduct } from "../interfaces/product.interface.js";

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
}

export const toProductSafe = (product: IProduct): IProductSafe => {
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
    };
};


