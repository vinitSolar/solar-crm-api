import type { IProductBrand } from "../interfaces/product-brand.interface.js";

export interface IProductBrandSafe {
    uid: string;
    name: string;
    description: string | null;
    logo: string | null;
    sortOrder: number;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export const toProductBrandSafe = (brand: IProductBrand): IProductBrandSafe => {
    return {
        uid: brand.uid,
        name: brand.name,
        description: brand.description,
        logo: brand.logo,
        sortOrder: brand.sortOrder,
        isActive: brand.isActive === 1,
        isDeleted: brand.isDeleted === 1,
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt,
    };
};

export interface IProductBrandDropdown {
    uid: string;
    name: string;
}

export const toProductBrandDropdown = (brand: IProductBrand): IProductBrandDropdown => {
    return {
        uid: brand.uid,
        name: brand.name,
    };
};
