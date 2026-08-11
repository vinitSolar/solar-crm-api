import { v4 as uuidv4 } from "uuid";
import { ProductRepository } from "../repositories/product.repository.js";
import { ProductCategoryRepository } from "../../product-categories/repositories/product-category.repository.js";
import { ProductBrandRepository } from "../../product-brands/repositories/product-brand.repository.js";
import { ProductUnitRepository } from "../../product-units/repositories/product-unit.repository.js";
import { ProductSpecificationRepository } from "../../product-specifications/repositories/product-specification.repository.js";
import type { ICreateProductRequest, IUpdateProductRequest, IProductPaginationQuery } from "../interfaces/product.interface.js";
import { toProductSafe, toProductDropdown, type IProductSafe, type IProductDropdown } from "../dto/product.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { PRODUCT_MESSAGES } from "../constants/product.constants.js";
import pool from "@packages/connection.js";
import { storageService } from "@packages/storage/index.js";
import { logger } from "@packages/logger/index.js";

export class ProductService {
    private readonly repository: ProductRepository;
    private readonly categoryRepo: ProductCategoryRepository;
    private readonly brandRepo: ProductBrandRepository;
    private readonly unitRepo: ProductUnitRepository;
    private readonly specRepo: ProductSpecificationRepository;

    constructor(repository: ProductRepository) {
        this.repository = repository;
        this.categoryRepo = new ProductCategoryRepository(pool);
        this.brandRepo = new ProductBrandRepository(pool);
        this.unitRepo = new ProductUnitRepository(pool);
        this.specRepo = new ProductSpecificationRepository(pool);
    }

    async createProduct(data: ICreateProductRequest, files: Express.Multer.File[], tenantUid: string, userUid: string): Promise<IProductSafe> {
        logger.info("ProductService.createProduct", { name: data.name, code: data.productCode, filesCount: files.length, tenantUid });

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

        // Validate Required Specifications
        const { specifications: categorySpecs } = await this.specRepo.findPaginated(1, 1000, undefined, data.categoryUid, "active");
        const requiredSpecUids = categorySpecs.filter(s => s.isRequired === 1).map(s => s.uid);
        
        const providedSpecUids = data.specifications?.map(s => s.specificationUid) || [];
        for (const reqUid of requiredSpecUids) {
            if (!providedSpecUids.includes(reqUid)) {
                const spec = categorySpecs.find(s => s.uid === reqUid);
                throw new CustomError(`Specification '${spec?.title}' is required.`, 400);
            }
        }
        
        // Also ensure all provided specs actually belong to this category and exist
        if (data.specifications) {
            for (const spec of data.specifications) {
                const catSpec = categorySpecs.find(s => s.uid === spec.specificationUid);
                if (!catSpec) {
                    throw new CustomError(`Invalid specification UID for this category: ${spec.specificationUid}`, 400);
                }
            }
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Filter out images
            const imageFiles = files.filter(f => f.fieldname === "images");

            // Create Product record
            const productUid = uuidv4();
            const productImages: string[] = [];

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
                modelNumber: data.modelNumber,
                images: [],
                specifications: data.specifications,
                createdBy: userUid,
            }, client);

            // Upload images
            for (const file of imageFiles) {
                const fileUrl = await storageService.uploadFile(
                    file.buffer,
                    file.originalname,
                    file.mimetype,
                    `products/${productUid}/images`
                );
                productImages.push(fileUrl);
            }

            // Update the product record with images
            if (productImages.length > 0) {
                await this.repository.update(productUid, {
                    images: productImages,
                    updatedBy: userUid,
                }, client);
                product.images = productImages;
            }

