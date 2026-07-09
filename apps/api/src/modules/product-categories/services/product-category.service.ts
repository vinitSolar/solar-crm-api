import { v4 as uuidv4 } from "uuid";
import { ProductCategoryRepository } from "../repositories/product-category.repository.js";
import type { ICreateProductCategoryRequest, IUpdateProductCategoryRequest, IProductCategoryPaginationQuery } from "../interfaces/product-category.interface.js";
import { toProductCategorySafe, toProductCategoryDropdown, type IProductCategorySafe, type IProductCategoryDropdown } from "../dto/product-category.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { PRODUCT_CATEGORY_MESSAGES } from "../constants/product-category.constants.js";
import { storageService } from "@packages/storage/index.js";
import { logger } from "@packages/logger/index.js";

export class ProductCategoryService {
    private readonly repository: ProductCategoryRepository;

    constructor(repository: ProductCategoryRepository) {
        this.repository = repository;
    }

    async createCategory(data: ICreateProductCategoryRequest, file: Express.Multer.File | undefined, userUid: string): Promise<IProductCategorySafe> {
        const existing = await this.repository.findByName(data.name);
        if (existing) {
            throw new CustomError(PRODUCT_CATEGORY_MESSAGES.NAME_EXISTS, 400);
        }

        let imageUrl: string | undefined;
        const categoryUid = uuidv4();

        if (file) {
            try {
                imageUrl = await storageService.uploadFile(file.buffer, file.originalname, file.mimetype, `product-categories/${categoryUid}`);
            } catch (error) {
                logger.error("Failed to upload product category image", { error });
                throw new CustomError(PRODUCT_CATEGORY_MESSAGES.UPLOAD_FAILED, 500);
            }
        }

        const category = await this.repository.create({
            uid: categoryUid,
            name: data.name,
            ...(data.description !== undefined ? { description: data.description } : {}),
            ...(imageUrl !== undefined ? { image: imageUrl } : {}),
            ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
            createdBy: userUid,
        });

        return toProductCategorySafe(category);
    }

    async updateCategory(uid: string, data: IUpdateProductCategoryRequest, file: Express.Multer.File | undefined, userUid: string): Promise<IProductCategorySafe> {
        const category = await this.repository.findByUid(uid);
        if (!category) {
            throw new CustomError(PRODUCT_CATEGORY_MESSAGES.NOT_FOUND, 404);
        }

        if (data.name && data.name !== category.name) {
            const existing = await this.repository.findByName(data.name);
            if (existing) {
                throw new CustomError(PRODUCT_CATEGORY_MESSAGES.NAME_EXISTS, 400);
            }
        }

        let imageUrl = category.image || undefined;
        if (file) {
            try {
                imageUrl = await storageService.uploadFile(file.buffer, file.originalname, file.mimetype, `product-categories/${uid}`);
            } catch (error) {
                logger.error("Failed to upload product category image", { error });
                throw new CustomError(PRODUCT_CATEGORY_MESSAGES.UPLOAD_FAILED, 500);
            }
        }

        const updated = await this.repository.update(uid, {
            ...data,
            ...(imageUrl !== undefined ? { image: imageUrl } : {}),
            updatedBy: userUid,
        });

        if (!updated) {
            throw new CustomError(PRODUCT_CATEGORY_MESSAGES.NOT_FOUND, 404);
        }

        return toProductCategorySafe(updated);
    }

    async getCategoryByUid(uid: string): Promise<IProductCategorySafe> {
        const category = await this.repository.findByUid(uid);
        if (!category) {
            throw new CustomError(PRODUCT_CATEGORY_MESSAGES.NOT_FOUND, 404);
        }
        return toProductCategorySafe(category);
    }

    async getDropdownCategories(): Promise<IProductCategoryDropdown[]> {
        const categories = await this.repository.findAll("active");
        return categories.map(toProductCategoryDropdown);
    }

    async getPaginatedCategories(query: IProductCategoryPaginationQuery): Promise<{ data: IProductCategorySafe[]; total: number; totalPages: number }> {
        const { page = 1, limit = 10, search, status = "active" } = query;
        const { categories, total } = await this.repository.findPaginated(page, limit, search, status);
        return {
            data: categories.map(toProductCategorySafe),
            total,
            totalPages: Math.ceil(total / limit),
        };
    }

    async softDeleteCategory(uid: string, userUid: string): Promise<void> {
        const category = await this.repository.findByUid(uid);
        if (!category) {
            throw new CustomError(PRODUCT_CATEGORY_MESSAGES.NOT_FOUND, 404);
        }

        const isUsed = await this.repository.isUsedByProducts(uid);
        if (isUsed) {
            throw new CustomError(PRODUCT_CATEGORY_MESSAGES.CANNOT_DELETE_IN_USE, 400);
        }

        await this.repository.softDelete(uid, userUid);
    }

    async restoreCategory(uid: string, userUid: string): Promise<void> {
        const category = await this.repository.findByUid(uid);
        if (!category) {
            throw new CustomError(PRODUCT_CATEGORY_MESSAGES.NOT_FOUND, 404);
        }
        await this.repository.restore(uid, userUid);
    }
}
