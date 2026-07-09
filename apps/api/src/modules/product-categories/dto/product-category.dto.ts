import type { IProductCategory } from "../interfaces/product-category.interface.js";

export interface IProductCategorySafe {
    uid: string;
    name: string;
    description: string | null;
    image: string | null;
    sortOrder: number;
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
        isActive: category.isActive === 1,
        isDeleted: category.isDeleted === 1,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
    };
};

export interface IProductCategoryDropdown {
    uid: string;
    name: string;
}

export const toProductCategoryDropdown = (category: IProductCategory): IProductCategoryDropdown => {
    return {
        uid: category.uid,
        name: category.name,
    };
};
