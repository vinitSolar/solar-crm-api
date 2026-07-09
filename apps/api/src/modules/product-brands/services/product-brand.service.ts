import { v4 as uuidv4 } from "uuid";
import { ProductBrandRepository } from "../repositories/product-brand.repository.js";
import type { ICreateProductBrandRequest, IUpdateProductBrandRequest, IProductBrandPaginationQuery } from "../interfaces/product-brand.interface.js";
import { toProductBrandSafe, toProductBrandDropdown, type IProductBrandSafe, type IProductBrandDropdown } from "../dto/product-brand.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { PRODUCT_BRAND_MESSAGES } from "../constants/product-brand.constants.js";
import { storageService } from "@packages/storage/index.js";
import { logger } from "@packages/logger/index.js";

export class ProductBrandService {
    private readonly repository: ProductBrandRepository;

    constructor(repository: ProductBrandRepository) {
        this.repository = repository;
    }

    async createBrand(data: ICreateProductBrandRequest, file: Express.Multer.File | undefined, userUid: string): Promise<IProductBrandSafe> {
        const existing = await this.repository.findByName(data.name);
        if (existing) {
            throw new CustomError(PRODUCT_BRAND_MESSAGES.NAME_EXISTS, 400);
        }

        let logoUrl: string | undefined;
        const brandUid = uuidv4();

        if (file) {
            try {
                logoUrl = await storageService.uploadFile(file.buffer, file.originalname, file.mimetype, `product-brands/${brandUid}`);
            } catch (error) {
                logger.error("Failed to upload product brand logo", { error });
                throw new CustomError(PRODUCT_BRAND_MESSAGES.UPLOAD_FAILED, 500);
            }
        }

        const brand = await this.repository.create({
            uid: brandUid,
            name: data.name,
            ...(data.description !== undefined ? { description: data.description } : {}),
            ...(logoUrl !== undefined ? { logo: logoUrl } : {}),
            ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
            createdBy: userUid,
        });

        return toProductBrandSafe(brand);
    }

    async updateBrand(uid: string, data: IUpdateProductBrandRequest, file: Express.Multer.File | undefined, userUid: string): Promise<IProductBrandSafe> {
        const brand = await this.repository.findByUid(uid);
        if (!brand) {
            throw new CustomError(PRODUCT_BRAND_MESSAGES.NOT_FOUND, 404);
        }

        if (data.name && data.name !== brand.name) {
            const existing = await this.repository.findByName(data.name);
            if (existing) {
                throw new CustomError(PRODUCT_BRAND_MESSAGES.NAME_EXISTS, 400);
            }
        }

        let logoUrl = brand.logo || undefined;
        if (file) {
            try {
                logoUrl = await storageService.uploadFile(file.buffer, file.originalname, file.mimetype, `product-brands/${uid}`);
            } catch (error) {
                logger.error("Failed to upload product brand logo", { error });
                throw new CustomError(PRODUCT_BRAND_MESSAGES.UPLOAD_FAILED, 500);
            }
        }

        const updated = await this.repository.update(uid, {
            ...data,
            ...(logoUrl !== undefined ? { logo: logoUrl } : {}),
            updatedBy: userUid,
        });

        if (!updated) {
            throw new CustomError(PRODUCT_BRAND_MESSAGES.NOT_FOUND, 404);
        }

        return toProductBrandSafe(updated);
    }

    async getBrandByUid(uid: string): Promise<IProductBrandSafe> {
        const brand = await this.repository.findByUid(uid);
        if (!brand) {
            throw new CustomError(PRODUCT_BRAND_MESSAGES.NOT_FOUND, 404);
        }
        return toProductBrandSafe(brand);
    }

    async getDropdownBrands(): Promise<IProductBrandDropdown[]> {
        const brands = await this.repository.findAll("active");
        return brands.map(toProductBrandDropdown);
    }

    async getPaginatedBrands(query: IProductBrandPaginationQuery): Promise<{ data: IProductBrandSafe[]; total: number; totalPages: number }> {
        const { page = 1, limit = 10, search, status = "active" } = query;
        const { brands, total } = await this.repository.findPaginated(page, limit, search, status);
        return {
            data: brands.map(toProductBrandSafe),
            total,
            totalPages: Math.ceil(total / limit),
        };
    }

    async softDeleteBrand(uid: string, userUid: string): Promise<void> {
        const brand = await this.repository.findByUid(uid);
        if (!brand) {
            throw new CustomError(PRODUCT_BRAND_MESSAGES.NOT_FOUND, 404);
        }

        const isUsed = await this.repository.isUsedByProducts(uid);
        if (isUsed) {
            throw new CustomError(PRODUCT_BRAND_MESSAGES.CANNOT_DELETE_IN_USE, 400);
        }

        await this.repository.softDelete(uid, userUid);
    }

    async restoreBrand(uid: string, userUid: string): Promise<void> {
        const brand = await this.repository.findByUid(uid);
        if (!brand) {
            throw new CustomError(PRODUCT_BRAND_MESSAGES.NOT_FOUND, 404);
        }
        await this.repository.restore(uid, userUid);
    }
}
