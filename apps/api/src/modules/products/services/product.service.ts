import { v4 as uuidv4 } from "uuid";
import path from "path";
import { ProductRepository } from "../repositories/product.repository.js";
import { ProductCategoryRepository } from "../../product-categories/repositories/product-category.repository.js";
import { ProductBrandRepository } from "../../product-brands/repositories/product-brand.repository.js";
import { ProductUnitRepository } from "../../product-units/repositories/product-unit.repository.js";
import { ProductDocumentRepository } from "../repositories/product-document.repository.js";
import { ProductDocumentTypeRepository } from "../../product-document-types/repositories/product-document-type.repository.js";
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
    private readonly documentRepository: ProductDocumentRepository;
    private readonly documentTypeRepository: ProductDocumentTypeRepository;

    constructor(repository: ProductRepository) {
        this.repository = repository;
        this.categoryRepo = new ProductCategoryRepository(pool);
        this.brandRepo = new ProductBrandRepository(pool);
        this.unitRepo = new ProductUnitRepository(pool);
        this.documentRepository = new ProductDocumentRepository(pool);
        this.documentTypeRepository = new ProductDocumentTypeRepository(pool);
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

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // 1. Fetch active document types for this tenant
            const docTypes = await this.documentTypeRepository.findAllActive(tenantUid, client);
            const docTypeMap = new Map(docTypes.map(t => [t.uid, t]));

            const productImagesType = docTypes.find(t => t.name.toLowerCase() === "product images");
            const productImagesTypeUid = productImagesType?.uid || "8d6f51cb-1c09-411a-8260-249ebd7e8a15";

            // Map files to their target document type UIDs
            const documentItems: { file: Express.Multer.File; typeUid: string }[] = [];

            // Standard files uploaded under Option 2
            const uploadedFiles = files.filter(f => f.fieldname === "files");
            const documentTypeUids = data.documentTypeUids || [];

            if (uploadedFiles.length > 0) {
                if (uploadedFiles.length !== documentTypeUids.length) {
                    throw new CustomError("Number of uploaded files does not match the number of document type UIDs", 400);
                }
                for (let i = 0; i < uploadedFiles.length; i++) {
                    const file = uploadedFiles[i];
                    const typeUid = documentTypeUids[i];
                    if (file && typeUid) {
                        documentItems.push({ file, typeUid });
                    }
                }
            }

            // Maintain backward compatibility for old images fieldname
            const oldImageFiles = files.filter(f => f.fieldname === "images");
            for (const file of oldImageFiles) {
                documentItems.push({
                    file,
                    typeUid: productImagesTypeUid,
                });
            }

            // 2. Validate required document types
            for (const docType of docTypes) {
                if (docType.isRequired === 1) {
                    const hasFile = documentItems.some(item => item.typeUid === docType.uid);
                    if (!hasFile) {
                        throw new CustomError(`Document of type '${docType.name}' is required`, 400);
                    }
                }
            }

            // 3. Validate file extensions and multiplicity
            const uploadCountByType = new Map<string, number>();
            for (const item of documentItems) {
                const docType = docTypeMap.get(item.typeUid);
                if (!docType) {
                    throw new CustomError(`Invalid product document type UID: ${item.typeUid}`, 400);
                }

                // Check allowed extensions
                const ext = path.extname(item.file.originalname).toLowerCase().replace(".", "");
                const allowed = docType.allowedExtensions.split(",").map(e => e.trim().toLowerCase());
                if (!allowed.includes(ext)) {
                    throw new CustomError(`File extension '.${ext}' is not allowed for document type '${docType.name}'. Allowed extensions: ${docType.allowedExtensions}`, 400);
                }

                // Count files per type
                const count = (uploadCountByType.get(item.typeUid) || 0) + 1;
                uploadCountByType.set(item.typeUid, count);
                if (docType.allowMultiple === 0 && count > 1) {
                    throw new CustomError(`Multiple files are not allowed for document type '${docType.name}'`, 400);
                }
            }

            // 4. Create Product record
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
                height: data.height,
                width: data.width,
                depth: data.depth,
                maxPower: data.maxPower,
                palletLength: data.palletLength,
                palletWidth: data.palletWidth,
                palletHeight: data.palletHeight,
                palletWeight: data.palletWeight,
                palletDimension: data.palletDimension,
                quantityPerPallet: data.quantityPerPallet,
                cellTechnology: data.cellTechnology,
                createdBy: userUid,
            }, client);

            // 5. Process and upload files
            for (const item of documentItems) {
                const docType = docTypeMap.get(item.typeUid)!;

                const fileUrl = await storageService.uploadFile(
                    item.file.buffer,
                    item.file.originalname,
                    item.file.mimetype,
                    `products/${productUid}/documents`
                );
                const storedFileName = path.basename(fileUrl) || item.file.originalname;

                await this.documentRepository.create(
                    tenantUid,
                    productUid,
                    docType.uid,
                    item.file.originalname,
                    storedFileName,
                    fileUrl,
                    item.file.mimetype,
                    item.file.size,
                    userUid,
                    client
                );

                if (docType.uid === productImagesTypeUid) {
                    productImages.push(fileUrl);
                }
            }

            // If images were uploaded, update the product record with images
            if (productImages.length > 0) {
                await this.repository.update(productUid, {
                    images: productImages,
                    updatedBy: userUid,
                }, client);
                product.images = productImages;
            }

            await client.query("COMMIT");

            const finalDocs = await this.documentRepository.getByProductUid(tenantUid, productUid);
            return toProductSafe(product, finalDocs);

        } catch (error) {
            await client.query("ROLLBACK");
            logger.error("ProductService.createProduct failed, transaction rolled back", { error });
            if (error instanceof CustomError) throw error;
            throw new CustomError("Failed to create product and documents", 500);
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

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // 1. Fetch active document types for this tenant
            const docTypes = await this.documentTypeRepository.findAllActive(tenantUid, client);
            const docTypeMap = new Map(docTypes.map(t => [t.uid, t]));

            const productImagesType = docTypes.find(t => t.name.toLowerCase() === "product images");
            const productImagesTypeUid = productImagesType?.uid || "8d6f51cb-1c09-411a-8260-249ebd7e8a15";

            // Map files to their target document type UIDs
            const documentItems: { file: Express.Multer.File; typeUid: string }[] = [];

            // Standard files uploaded under Option 2
            const uploadedFiles = files.filter(f => f.fieldname === "files");
            const documentTypeUids = data.documentTypeUids || [];

            if (uploadedFiles.length > 0) {
                if (uploadedFiles.length !== documentTypeUids.length) {
                    throw new CustomError("Number of uploaded files does not match the number of document type UIDs", 400);
                }
                for (let i = 0; i < uploadedFiles.length; i++) {
                    const file = uploadedFiles[i];
                    const typeUid = documentTypeUids[i];
                    if (file && typeUid) {
                        documentItems.push({ file, typeUid });
                    }
                }
            }

            // Maintain backward compatibility for old images fieldname
            const oldImageFiles = files.filter(f => f.fieldname === "images");
            for (const file of oldImageFiles) {
                documentItems.push({
                    file,
                    typeUid: productImagesTypeUid,
                });
            }

            // 2. Validate new files (extension & single-file multiplicity)
            const uploadCountByType = new Map<string, number>();
            for (const item of documentItems) {
                const docType = docTypeMap.get(item.typeUid);
                if (!docType) {
                    throw new CustomError(`Invalid product document type UID: ${item.typeUid}`, 400);
                }

                // Check allowed extensions
                const ext = path.extname(item.file.originalname).toLowerCase().replace(".", "");
                const allowed = docType.allowedExtensions.split(",").map(e => e.trim().toLowerCase());
                if (!allowed.includes(ext)) {
                    throw new CustomError(`File extension '.${ext}' is not allowed for document type '${docType.name}'. Allowed extensions: ${docType.allowedExtensions}`, 400);
                }

                const count = (uploadCountByType.get(item.typeUid) || 0) + 1;
                uploadCountByType.set(item.typeUid, count);
                if (docType.allowMultiple === 0 && count > 1) {
                    throw new CustomError(`Multiple files are not allowed for document type '${docType.name}'`, 400);
                }
            }

            // 3. Process soft deletion of requested documents
            const deleteUids = data.deleteDocumentUids || [];
            if (deleteUids.length > 0) {
                await this.documentRepository.softDeleteMultiple(tenantUid, deleteUids, userUid, client);
            }

            // 4. Handle replacement logic for allowMultiple = 0
            for (const item of documentItems) {
                const docType = docTypeMap.get(item.typeUid)!;

                if (docType.allowMultiple === 0) {
                    const existing = await this.documentRepository.getActiveDocumentsByType(tenantUid, uid, docType.uid, client);
                    if (existing.length > 0) {
                        await this.documentRepository.softDeleteMultiple(tenantUid, existing.map(d => d.uid), userUid, client);
                    }
                }
            }

            // 5. Upload new files and insert metadata
            const newProductImages: string[] = [];
            for (const item of documentItems) {
                const docType = docTypeMap.get(item.typeUid)!;

                const fileUrl = await storageService.uploadFile(
                    item.file.buffer,
                    item.file.originalname,
                    item.file.mimetype,
                    `products/${uid}/documents`
                );
                const storedFileName = path.basename(fileUrl) || item.file.originalname;

                await this.documentRepository.create(
                    tenantUid,
                    uid,
                    docType.uid,
                    item.file.originalname,
                    storedFileName,
                    fileUrl,
                    item.file.mimetype,
                    item.file.size,
                    userUid,
                    client
                );

                if (docType.uid === productImagesTypeUid) {
                    newProductImages.push(fileUrl);
                }
            }

            // 6. Validate isRequired constraint on all active documents for this product
            const activeDocs = await this.documentRepository.getByProductUid(tenantUid, uid, client);
            const activeDocsByFormat = new Map<string, typeof activeDocs>();
            for (const d of activeDocs) {
                if (!activeDocsByFormat.has(d.documentTypeUid)) {
                    activeDocsByFormat.set(d.documentTypeUid, []);
                }
                activeDocsByFormat.get(d.documentTypeUid)!.push(d);
            }

            for (const docType of docTypes) {
                if (docType.isRequired === 1) {
                    const count = activeDocsByFormat.get(docType.uid)?.length || 0;
                    if (count === 0) {
                        throw new CustomError(`Document of type '${docType.name}' is required`, 400);
                    }
                }
            }

            // 7. Update product image list inside products table
            let currentImages: string[] = [];
            if (data.existingImages !== undefined) {
                currentImages = [...data.existingImages];
            } else {
                currentImages = product.images ? [...product.images] : [];
            }

            if (deleteUids.length > 0) {
                const allProductDocsIncludingDeleted = await client.query(
                    `SELECT file_path FROM product_documents WHERE uid = ANY($1)`,
                    [deleteUids]
                );
                const deletedPaths = allProductDocsIncludingDeleted.rows.map(r => r.file_path);
                currentImages = currentImages.filter(img => !deletedPaths.includes(img));
            }

            const finalProductImages = [...currentImages, ...newProductImages];

            // 8. Update product record
            const { existingImages, deleteDocumentUids, documentTypeUids: docUids, ...repositoryData } = data;
            const updatedProduct = await this.repository.update(uid, {
                ...repositoryData,
                images: finalProductImages,
                updatedBy: userUid,
            }, client);

            if (!updatedProduct) {
                throw new CustomError(PRODUCT_MESSAGES.NOT_FOUND, 404);
            }

            await client.query("COMMIT");

            const finalDocs = await this.documentRepository.getByProductUid(tenantUid, uid);
            return toProductSafe(updatedProduct, finalDocs);

        } catch (error) {
            await client.query("ROLLBACK");
            logger.error("ProductService.updateProduct failed, transaction rolled back", { error });
            if (error instanceof CustomError) throw error;
            throw new CustomError("Failed to update product and documents", 500);
        } finally {
            client.release();
        }
    }

    async getProductByUid(uid: string, tenantUid: string): Promise<IProductSafe> {
        const product = await this.repository.findByUid(uid);
        if (!product) {
            throw new CustomError(PRODUCT_MESSAGES.NOT_FOUND, 404);
        }
        const documents = await this.documentRepository.getByProductUid(tenantUid, product.uid);
        return toProductSafe(product, documents);
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
