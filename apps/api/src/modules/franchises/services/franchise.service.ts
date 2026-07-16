import type { Pool } from "pg";
import crypto from "crypto";
import type { FranchiseRepository } from "../repositories/franchise.repository.js";
import type {
    ICreateFranchiseRequest,
    ICreateFranchiseResponse,
    IUpdateFranchiseRequest,
    IFranchiseSafe,
    IFranchiseDetail,
    IFranchisePaginationQuery,
    IPaginatedFranchiseResponse,
} from "../interfaces/franchise.interface.js";
import { toCreateFranchiseDTO, toFranchiseSafe, toOwnerDetailsSafe, toBusinessDetailsSafe, toFranchiseDocumentSafe } from "../dto/franchise.dto.js";
import { FRANCHISE_MESSAGES } from "../constants/franchise.constants.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { logger } from "@packages/logger/index.js";
import type { FranchiseOnboardingService } from "./franchise-onboarding.service.js";
import type { FranchiseDocumentTypeRepository } from "../../franchise-document-types/repositories/franchise-document-type.repository.js";
import { storageService as storageServiceInstance } from "@packages/storage/index.js";

/**
 * Franchise Service.
 *
 * Contains business logic for franchise operations.
 * Orchestrates transactional flows across multiple tables.
 */
export class FranchiseService {
    private readonly franchiseRepository: FranchiseRepository;
    private readonly franchiseOnboardingService: FranchiseOnboardingService;
    private readonly documentTypeRepo: FranchiseDocumentTypeRepository;
    private readonly storageService: typeof storageServiceInstance;
    private readonly pool: Pool;

    constructor(
        franchiseRepository: FranchiseRepository,
        franchiseOnboardingService: FranchiseOnboardingService,
        documentTypeRepo: FranchiseDocumentTypeRepository,
        storageService: typeof storageServiceInstance,
        pool: Pool
    ) {
        this.franchiseRepository = franchiseRepository;
        this.franchiseOnboardingService = franchiseOnboardingService;
        this.documentTypeRepo = documentTypeRepo;
        this.storageService = storageService;
        this.pool = pool;
    }

