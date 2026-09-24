import { v4 as uuidv4 } from "uuid";
import path from "path";
import type { PoolClient } from "pg";
import { ProductRepository } from "../repositories/product.repository.js";
import { ProductCategoryRepository } from "../../product-categories/repositories/product-category.repository.js";
import { ProductBrandRepository } from "../../product-brands/repositories/product-brand.repository.js";
import { ProductUnitRepository } from "../../product-units/repositories/product-unit.repository.js";
import { ProductSpecificationRepository } from "../../product-specifications/repositories/product-specification.repository.js";
import type { ICreateProductRequest, IUpdateProductRequest, IProductPaginationQuery } from "../interfaces/product.interface.js";
import { toProductSafe, toProductDropdown, type IProductSafe, type IProductDropdown, type IProductDocumentSafe } from "../dto/product.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { PRODUCT_MESSAGES } from "../constants/product.constants.js";
import pool from "@packages/connection.js";
import { storageService } from "@packages/storage/index.js";
import { logger } from "@packages/logger/index.js";
import { getOrSetCache, safeCacheDel } from "@packages/redis/index.js";

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

    async getProductDocuments(productUid: string, client?: PoolClient): Promise<IProductDocumentSafe[]> {
        const executor = client || pool;
        const query = `
            SELECT 
                md.uid,
                md.entity_uid AS "productUid",
                md.document_type_uid AS "documentTypeUid",
                mdt.name AS "documentTypeName",
                mdt.category AS "documentTypeCategory",
                md.original_name AS "originalFileName",
                md.original_name AS "originalName",
                md.file_name AS "storedFileName",
                md.file_name AS "fileName",
                md.mime_type AS "mimeType",
                md.file_size AS "fileSize",
                md.created_at AS "createdAt",
                da.uid AS "associationUid"
            FROM document_associations da
            JOIN master_documents md ON md.uid = da.master_document_uid
            LEFT JOIN master_document_types mdt ON mdt.uid = md.document_type_uid
            WHERE da.module = 'product'
              AND da.context_uid = $1
              AND da.is_deleted = 0
              AND md.is_deleted = 0
            ORDER BY mdt.sort_order ASC, md.created_at DESC
        `;
        const result = await executor.query(query, [productUid]);
        return result.rows.map((row: any) => {
            const publicUrl = storageService.getPublicUrl(row.storedFileName) || row.storedFileName;
            return {
                uid: row.uid,
                productUid: row.productUid,
                documentTypeUid: row.documentTypeUid,
                documentTypeName: row.documentTypeName,
                documentTypeCategory: row.documentTypeCategory,
                originalFileName: row.originalFileName,
                originalName: row.originalName,
                storedFileName: row.storedFileName,
                fileName: row.fileName,
                filePath: publicUrl,
                fileUrl: publicUrl,
                mimeType: row.mimeType,
                fileSize: Number(row.fileSize),
                createdAt: row.createdAt,
                associationUid: row.associationUid,
            };
        });
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

            // Filter out images and document files
            const imageFiles = files.filter(f => f.fieldname === "images");
            const documentFiles = files.filter(f => f.fieldname !== "images");
            const documentTypeUids = data.documentTypeUids || [];

            if (documentFiles.length > 0) {
                if (documentFiles.length !== documentTypeUids.length) {
                    throw new CustomError("Number of uploaded files does not match the number of document type UIDs", 400);
                }
            }

            // Validate document types and extensions
            if (documentTypeUids.length > 0) {
                const docTypesRes = await client.query(
                    `SELECT * FROM master_document_types WHERE uid = ANY($1) AND is_deleted = 0 AND is_active = 1`,
                    [documentTypeUids]
                );
                const docTypeMap = new Map(docTypesRes.rows.map((t: any) => [t.uid, t]));

                const uploadCountByType = new Map<string, number>();
                for (let i = 0; i < documentFiles.length; i++) {
                    const file = documentFiles[i]!;
                    const typeUid = documentTypeUids[i]!;
                    const docType = docTypeMap.get(typeUid);
                    if (!docType) {
                        throw new CustomError(`Invalid document type UID: ${typeUid}`, 400);
                    }

                    const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
                    const allowedExtStr = docType.allowed_extensions || docType.allowedExtensions || "";
                    const allowed = allowedExtStr.split(",").map((e: string) => e.trim().toLowerCase());
                    if (allowed.length > 0 && !allowed.includes(ext) && !allowed.includes("*")) {
                        throw new CustomError(`File extension '.${ext}' is not allowed for document type '${docType.name}'. Allowed extensions: ${allowedExtStr}`, 400);
                    }

                    const count = (uploadCountByType.get(typeUid) || 0) + 1;
                    uploadCountByType.set(typeUid, count);
                    const allowMultiple = docType.allow_multiple !== undefined ? docType.allow_multiple : docType.allowMultiple;
                    if (allowMultiple === 0 && count > 1) {
                        throw new CustomError(`Multiple files are not allowed for document type '${docType.name}'`, 400);
                    }
                }
            }

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

            // Upload document files and record in master_documents and document_associations
            for (let i = 0; i < documentFiles.length; i++) {
                const file = documentFiles[i]!;
                const typeUid = documentTypeUids[i]!;
                const folder = `master-vault/${tenantUid || "global"}/product/${productUid}`;
                const fileResult = await storageService.uploadFileWithPath(
                    file.buffer,
                    file.originalname,
                    file.mimetype,
                    folder
                );
                const fileName = fileResult.path || path.basename(fileResult.url);
                const masterDocUid = uuidv4();

                await client.query(`
                    INSERT INTO master_documents (
                        uid, tenant_uid, document_type_uid, entity_type, entity_uid,
                        original_name, file_name, mime_type, file_size, created_by
                    )
                    VALUES ($1, $2, $3, 'product', $4, $5, $6, $7, $8, $9)
                `, [
                    masterDocUid,
                    tenantUid || null,
                    typeUid,
                    productUid,
                    file.originalname,
                    fileName,
                    file.mimetype,
                    file.size,
                    userUid
                ]);

                await client.query(`
                    INSERT INTO document_associations (
                        uid, tenant_uid, master_document_uid, module, context_uid, created_by
                    )
                    VALUES ($1, $2, $3, 'product', $4, $5)
                `, [
                    uuidv4(),
                    tenantUid || null,
                    masterDocUid,
                    productUid,
                    userUid
                ]);
            }

            await client.query("COMMIT");
            safeCacheDel("cache:products:dropdown").catch(() => {});
            const documents = await this.getProductDocuments(productUid);
            return toProductSafe(product, documents);
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

            // Filter out images and document files
            const imageFiles = files.filter(f => f.fieldname === "images");
            const documentFiles = files.filter(f => f.fieldname !== "images");
            const documentTypeUids = data.documentTypeUids || [];

            if (documentFiles.length > 0) {
                if (documentFiles.length !== documentTypeUids.length) {
                    throw new CustomError("Number of uploaded files does not match the number of document type UIDs", 400);
                }
            }

            // Process soft deletion of requested documents
            const deleteUids = data.deleteDocumentUids || [];
            if (deleteUids.length > 0) {
                await client.query(`
                    UPDATE master_documents
                    SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1, updated_at = CURRENT_TIMESTAMP
                    WHERE (uid = ANY($2) OR uid IN (
                        SELECT master_document_uid FROM document_associations WHERE uid = ANY($2)
                    )) AND is_deleted = 0
                `, [userUid, deleteUids]);

                await client.query(`
                    UPDATE document_associations
                    SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1, updated_at = CURRENT_TIMESTAMP
                    WHERE (uid = ANY($2) OR master_document_uid = ANY($2)) AND is_deleted = 0
                `, [userUid, deleteUids]);
            }

            // Validate new document files
            if (documentTypeUids.length > 0) {
                const docTypesRes = await client.query(
                    `SELECT * FROM master_document_types WHERE uid = ANY($1) AND is_deleted = 0 AND is_active = 1`,
                    [documentTypeUids]
                );
                const docTypeMap = new Map(docTypesRes.rows.map((t: any) => [t.uid, t]));

                const uploadCountByType = new Map<string, number>();
                for (let i = 0; i < documentFiles.length; i++) {
                    const file = documentFiles[i]!;
                    const typeUid = documentTypeUids[i]!;
                    const docType = docTypeMap.get(typeUid);
                    if (!docType) {
                        throw new CustomError(`Invalid document type UID: ${typeUid}`, 400);
                    }

                    const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
                    const allowedExtStr = docType.allowed_extensions || docType.allowedExtensions || "";
                    const allowed = allowedExtStr.split(",").map((e: string) => e.trim().toLowerCase());
                    if (allowed.length > 0 && !allowed.includes(ext) && !allowed.includes("*")) {
                        throw new CustomError(`File extension '.${ext}' is not allowed for document type '${docType.name}'. Allowed extensions: ${allowedExtStr}`, 400);
                    }

                    const count = (uploadCountByType.get(typeUid) || 0) + 1;
                    uploadCountByType.set(typeUid, count);
                    const allowMultiple = docType.allow_multiple !== undefined ? docType.allow_multiple : docType.allowMultiple;
                    if (allowMultiple === 0 && count > 1) {
                        throw new CustomError(`Multiple files are not allowed for document type '${docType.name}'`, 400);
                    }
                }

                // Handle replacement logic for allowMultiple = 0
                for (let i = 0; i < documentFiles.length; i++) {
                    const typeUid = documentTypeUids[i]!;
                    const docType = docTypeMap.get(typeUid);
                    const allowMultiple = docType?.allow_multiple !== undefined ? docType.allow_multiple : docType?.allowMultiple;
                    if (allowMultiple === 0) {
                        await client.query(`
                            UPDATE master_documents
                            SET is_latest = 0, is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1, updated_at = CURRENT_TIMESTAMP
                            WHERE entity_type = 'product' AND entity_uid = $2 AND document_type_uid = $3 AND is_deleted = 0
                        `, [userUid, uid, typeUid]);

                        await client.query(`
                            UPDATE document_associations
                            SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1, updated_at = CURRENT_TIMESTAMP
                            WHERE module = 'product' AND context_uid = $2 
                              AND master_document_uid IN (SELECT uid FROM master_documents WHERE entity_type = 'product' AND entity_uid = $2 AND document_type_uid = $3)
                              AND is_deleted = 0
                        `, [userUid, uid, typeUid]);
                    }
                }

                // Upload new files and insert metadata
                for (let i = 0; i < documentFiles.length; i++) {
                    const file = documentFiles[i]!;
                    const typeUid = documentTypeUids[i]!;
                    const folder = `master-vault/${tenantUid || "global"}/product/${uid}`;
                    const fileResult = await storageService.uploadFileWithPath(
                        file.buffer,
                        file.originalname,
                        file.mimetype,
                        folder
                    );
                    const fileName = fileResult.path || path.basename(fileResult.url);
                    const masterDocUid = uuidv4();

                    await client.query(`
                        INSERT INTO master_documents (
                            uid, tenant_uid, document_type_uid, entity_type, entity_uid,
                            original_name, file_name, mime_type, file_size, created_by
                        )
                        VALUES ($1, $2, $3, 'product', $4, $5, $6, $7, $8, $9)
                    `, [
                        masterDocUid,
                        tenantUid || null,
                        typeUid,
                        uid,
                        file.originalname,
                        fileName,
                        file.mimetype,
                        file.size,
                        userUid
                    ]);

                    await client.query(`
                        INSERT INTO document_associations (
                            uid, tenant_uid, master_document_uid, module, context_uid, created_by
                        )
                        VALUES ($1, $2, $3, 'product', $4, $5)
                    `, [
                        uuidv4(),
                        tenantUid || null,
                        masterDocUid,
                        uid,
                        userUid
                    ]);
                }
            }

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
                currentImages = data.existingImages
                    .map(img => storageService.extractStorageKey(img))
                    .filter((img): img is string => Boolean(img));
            } else {
                currentImages = product.images ? [...product.images] : [];
            }

            const finalProductImages = [...currentImages, ...newProductImages];

            // Update product record
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { existingImages, deleteDocumentUids: _delDocUids, documentTypeUids: _dtUids, ...repositoryData } = data;
            const updatedProduct = await this.repository.update(uid, {
                ...repositoryData,
                images: finalProductImages,
                updatedBy: userUid,
            }, client);

            if (!updatedProduct) {
                throw new CustomError(PRODUCT_MESSAGES.NOT_FOUND, 404);
            }

            await client.query("COMMIT");
            safeCacheDel("cache:products:dropdown").catch(() => {});
            const documents = await this.getProductDocuments(uid);
            return toProductSafe(updatedProduct, documents);
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
        const documents = await this.getProductDocuments(uid);
        return toProductSafe(product, documents);
    }

    async getDropdownProducts(): Promise<IProductDropdown[]> {
        return getOrSetCache("cache:products:dropdown", 3600, async () => {
            const products = await this.repository.findAll("active");
            return products.map(toProductDropdown);
        });
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

        // Check if product is referenced in any active packages
        const activePackagesResult = await pool.query(`
            SELECT DISTINCT pkg.name 
            FROM package_products pp
            JOIN packages pkg ON pkg.uid = pp.package_uid
            WHERE pp.product_uid::text = $1 
              AND pp.is_deleted = false 
              AND pkg.is_deleted = false
        `, [uid]);

        if (activePackagesResult.rows.length > 0) {
            const packageNames = activePackagesResult.rows.map((r: any) => `"${r.name}"`).join(", ");
            throw new CustomError(
                `Cannot delete product "${product.name}" because it is currently used in active package(s): ${packageNames}. Please remove it from the package(s) first.`,
                400
            );
        }

        await this.repository.softDelete(uid, userUid);
        safeCacheDel("cache:products:dropdown").catch(() => {});
    }

    async restoreProduct(uid: string, userUid: string): Promise<void> {
        const product = await this.repository.findByUid(uid);
        if (!product) {
            throw new CustomError(PRODUCT_MESSAGES.NOT_FOUND, 404);
        }
        await this.repository.restore(uid, userUid);
        safeCacheDel("cache:products:dropdown").catch(() => {});
    }
}
