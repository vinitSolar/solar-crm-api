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
import { storageService as storageServiceInstance } from "@packages/storage/index.js";

import { FranchiseDocumentTypeRepository } from "../repositories/franchise-document-type.repository.js";

/**
 * Franchise Service.
 *
 * Contains business logic for franchise operations.
 * Orchestrates transactional flows across multiple tables.
 */
export class FranchiseService {
    private readonly franchiseRepository: FranchiseRepository;
    private readonly franchiseOnboardingService: FranchiseOnboardingService;
    private readonly storageService: typeof storageServiceInstance;
    private readonly pool: Pool;
    private readonly franchiseDocumentTypeRepository: FranchiseDocumentTypeRepository;

    constructor(
        franchiseRepository: FranchiseRepository,
        franchiseOnboardingService: FranchiseOnboardingService,
        storageService: typeof storageServiceInstance,
        pool: Pool
    ) {
        this.franchiseRepository = franchiseRepository;
        this.franchiseOnboardingService = franchiseOnboardingService;
        this.storageService = storageService;
        this.pool = pool;
        this.franchiseDocumentTypeRepository = new FranchiseDocumentTypeRepository();
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

            if (data.serviceAreaCityUids && data.serviceAreaCityUids.length > 0) {
                const assignedCities = await this.franchiseRepository.checkCityAssignments(client, data.serviceAreaCityUids);
                if (assignedCities.length > 0) {
                    throw new CustomError("This city is already assigned to another franchise.", 409);
                }
            }

            const tenant = await this.franchiseRepository.createTenant(client, data.franchise, createdBy);
            logger.info("FranchiseService.createFranchise — tenant created", { tenantUid: tenant.uid });

            const ownerDetails = await this.franchiseRepository.createOwnerDetails(client, tenant.uid, data.owner, createdBy);
            logger.info("FranchiseService.createFranchise — owner details created", { tenantUid: tenant.uid });

            await this.franchiseRepository.createBusinessDetails(client, tenant.uid, data.business, createdBy);
            logger.info("FranchiseService.createFranchise — business details created", { tenantUid: tenant.uid });

            if (data.serviceAreaCityUids && data.serviceAreaCityUids.length > 0) {
                await this.franchiseRepository.insertServiceAreas(client, tenant.uid, data.serviceAreaCityUids, createdBy);
                logger.info("FranchiseService.createFranchise — service areas created", { tenantUid: tenant.uid });
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
        const serviceAreas = await this.franchiseRepository.getServiceAreasByTenantUid(uid);

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
            serviceAreas,
        };
    }

    async getServiceAreas(uid: string) {
        logger.info("FranchiseService.getServiceAreas", { uid });
        const existingTenant = await this.franchiseRepository.getFranchiseByUid(uid);
        if (!existingTenant) {
            throw new CustomError(FRANCHISE_MESSAGES.NOT_FOUND, 404);
        }
        return this.franchiseRepository.getServiceAreasByTenantUid(uid);
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

            // Service Areas Update
            if (data.serviceAreaCityUids) {
                const existingServiceAreas = await this.franchiseRepository.getServiceAreasByTenantUid(uid);
                const existingCityUids = existingServiceAreas.map(sa => sa.cityUid);

                const newCityUids = data.serviceAreaCityUids;
                const toAdd = newCityUids.filter(cityUid => !existingCityUids.includes(cityUid));
                const toRemove = existingCityUids.filter(cityUid => !newCityUids.includes(cityUid));

                if (toAdd.length > 0) {
                    const assignedCities = await this.franchiseRepository.checkCityAssignments(client, toAdd, uid);
                    if (assignedCities.length > 0) {
                        throw new CustomError("This city is already assigned to another franchise.", 409);
                    }
                    await this.franchiseRepository.insertServiceAreas(client, uid, toAdd, updatedBy);
                }

                if (toRemove.length > 0) {
                    await this.franchiseRepository.softDeleteSpecificServiceAreas(client, uid, toRemove, updatedBy);
                }
            }

            await client.query("COMMIT");
            logger.info("FranchiseService.updateFranchise — transaction committed", { tenantUid: uid });

            const owner = await this.franchiseRepository.getOwnerDetailsByTenantUid(uid);
            const business = await this.franchiseRepository.getBusinessDetailsByTenantUid(uid);
            const rawDocs = await this.franchiseRepository.getDocumentsByTenantUid(uid);
            const serviceAreas = await this.franchiseRepository.getServiceAreasByTenantUid(uid);

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
                serviceAreas,
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

    // ─── Documents ──────────────────────────────────────────────────

    async getDocumentTypes(tenantUid: string) {
        logger.info("FranchiseService.getDocumentTypes", { tenantUid });
        return this.franchiseDocumentTypeRepository.getActiveTypesByTenant(tenantUid);
    }

    async getDocuments(tenantUid: string) {
        logger.info("FranchiseService.getDocuments", { tenantUid });
        const rawDocs = await this.franchiseRepository.getDocumentsByTenantUid(tenantUid);
        return rawDocs.map(doc => {
            const safeDoc = toFranchiseDocumentSafe(doc);
            safeDoc.documentTypeName = doc.documentTypeName || "";
            return safeDoc;
        });
    }

    async uploadDocument(
        tenantUid: string,
        documentTypeUid: string,
        file: Express.Multer.File,
        documentNumber: string | undefined,
        createdBy: string
    ) {
        logger.info("FranchiseService.uploadDocument", { tenantUid, documentTypeUid });

        const docType = await this.franchiseDocumentTypeRepository.getByUid(documentTypeUid);
        if (!docType) {
            throw new CustomError("Document type not found", 404);
        }

        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            // Upload to storage
            const folderPath = `franchises/${tenantUid}/documents`;
            const fileUrl = await this.storageService.uploadFile(file.buffer, file.originalname, file.mimetype, folderPath);

            const payload: {
                documentNumber?: string;
                originalFileName: string;
                storedFileName: string;
                filePath: string;
                mimeType: string;
                fileSize: number;
            } = {
                originalFileName: file.originalname,
                storedFileName: fileUrl,
                filePath: fileUrl,
                mimeType: file.mimetype,
                fileSize: file.size
            };
            if (documentNumber !== undefined) {
                payload.documentNumber = documentNumber;
            }

            // Create db record
            const doc = await this.franchiseRepository.createDocument(
                client,
                tenantUid,
                documentTypeUid,
                payload,
                createdBy
            );

            await client.query("COMMIT");
            return toFranchiseDocumentSafe(doc);
        } catch (error) {
            await client.query("ROLLBACK");
            logger.error("FranchiseService.uploadDocument failed", { error });
            throw new CustomError("Failed to upload franchise document", 500);
        } finally {
            client.release();
        }
    }

    async deleteDocument(tenantUid: string, documentUid: string, deletedBy: string) {
        logger.info("FranchiseService.deleteDocument", { tenantUid, documentUid });

        const doc = await this.franchiseRepository.getDocumentByUid(tenantUid, documentUid);
        if (!doc) {
            throw new CustomError("Document not found", 404);
        }

        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            
            // Note: In a real scenario, you might also delete the file from storage
            // await this.storageService.deleteFile(doc.filePath);

            await this.franchiseRepository.softDeleteDocuments(client, tenantUid, [documentUid], deletedBy);

            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            logger.error("FranchiseService.deleteDocument failed", { error });
            throw new CustomError("Failed to delete franchise document", 500);
        } finally {
            client.release();
        }
    }
}