            await client.query("COMMIT");
            return toProductSafe(product);
        } catch (error) {
            await client.query("ROLLBACK");
            logger.error("ProductService.createProduct failed, transaction rolled back", { error });
            if (error instanceof CustomError) throw error;
            throw new CustomError("Failed to create product", 500);
        } finally {
            client.release();
        }
    }

    async updateProduct(uid: string, data: IUpdateProductRequest, files: Express.Multer.File[], tenantUid: string, userUid: string): Promise<IProductSafe> {
        logger.info("ProductService.updateProduct", { uid, filesCount: files.length, tenantUid });

        const product = await this.repository.findByUid(uid);
        if (!product) {
            throw new CustomError(PRODUCT_MESSAGES.NOT_FOUND, 404);
        }

        if (data.name && data.name !== product.name) {
            const existingName = await this.repository.findByName(data.name);
            if (existingName) throw new CustomError(PRODUCT_MESSAGES.NAME_EXISTS, 400);
        }

        if (data.productCode && data.productCode !== product.productCode) {
            const existingCode = await this.repository.findByCode(data.productCode);
            if (existingCode) throw new CustomError(PRODUCT_MESSAGES.CODE_EXISTS, 400);
        }

        // Validate dependencies if they are being updated
        if (data.categoryUid) {
            const category = await this.categoryRepo.findByUid(data.categoryUid);
            if (!category) throw new CustomError(PRODUCT_MESSAGES.CATEGORY_NOT_FOUND, 400);
        }
        if (data.brandUid) {
            const brand = await this.brandRepo.findByUid(data.brandUid);
            if (!brand) throw new CustomError(PRODUCT_MESSAGES.BRAND_NOT_FOUND, 400);
        }
        if (data.unitUid) {
            const unit = await this.unitRepo.findByUid(data.unitUid);
            if (!unit) throw new CustomError(PRODUCT_MESSAGES.UNIT_NOT_FOUND, 400);
        }

        // Validate specifications if provided
        const targetCategoryUid = data.categoryUid || product.categoryUid;
        if (data.specifications) {
            const { specifications: categorySpecs } = await this.specRepo.findPaginated(1, 1000, undefined, targetCategoryUid, "active");
            const requiredSpecUids = categorySpecs.filter(s => s.isRequired === 1).map(s => s.uid);
            
            for (const reqUid of requiredSpecUids) {
                const alreadyExists = product.specifications?.some(s => s.specificationUid === reqUid);
                const provided = data.specifications.find(s => s.specificationUid === reqUid);
                
                if (!provided && !alreadyExists) {
                    const spec = categorySpecs.find(s => s.uid === reqUid);
                    throw new CustomError(`Specification '${spec?.title}' is required.`, 400);
                }
            }
            
            for (const spec of data.specifications) {
                const catSpec = categorySpecs.find(s => s.uid === spec.specificationUid);
                if (!catSpec) {
                    throw new CustomError(`Invalid specification UID for this category: ${spec.specificationUid}`, 400);
                }
            }
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Filter out images
            const imageFiles = files.filter(f => f.fieldname === "images");

            // Upload new image files
            const newProductImages: string[] = [];
            for (const file of imageFiles) {
                const fileUrl = await storageService.uploadFile(
                    file.buffer,
                    file.originalname,
                    file.mimetype,
                    `products/${uid}/images`
                );
                newProductImages.push(fileUrl);
            }

            // Update product image list
            let currentImages: string[] = [];
            if (data.existingImages !== undefined) {
                currentImages = [...data.existingImages];
            } else {
                currentImages = product.images ? [...product.images] : [];
            }

            const finalProductImages = [...currentImages, ...newProductImages];

            // Update product record
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { existingImages, ...repositoryData } = data;
            const updatedProduct = await this.repository.update(uid, {
                ...repositoryData,
                images: finalProductImages,
                updatedBy: userUid,
            }, client);

            if (!updatedProduct) {
                throw new CustomError(PRODUCT_MESSAGES.NOT_FOUND, 404);
            }

            await client.query("COMMIT");
            return toProductSafe(updatedProduct);
        } catch (error) {
            await client.query("ROLLBACK");
            logger.error("ProductService.updateProduct failed, transaction rolled back", { error });
            if (error instanceof CustomError) throw error;
            throw new CustomError("Failed to update product", 500);
        } finally {
            client.release();
        }
    }

    async getProductByUid(uid: string, tenantUid: string): Promise<IProductSafe> {
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
            data: products.map(p => toProductSafe(p)),
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
