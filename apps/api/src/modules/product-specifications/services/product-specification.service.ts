import { v4 as uuidv4 } from "uuid";
import { ProductSpecificationRepository } from "../repositories/product-specification.repository.js";
import type { 
    ICreateProductSpecificationRequest, 
    IUpdateProductSpecificationRequest, 
    IProductSpecificationPaginationQuery,
    IMapProductSpecificationToCategoryRequest,
    IUpdateCategorySpecificationMappingRequest
} from "../interfaces/product-specification.interface.js";
import { toProductSpecificationSafe, type IProductSpecificationSafe } from "../dto/product-specification.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { PRODUCT_SPECIFICATION_MESSAGES } from "../constants/product-specification.constants.js";
import { ProductCategoryRepository } from "../../product-categories/repositories/product-category.repository.js";
import { ProductUnitRepository } from "../../product-units/repositories/product-unit.repository.js";
import pool from "@packages/connection.js";
import { logger } from "@packages/logger/index.js";

export class ProductSpecificationService {
    private readonly repository: ProductSpecificationRepository;
    private readonly categoryRepo: ProductCategoryRepository;
    private readonly unitRepo: ProductUnitRepository;

    constructor(repository: ProductSpecificationRepository) {
        this.repository = repository;
        this.categoryRepo = new ProductCategoryRepository(pool);
        this.unitRepo = new ProductUnitRepository(pool);
    }

    async createSpecification(data: ICreateProductSpecificationRequest, userUid: string): Promise<IProductSpecificationSafe> {
        const existing = await this.repository.findByTitle(data.title);
        if (existing) {
            throw new CustomError(PRODUCT_SPECIFICATION_MESSAGES.TITLE_EXISTS, 400);
        }

        if (data.unitUid) {
            const unit = await this.unitRepo.findByUid(data.unitUid);
            if (!unit) throw new CustomError(PRODUCT_SPECIFICATION_MESSAGES.UNIT_NOT_FOUND, 400);
        }

        if (data.valueType === 3) {
            if (!data.options || data.options.length === 0) {
                throw new CustomError(PRODUCT_SPECIFICATION_MESSAGES.INVALID_OPTIONS, 400);
            }
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const specUid = uuidv4();
            const spec = await this.repository.create({
                uid: specUid,
                title: data.title,
                valueType: data.valueType,
                unitUid: data.unitUid || null,
                createdBy: userUid,
            }, client);

            let options: any[] = [];
            if (data.valueType === 3 && data.options) {
                for (const opt of data.options) {
                    if (!opt) continue;
                    const createdOpt = await this.repository.createOption({
                        uid: uuidv4(),
                        specificationUid: specUid,
                        value: opt.value,
                        sortOrder: opt.sortOrder ?? 0,
                        createdBy: userUid,
                    }, client);
                    options.push(createdOpt);
                }
            }
            
            // Map to category if categoryUid is provided (e.g. created from category context)
            if (data.categoryUid) {
                const category = await this.categoryRepo.findByUid(data.categoryUid);
                if (!category) {
                    throw new CustomError("Product category not found.", 404);
                }
                const mapping = await this.repository.mapToCategory({
                    uid: uuidv4(),
                    categoryUid: data.categoryUid,
                    specificationUid: specUid,
                    sortOrder: data.sortOrder,
                    isRequired: data.isRequired,
                    createdBy: userUid,
                }, client);
                
                spec.mappingUid = mapping.uid;
                spec.sortOrder = mapping.sortOrder;
                spec.isRequired = mapping.isRequired;
            }

            await client.query("COMMIT");
            return toProductSpecificationSafe(spec, options);
        } catch (error) {
            await client.query("ROLLBACK");
            logger.error("Failed to create product specification", { error });
            if (error instanceof CustomError) throw error;
            throw new CustomError("Failed to create product specification", 500);
        } finally {
            client.release();
        }
    }

