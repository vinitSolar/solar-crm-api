import type { IProductCategory } from "../interfaces/product-category.interface.js";

export interface IProductCategorySafe {
    uid: string;
    name: string;
    description: string | null;
    image: string | null;
    sortOrder: number;
    isDynamic: boolean;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export const toProductCategorySafe = (category: IProductCategory): IProductCategorySafe => {
    return {
        uid: category.uid,
        name: category.name,
        description: category.description,
        image: category.image,
        sortOrder: category.sortOrder,
        isDynamic: (category.isDynamic === 1 || (category as any).is_dynamic === 1),
        isActive: category.isActive === 1,
        isDeleted: category.isDeleted === 1,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
    };
};

export interface IProductCategoryDropdown {
    uid: string;
    name: string;
    isDynamic?: boolean;
}

export const toProductCategoryDropdown = (category: IProductCategory): IProductCategoryDropdown => {
    return {
        uid: category.uid,
        name: category.name,
        isDynamic: (category.isDynamic === 1 || (category as any).is_dynamic === 1),
    };
};
