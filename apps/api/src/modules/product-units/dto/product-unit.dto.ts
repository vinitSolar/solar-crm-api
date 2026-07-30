import type { IProductUnit } from "../interfaces/product-unit.interface.js";

export interface IProductUnitSafe {
    uid: string;
    name: string;
    shortName: string | null;
    description: string | null;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

export const toProductUnitSafe = (unit: IProductUnit): IProductUnitSafe => {
    const u = unit as any;
    return {
        uid: unit.uid,
        name: unit.name,
        shortName: unit.shortName !== undefined ? unit.shortName : (u.short_name !== undefined ? u.short_name : null),
        description: unit.description,
        sortOrder: unit.sortOrder !== undefined ? unit.sortOrder : (u.sort_order !== undefined ? u.sort_order : 0),
        createdAt: unit.createdAt || u.created_at,
        updatedAt: unit.updatedAt || u.updated_at,
    };
};

export interface IProductUnitDropdown {
    uid: string;
    name: string;
    shortName: string | null;
}

export const toProductUnitDropdown = (unit: IProductUnit): IProductUnitDropdown => {
    const u = unit as any;
    return {
        uid: unit.uid,
        name: unit.name,
        shortName: unit.shortName !== undefined ? unit.shortName : (u.short_name !== undefined ? u.short_name : null),
    };
};
