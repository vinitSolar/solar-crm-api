export interface IProduct {
    id: string;
    uid: string;
    categoryUid: string;
    brandUid: string;
    unitUid: string;
    name: string;
    productCode: string;
    pricePerUnit: string | number;
    gstPercentage: string | number;
    capacity: string | null;
    capacityUnit: string | null;
    warranty: string | null;
    description: string | null;
    modelNumber: string | null;
    images: string[];
    isActive: number;
    isDeleted: number;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
    brandName?: string | undefined;
    categoryName?: string | undefined;
    unitName?: string | undefined;
    height: string | number | null;
    width: string | number | null;
    maxPower: string | number | null;
    palletLength: string | number | null;
    palletWidth: string | number | null;
    palletHeight: string | number | null;
    palletWeight: string | number | null;
    palletDimension: string | null;
    quantityPerPallet: number | null;
    cellTechnology: string | null;
}

export interface ICreateProductRequest {
    categoryUid: string;
    brandUid: string;
    unitUid: string;
    name: string;
    productCode: string;
    pricePerUnit: number;
    gstPercentage: number;
    capacity?: string | undefined;
    capacityUnit?: string | undefined;
    warranty?: string | undefined;
    description?: string | undefined;
    modelNumber?: string | undefined;
    images?: string[] | undefined;
    documentTypeUids?: string[] | undefined;
    height?: number | null | undefined;
    width?: number | null | undefined;
    maxPower?: number | null | undefined;
    palletLength?: number | null | undefined;
    palletWidth?: number | null | undefined;
    palletHeight?: number | null | undefined;
    palletWeight?: number | null | undefined;
    palletDimension?: string | null | undefined;
    quantityPerPallet?: number | null | undefined;
    cellTechnology?: string | null | undefined;
}

export interface IUpdateProductRequest {
    categoryUid?: string | undefined;
    brandUid?: string | undefined;
    unitUid?: string | undefined;
    name?: string | undefined;
    productCode?: string | undefined;
    pricePerUnit?: number | undefined;
    gstPercentage?: number | undefined;
    capacity?: string | null | undefined;
    capacityUnit?: string | null | undefined;
    warranty?: string | null | undefined;
    description?: string | null | undefined;
    modelNumber?: string | null | undefined;
    images?: string[] | undefined;
    existingImages?: string[] | undefined;
    isActive?: number | undefined;
    deleteDocumentUids?: string[] | undefined;
    documentTypeUids?: string[] | undefined;
    height?: number | null | undefined;
    width?: number | null | undefined;
    maxPower?: number | null | undefined;
    palletLength?: number | null | undefined;
    palletWidth?: number | null | undefined;
    palletHeight?: number | null | undefined;
    palletWeight?: number | null | undefined;
    palletDimension?: string | null | undefined;
    quantityPerPallet?: number | null | undefined;
    cellTechnology?: string | null | undefined;
}

export interface IProductPaginationQuery {
    page: number;
    limit: number;
    search?: string;
    categoryUid?: string;
    brandUid?: string;
    status?: "active" | "deleted" | "all";
}
