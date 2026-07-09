import { v4 as uuidv4 } from "uuid";
import { ProductRepository } from "../repositories/product.repository.js";
import { ProductCategoryRepository } from "../../product-categories/repositories/product-category.repository.js";
import { ProductBrandRepository } from "../../product-brands/repositories/product-brand.repository.js";
import { ProductUnitRepository } from "../../product-units/repositories/product-unit.repository.js";
import type { ICreateProductRequest, IUpdateProductRequest, IProductPaginationQuery } from "../interfaces/product.interface.js";
import { toProductSafe, toProductDropdown, type IProductSafe, type IProductDropdown } from "../dto/product.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { PRODUCT_MESSAGES } from "../constants/product.constants.js";
import pool from "@packages/connection.js";

export class ProductService {
    private readonly repository: ProductRepository;
    private readonly categoryRepo: ProductCategoryRepository;
    private readonly brandRepo: ProductBrandRepository;
    private readonly unitRepo: ProductUnitRepository;

    constructor(repository: ProductRepository) {
        this.repository = repository;
        this.categoryRepo = new ProductCategoryRepository(pool);
        this.brandRepo = new ProductBrandRepository(pool);
        this.unitRepo = new ProductUnitRepository(pool);
    }

    async createProduct(data: ICreateProductRequest, userUid: string): Promise<IProductSafe> {
        const [existingName, existingCode] = await Promise.all([
            this.repository.findByName(data.name),
            this.repository.findByCode(data.productCode)
        ]);

        if (existingName) throw new CustomError(PRODUCT_MESSAGES.NAME_EXISTS, 400);
        if (existingCode) throw new CustomError(PRODUCT_MESSAGES.CODE_EXISTS, 400);

        // Validate dependencies exist
        const [category, brand, unit] = await Promise.all([
            this.categoryRepo.findByUid(data.categoryUid),
            this.brandRepo.findByUid(data.brandUid),
            this.unitRepo.findByUid(data.unitUid)
        ]);

        if (!category) throw new CustomError(PRODUCT_MESSAGES.CATEGORY_NOT_FOUND, 400);
        if (!brand) throw new CustomError(PRODUCT_MESSAGES.BRAND_NOT_FOUND, 400);
        if (!unit) throw new CustomError(PRODUCT_MESSAGES.UNIT_NOT_FOUND, 400);

        const productUid = uuidv4();

        const product = await this.repository.create({
            uid: productUid,
            categoryUid: data.categoryUid,
            brandUid: data.brandUid,
            unitUid: data.unitUid,
            name: data.name,
            productCode: data.productCode,
            pricePerUnit: data.pricePerUnit,
            gstPercentage: data.gstPercentage,
            ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
            ...(data.capacityUnit !== undefined ? { capacityUnit: data.capacityUnit } : {}),
            ...(data.warranty !== undefined ? { warranty: data.warranty } : {}),
            ...(data.description !== undefined ? { description: data.description } : {}),
            createdBy: userUid,
        });

        return toProductSafe(product);
    }

    async updateProduct(uid: string, data: IUpdateProductRequest, userUid: string): Promise<IProductSafe> {
        const product = await this.repository.findByUid(uid);
        if (!product) {
            throw new CustomError(PRODUCT_MESSAGES.NOT_FOUND, 404);
        }

        if (data.name && data.name !== product.name) {
            const existing = await this.repository.findByName(data.name);
            if (existing) throw new CustomError(PRODUCT_MESSAGES.NAME_EXISTS, 400);
        }

        if (data.productCode && data.productCode !== product.productCode) {
            const existing = await this.repository.findByCode(data.productCode);
            if (existing) throw new CustomError(PRODUCT_MESSAGES.CODE_EXISTS, 400);
        }

        if (data.categoryUid && data.categoryUid !== product.categoryUid) {
            const category = await this.categoryRepo.findByUid(data.categoryUid);
            if (!category) throw new CustomError(PRODUCT_MESSAGES.CATEGORY_NOT_FOUND, 400);
        }

        if (data.brandUid && data.brandUid !== product.brandUid) {
            const brand = await this.brandRepo.findByUid(data.brandUid);
            if (!brand) throw new CustomError(PRODUCT_MESSAGES.BRAND_NOT_FOUND, 400);
        }

        if (data.unitUid && data.unitUid !== product.unitUid) {
            const unit = await this.unitRepo.findByUid(data.unitUid);
            if (!unit) throw new CustomError(PRODUCT_MESSAGES.UNIT_NOT_FOUND, 400);
        }

        const updated = await this.repository.update(uid, {
            ...data,
            updatedBy: userUid,
        });

        if (!updated) {
            throw new CustomError(PRODUCT_MESSAGES.NOT_FOUND, 404);
        }

        return toProductSafe(updated);
    }

    async getProductByUid(uid: string): Promise<IProductSafe> {
        const product = await this.repository.findByUid(uid);
        if (!product) {
            throw new CustomError(PRODUCT_MESSAGES.NOT_FOUND, 404);
        }
        return toProductSafe(product);
    }

    async getDropdownProducts(): Promise<IProductDropdown[]> {
        const products = await this.repository.findAll("active");
        return products.map(toProductDropdown);
    }

    async getPaginatedProducts(query: IProductPaginationQuery): Promise<{ data: IProductSafe[]; total: number; totalPages: number }> {
        const { page = 1, limit = 10, search, categoryUid, brandUid, status = "active" } = query;
        const { products, total } = await this.repository.findPaginated(page, limit, search, categoryUid, brandUid, status);
        return {
            data: products.map(toProductSafe),
            total,
            totalPages: Math.ceil(total / limit),
        };
    }

    async softDeleteProduct(uid: string, userUid: string): Promise<void> {
        const product = await this.repository.findByUid(uid);
        if (!product) {
            throw new CustomError(PRODUCT_MESSAGES.NOT_FOUND, 404);
        }

        await this.repository.softDelete(uid, userUid);
    }

    async restoreProduct(uid: string, userUid: string): Promise<void> {
        const product = await this.repository.findByUid(uid);
        if (!product) {
            throw new CustomError(PRODUCT_MESSAGES.NOT_FOUND, 404);
        }
        await this.repository.restore(uid, userUid);
    }
}
