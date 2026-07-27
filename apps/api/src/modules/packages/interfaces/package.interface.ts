export interface IPackage {
    id: number;
    uid: string;
    tenantUid: string;
    name: string;
    packageCode: string;
    description: string | null;
    capacityKw: number | null;
    price: number;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface IPackageProduct {
    id: number;
    uid: string;
    packageUid: string;
    productUid: string;
    quantity: number;
    unitPriceSnapshot: number;
    remarks: string | null;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}
