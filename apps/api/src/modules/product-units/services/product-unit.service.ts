import { v4 as uuidv4 } from "uuid";
import { ProductUnitRepository } from "../repositories/product-unit.repository.js";
import type { ICreateProductUnitRequest, IUpdateProductUnitRequest, IProductUnitPaginationQuery } from "../interfaces/product-unit.interface.js";
import { toProductUnitSafe, toProductUnitDropdown, type IProductUnitSafe, type IProductUnitDropdown } from "../dto/product-unit.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { PRODUCT_UNIT_MESSAGES } from "../constants/product-unit.constants.js";
import { safeCacheGet, safeCacheSet, safeCacheDelPattern } from "@packages/redis/index.js";

export class ProductUnitService {
    private readonly repository: ProductUnitRepository;

    constructor(repository: ProductUnitRepository) {
        this.repository = repository;
    }

    async createUnit(data: ICreateProductUnitRequest, userUid: string): Promise<IProductUnitSafe> {
        const existing = await this.repository.findByName(data.name);
        if (existing) {
            throw new CustomError(PRODUCT_UNIT_MESSAGES.NAME_EXISTS, 400);
        }

        const unitUid = uuidv4();

        const unit = await this.repository.create({
            uid: unitUid,
            name: data.name,
            shortName: data.shortName,
            description: data.description,
            sortOrder: data.sortOrder,
            createdBy: userUid,
        });

        await safeCacheDelPattern("cache:product-units:*");

        return toProductUnitSafe(unit);
    }

    async updateUnit(uid: string, data: IUpdateProductUnitRequest, userUid: string): Promise<IProductUnitSafe> {
        const unit = await this.repository.findByUid(uid);
        if (!unit) {
            throw new CustomError(PRODUCT_UNIT_MESSAGES.NOT_FOUND, 404);
        }

        if (data.name && data.name !== unit.name) {
            const existing = await this.repository.findByName(data.name);
            if (existing) {
                throw new CustomError(PRODUCT_UNIT_MESSAGES.NAME_EXISTS, 400);
            }
        }

        const updated = await this.repository.update(uid, {
            ...data,
            updatedBy: userUid,
        });

        if (!updated) {
            throw new CustomError(PRODUCT_UNIT_MESSAGES.NOT_FOUND, 404);
        }

        await safeCacheDelPattern("cache:product-units:*");

        return toProductUnitSafe(updated);
    }

    async getUnitByUid(uid: string): Promise<IProductUnitSafe> {
        const unit = await this.repository.findByUid(uid);
        if (!unit) {
            throw new CustomError(PRODUCT_UNIT_MESSAGES.NOT_FOUND, 404);
        }
        return toProductUnitSafe(unit);
    }

    async getDropdownUnits(): Promise<IProductUnitDropdown[]> {
        const cacheKey = "cache:product-units:dropdown";
        const cached = await safeCacheGet<IProductUnitDropdown[]>(cacheKey);
        if (cached) {
            return cached;
        }

        const units = await this.repository.findAll("active");
        const result = units.map(toProductUnitDropdown);
        await safeCacheSet(cacheKey, result, 7200); // 2 hours
        return result;
    }

    async getPaginatedUnits(query: IProductUnitPaginationQuery): Promise<{ data: IProductUnitSafe[]; total: number; totalPages: number }> {
        const { page = 1, limit = 10, search, status = "active" } = query;
        const { units, total } = await this.repository.findPaginated(page, limit, search, status);
        return {
            data: units.map(toProductUnitSafe),
            total,
            totalPages: Math.ceil(total / limit),
        };
    }

    async softDeleteUnit(uid: string, userUid: string): Promise<void> {
        const unit = await this.repository.findByUid(uid);
        if (!unit) {
            throw new CustomError(PRODUCT_UNIT_MESSAGES.NOT_FOUND, 404);
        }

        const isUsed = await this.repository.isUsedByProducts(uid);
        if (isUsed) {
            throw new CustomError(PRODUCT_UNIT_MESSAGES.CANNOT_DELETE_IN_USE, 400);
        }

        await this.repository.softDelete(uid, userUid);
        await safeCacheDelPattern("cache:product-units:*");
    }

    async restoreUnit(uid: string, userUid: string): Promise<void> {
        const unit = await this.repository.findByUid(uid);
        if (!unit) {
            throw new CustomError(PRODUCT_UNIT_MESSAGES.NOT_FOUND, 404);
        }
        await this.repository.restore(uid, userUid);
        await safeCacheDelPattern("cache:product-units:*");
    }
}