    async updateSpecification(uid: string, data: IUpdateProductSpecificationRequest, userUid: string): Promise<IProductSpecificationSafe> {
        const spec = await this.repository.findByUid(uid);
        if (!spec) {
            throw new CustomError(PRODUCT_SPECIFICATION_MESSAGES.NOT_FOUND, 404);
        }

        if (data.title && data.title !== spec.title) {
            const existing = await this.repository.findByTitle(data.title);
            if (existing && existing.uid !== uid) {
                throw new CustomError(PRODUCT_SPECIFICATION_MESSAGES.TITLE_EXISTS, 400);
            }
        }

        if (data.unitUid) {
            const unit = await this.unitRepo.findByUid(data.unitUid);
            if (!unit) throw new CustomError(PRODUCT_SPECIFICATION_MESSAGES.UNIT_NOT_FOUND, 400);
        }

        const newValueType = data.valueType !== undefined ? data.valueType : spec.valueType;

        if (newValueType === 3) {
            // Need options
            if (data.options !== undefined && data.options.length === 0) {
                throw new CustomError(PRODUCT_SPECIFICATION_MESSAGES.INVALID_OPTIONS, 400);
            }
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const updatedSpec = await this.repository.update(uid, {
                title: data.title,
                valueType: data.valueType,
                unitUid: data.unitUid,
                isActive: data.isActive,
                updatedBy: userUid,
            }, client);

            let options: any[] = [];
            
            // Re-create options if provided
            if (data.options !== undefined) {
                await this.repository.softDeleteOptionsBySpecification(uid, userUid, client);
                
                if (newValueType === 3 && data.options.length > 0) {
                    for (const opt of data.options) {
                        if (!opt) continue;
                        const createdOpt = await this.repository.createOption({
                            uid: uuidv4(),
                            specificationUid: uid,
                            value: opt.value,
                            sortOrder: opt.sortOrder ?? 0,
                            createdBy: userUid,
                        }, client);
                        options.push(createdOpt);
                    }
                }
            } else {
                options = await this.repository.findOptionsBySpecification(uid, client);
            }

            await client.query("COMMIT");
            return toProductSpecificationSafe(updatedSpec!, options);
        } catch (error) {
            await client.query("ROLLBACK");
            logger.error("Failed to update product specification", { error });
            if (error instanceof CustomError) throw error;
            throw new CustomError("Failed to update product specification", 500);
        } finally {
            client.release();
        }
    }

    async mapSpecificationToCategory(categoryUid: string, data: IMapProductSpecificationToCategoryRequest, userUid: string): Promise<IProductSpecificationSafe> {
        const category = await this.categoryRepo.findByUid(categoryUid);
        if (!category) {
            throw new CustomError("Product category not found.", 404);
        }
        
        const spec = await this.repository.findByUid(data.specificationUid);
        if (!spec) {
            throw new CustomError(PRODUCT_SPECIFICATION_MESSAGES.NOT_FOUND, 404);
        }
        
        const existingMapping = await this.repository.findMapping(categoryUid, data.specificationUid);
        if (existingMapping) {
            throw new CustomError("Specification is already mapped to this category.", 400);
        }
        
        const mapping = await this.repository.mapToCategory({
            uid: uuidv4(),
            categoryUid,
            specificationUid: data.specificationUid,
            sortOrder: data.sortOrder,
            isRequired: data.isRequired,
            createdBy: userUid,
        });
        
        spec.mappingUid = mapping.uid;
        spec.sortOrder = mapping.sortOrder;
        spec.isRequired = mapping.isRequired;
        
        const options = await this.repository.findOptionsBySpecification(data.specificationUid);
        return toProductSpecificationSafe(spec, options);
    }
    
    async updateCategoryMapping(categoryUid: string, specificationUid: string, data: IUpdateCategorySpecificationMappingRequest, userUid: string): Promise<IProductSpecificationSafe> {
        const mapping = await this.repository.findMapping(categoryUid, specificationUid);
        if (!mapping) {
            throw new CustomError("Mapping not found.", 404);
        }
        
        const updatedMapping = await this.repository.updateMapping(categoryUid, specificationUid, {
            ...data,
            updatedBy: userUid,
        });
        
        const spec = await this.repository.findByUid(specificationUid);
        spec!.mappingUid = updatedMapping!.uid;
        spec!.sortOrder = updatedMapping!.sortOrder;
        spec!.isRequired = updatedMapping!.isRequired;
        
        const options = await this.repository.findOptionsBySpecification(specificationUid);
        return toProductSpecificationSafe(spec!, options);
    }

    async getSpecificationByUid(uid: string): Promise<IProductSpecificationSafe> {
        const spec = await this.repository.findByUid(uid);
        if (!spec) {
            throw new CustomError(PRODUCT_SPECIFICATION_MESSAGES.NOT_FOUND, 404);
        }
        const options = await this.repository.findOptionsBySpecification(uid);
        return toProductSpecificationSafe(spec, options);
    }

    async getPaginatedSpecifications(query: IProductSpecificationPaginationQuery): Promise<{ data: IProductSpecificationSafe[]; total: number; totalPages: number }> {
        const { page = 1, limit = 10, search, categoryUid, status = "active" } = query;
        const { specifications, total } = await this.repository.findPaginated(page, limit, search, categoryUid, status);
        
        const data = await Promise.all(specifications.map(async (spec) => {
            const options = await this.repository.findOptionsBySpecification(spec.uid);
            return toProductSpecificationSafe(spec, options);
        }));

        return {
            data,
            total,
            totalPages: Math.ceil(total / limit),
        };
    }

    async softDeleteSpecification(uid: string, userUid: string): Promise<void> {
        const spec = await this.repository.findByUid(uid);
        if (!spec) {
            throw new CustomError(PRODUCT_SPECIFICATION_MESSAGES.NOT_FOUND, 404);
        }
        
        const mappingCount = await this.repository.countMappingsForSpecification(uid);
        if (mappingCount > 0) {
            throw new CustomError("Cannot delete specification because it is mapped to active categories.", 400);
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            await this.repository.softDelete(uid, userUid);
            await this.repository.softDeleteOptionsBySpecification(uid, userUid, client);
            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }
}
