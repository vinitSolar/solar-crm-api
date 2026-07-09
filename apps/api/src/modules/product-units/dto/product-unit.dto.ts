import type { IProductUnit } from "../interfaces/product-unit.interface.js";

export interface IProductUnitSafe {
    uid: string;
    name: string;
    shortName: string | null;
    description: string | null;
    sortOrder: number;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export const toProductUnitSafe = (unit: IProductUnit): IProductUnitSafe => {
    return {
        uid: unit.uid,
        name: unit.name,
        shortName: unit.shortName,
        description: unit.description,
        sortOrder: unit.sortOrder,
        isActive: unit.isActive === 1,
        isDeleted: unit.isDeleted === 1,
        createdAt: unit.createdAt,
        updatedAt: unit.updatedAt,
    };
};

export interface IProductUnitDropdown {
    uid: string;
    name: string;
    shortName: string | null;
}

export const toProductUnitDropdown = (unit: IProductUnit): IProductUnitDropdown => {
    return {
        uid: unit.uid,
        name: unit.name,
        shortName: unit.shortName,
    };
};