    async updateLogo(uid: string, logoUrl: string, updatedBy: string): Promise<string> {
        logger.info("FranchiseService.updateLogo", { uid, logoUrl });

        const existingTenant = await this.franchiseRepository.getFranchiseByUid(uid);
        if (!existingTenant) {
            throw new CustomError(FRANCHISE_MESSAGES.NOT_FOUND, 404);
        }

        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            await this.franchiseRepository.updateTenant(client, uid, { logo: logoUrl }, updatedBy);
            await client.query("COMMIT");
            return logoUrl;
        } catch (error) {
            await client.query("ROLLBACK");
            logger.error("FranchiseService.updateLogo failed", { error });
            throw new CustomError("Failed to update franchise logo", 500);
        } finally {
            client.release();
        }
    }

    // ─── Create ─────────────────────────────────────────────────────

    async createFranchise(data: ICreateFranchiseRequest, createdBy: string): Promise<ICreateFranchiseResponse> {
        const existingTenant = await this.franchiseRepository.findTenantByCode(data.franchise.code);
        if (existingTenant) {
            throw new CustomError(FRANCHISE_MESSAGES.CODE_ALREADY_EXISTS, 409);
        }

        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            const tenant = await this.franchiseRepository.createTenant(client, data.franchise, createdBy);
            logger.info("FranchiseService.createFranchise — tenant created", { tenantUid: tenant.uid });

            const ownerDetails = await this.franchiseRepository.createOwnerDetails(client, tenant.uid, data.owner, createdBy);
            logger.info("FranchiseService.createFranchise — owner details created", { tenantUid: tenant.uid });

            await this.franchiseRepository.createBusinessDetails(client, tenant.uid, data.business, createdBy);
            logger.info("FranchiseService.createFranchise — business details created", { tenantUid: tenant.uid });

            // Process Document Uploads
            if (data.documentFiles && data.documentFiles.length > 0) {
                const typeUids = data.documentTypeUids || [];
                const numbers = data.documentNumbers || [];

                for (let i = 0; i < data.documentFiles.length; i++) {
                    const file = data.documentFiles[i];
                    const docTypeUid = typeUids[i];
                    const docNumber = numbers[i];

                    if (!file || !docTypeUid) continue;

                    const docType = await this.documentTypeRepo.getByUid(tenant.uid, docTypeUid, client);
                    if (!docType) continue;

                    // If allow_multiple is 0, we might want to enforce it even on create if they upload duplicates,
                    // but we'll handle the strict cleanup on updates.

                    const folder = `franchises/${tenant.uid}/documents`;
                    const { url: fileUrl, path: storedFileName } = await this.storageService.uploadFileWithPath(
                        file.buffer,
                        file.originalname,
                        file.mimetype,
                        folder
                    );

                    const docData: any = {
                        originalFileName: file.originalname,
                        storedFileName,
                        filePath: fileUrl,
                        mimeType: file.mimetype,
                        fileSize: file.size,
                    };
                    if (docNumber) docData.documentNumber = docNumber;

                    await this.franchiseRepository.createDocument(
                        client,
                        tenant.uid,
                        docTypeUid,
                        docData,
                        createdBy
                    );
                }
                logger.info("FranchiseService.createFranchise — documents processed", { tenantUid: tenant.uid });
            }

            await client.query("COMMIT");
            logger.info("FranchiseService.createFranchise — transaction committed", { tenantUid: tenant.uid });

            // Post-creation onboarding: Setup default roles and admin user
            // We run this outside the main franchise creation transaction so a failure here
            // doesn't rollback the tenant creation, but rather can be retried or logged.
            const credentials = await this.franchiseOnboardingService.setupDefaultRolesAndAdmin(
                tenant.uid,
                ownerDetails,
                createdBy
            );

            return toCreateFranchiseDTO(tenant, credentials);
        } catch (error) {
            await client.query("ROLLBACK");
            logger.error("FranchiseService.createFranchise — transaction rolled back", { error });

            if (error instanceof CustomError) throw error;
            throw new CustomError(FRANCHISE_MESSAGES.CREATION_FAILED, 500);
        } finally {
            client.release();
        }
    }

    // ─── Read ───────────────────────────────────────────────────────

    async getFranchisesByPagination(query: IFranchisePaginationQuery): Promise<IPaginatedFranchiseResponse> {
        logger.info("FranchiseService.getFranchisesByPagination", { query });

        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = query.limit && query.limit > 0 ? query.limit : 10;

        const result = await this.franchiseRepository.getPaginatedFranchises(page, limit, query.search, query.status);

        return {
            data: result.rows.map(toFranchiseSafe),
            meta: {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit),
            },
        };
    }

    async getAllFranchises(status: "active" | "deleted" | "all" = "active"): Promise<IFranchiseSafe[]> {
        logger.info("FranchiseService.getAllFranchises", { status });
        const franchises = await this.franchiseRepository.getAllFranchises(status);
        return franchises.map(toFranchiseSafe);
    }

    async getFranchiseByUid(uid: string): Promise<IFranchiseDetail> {
        logger.info("FranchiseService.getFranchiseByUid", { uid });

        const tenant = await this.franchiseRepository.getFranchiseByUid(uid);
        if (!tenant) {
            throw new CustomError(FRANCHISE_MESSAGES.NOT_FOUND, 404);
        }

        const owner = await this.franchiseRepository.getOwnerDetailsByTenantUid(uid);
        const business = await this.franchiseRepository.getBusinessDetailsByTenantUid(uid);
        const rawDocs = await this.franchiseRepository.getDocumentsByTenantUid(uid);

        const documents = rawDocs.map(doc => {
            const safeDoc = toFranchiseDocumentSafe(doc);
            safeDoc.documentTypeName = doc.documentTypeName || "";
            return safeDoc;
        });

        return {
            franchise: toFranchiseSafe(tenant),
            owner: owner ? toOwnerDetailsSafe(owner) : null,
            business: business ? toBusinessDetailsSafe(business) : null,
            documents,
        };
    }

    // ─── Update ─────────────────────────────────────────────────────

    async updateFranchise(uid: string, data: IUpdateFranchiseRequest, updatedBy: string): Promise<IFranchiseDetail> {
        logger.info("FranchiseService.updateFranchise", { uid });

        const existingTenant = await this.franchiseRepository.getFranchiseByUid(uid);
        if (!existingTenant) {
            throw new CustomError(FRANCHISE_MESSAGES.NOT_FOUND, 404);
        }

        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            let updatedTenant = existingTenant;
            if (data.franchise) {
                const result = await this.franchiseRepository.updateTenant(client, uid, data.franchise, updatedBy);
                if (result) updatedTenant = result;
            }

            if (data.owner) {
                await this.franchiseRepository.updateOwnerDetails(client, uid, data.owner, updatedBy);
            }

            if (data.business) {
                await this.franchiseRepository.updateBusinessDetails(client, uid, data.business, updatedBy);
            }

            // Document Deletions
            if (data.deleteDocumentUids && data.deleteDocumentUids.length > 0) {
                await this.franchiseRepository.softDeleteDocuments(client, uid, data.deleteDocumentUids, updatedBy);
            }

            // Document Uploads
            if (data.documentFiles && data.documentFiles.length > 0) {
                const typeUids = data.documentTypeUids || [];
                const numbers = data.documentNumbers || [];

                for (let i = 0; i < data.documentFiles.length; i++) {
                    const file = data.documentFiles[i];
                    const docTypeUid = typeUids[i];
                    const docNumber = numbers[i];

                    if (!file || !docTypeUid) continue;

                    const docType = await this.documentTypeRepo.getByUid(uid, docTypeUid, client);
                    if (!docType) continue;

                    // If allow_multiple = 0, replace existing
                    if (docType.allowMultiple === 0) {
                        const existingDocs = await this.franchiseRepository.getDocumentsByTenantAndType(client, uid, docTypeUid);
                        const existingUids = existingDocs.map(d => d.uid);
                        if (existingUids.length > 0) {
                            await this.franchiseRepository.softDeleteDocuments(client, uid, existingUids, updatedBy);
                        }
                    }

                    const folder = `franchises/${uid}/documents`;
                    const { url: fileUrl, path: storedFileName } = await this.storageService.uploadFileWithPath(
                        file.buffer,
                        file.originalname,
                        file.mimetype,
                        folder
                    );

                    const docData: any = {
                        originalFileName: file.originalname,
                        storedFileName,
                        filePath: fileUrl,
                        mimeType: file.mimetype,
                        fileSize: file.size,
                    };
                    if (docNumber) docData.documentNumber = docNumber;

                    await this.franchiseRepository.createDocument(
                        client,
                        uid,
                        docTypeUid,
                        docData,
                        updatedBy
                    );
                }
            }

            await client.query("COMMIT");
            logger.info("FranchiseService.updateFranchise — transaction committed", { tenantUid: uid });

            const owner = await this.franchiseRepository.getOwnerDetailsByTenantUid(uid);
            const business = await this.franchiseRepository.getBusinessDetailsByTenantUid(uid);
            const rawDocs = await this.franchiseRepository.getDocumentsByTenantUid(uid);

            const documents = rawDocs.map(doc => {
                const safeDoc = toFranchiseDocumentSafe(doc);
                safeDoc.documentTypeName = doc.documentTypeName || "";
                return safeDoc;
            });

            return {
                franchise: toFranchiseSafe(updatedTenant),
                owner: owner ? toOwnerDetailsSafe(owner) : null,
                business: business ? toBusinessDetailsSafe(business) : null,
                documents,
            };
        } catch (error) {
            await client.query("ROLLBACK");
            logger.error("FranchiseService.updateFranchise — transaction rolled back", { error });

            if (error instanceof CustomError) throw error;
            throw new CustomError(FRANCHISE_MESSAGES.UPDATE_FAILED, 500);
        } finally {
            client.release();
        }
    }

    // ─── Delete / Restore ───────────────────────────────────────────

    async deleteFranchise(uid: string, deletedBy: string): Promise<void> {
        logger.info("FranchiseService.deleteFranchise", { uid });

        const existingTenant = await this.franchiseRepository.getFranchiseByUid(uid);
        if (!existingTenant) {
            throw new CustomError(FRANCHISE_MESSAGES.NOT_FOUND, 404);
        }

        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            const success = await this.franchiseRepository.softDeleteFranchise(client, uid, deletedBy);
            if (!success) {
                throw new CustomError(FRANCHISE_MESSAGES.DELETE_FAILED, 500);
            }

            await client.query("COMMIT");
            logger.info("FranchiseService.deleteFranchise — transaction committed", { tenantUid: uid });
        } catch (error) {
            await client.query("ROLLBACK");
            logger.error("FranchiseService.deleteFranchise — transaction rolled back", { error });

            if (error instanceof CustomError) throw error;
            throw new CustomError(FRANCHISE_MESSAGES.DELETE_FAILED, 500);
        } finally {
            client.release();
        }
    }

    async restoreFranchise(uid: string, updatedBy: string): Promise<void> {
        logger.info("FranchiseService.restoreFranchise", { uid });

        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            const success = await this.franchiseRepository.restoreFranchise(client, uid, updatedBy);
            if (!success) {
                throw new CustomError(FRANCHISE_MESSAGES.RESTORE_FAILED, 404);
            }

            await client.query("COMMIT");
            logger.info("FranchiseService.restoreFranchise — transaction committed", { tenantUid: uid });
        } catch (error) {
            await client.query("ROLLBACK");
            logger.error("FranchiseService.restoreFranchise — transaction rolled back", { error });

            if (error instanceof CustomError) throw error;
            throw new CustomError(FRANCHISE_MESSAGES.RESTORE_FAILED, 500);
        } finally {
            client.release();
        }
    }
    async addDocument(uid: string, documentTypeUid: string, documentNumber: string | undefined, file: Express.Multer.File, updatedBy: string) {
        logger.info("FranchiseService.addDocument", { uid, documentTypeUid });

        const existingTenant = await this.franchiseRepository.getFranchiseByUid(uid);
        if (!existingTenant) {
            throw new CustomError(FRANCHISE_MESSAGES.NOT_FOUND, 404);
        }

        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            const docType = await this.documentTypeRepo.getByUid(uid, documentTypeUid, client);
            if (!docType) {
                throw new CustomError("Invalid Document Type", 400);
            }

            // If allow_multiple = 0, replace existing
            if (docType.allowMultiple === 0) {
                const existingDocs = await this.franchiseRepository.getDocumentsByTenantAndType(client, uid, documentTypeUid);
                const existingUids = existingDocs.map(d => d.uid);
                if (existingUids.length > 0) {
                    await this.franchiseRepository.softDeleteDocuments(client, uid, existingUids, updatedBy);
                }
            }

            const folder = `franchises/${uid}/documents`;
            const { url: fileUrl, path: storedFileName } = await this.storageService.uploadFileWithPath(
                file.buffer,
                file.originalname,
                file.mimetype,
                folder
            );

            const docData: any = {
                originalFileName: file.originalname,
                storedFileName,
                filePath: fileUrl,
                mimeType: file.mimetype,
                fileSize: file.size,
            };
            if (documentNumber) docData.documentNumber = documentNumber;

            const document = await this.franchiseRepository.createDocument(
                client,
                uid,
                documentTypeUid,
                docData,
                updatedBy
            );
            
            await client.query("COMMIT");
            
            const safeDoc = toFranchiseDocumentSafe(document);
            safeDoc.documentTypeName = docType.name || "";
            return safeDoc;

        } catch (error) {
            await client.query("ROLLBACK");
            logger.error("FranchiseService.addDocument failed", { error });
            if (error instanceof CustomError) throw error;
            throw new CustomError("Failed to add document", 500);
        } finally {
            client.release();
        }
    }
}
