import type { Pool } from "pg";
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
import { toCreateFranchiseDTO, toFranchiseSafe, toOwnerDetailsSafe, toBusinessDetailsSafe } from "../dto/franchise.dto.js";
import { FRANCHISE_MESSAGES } from "../constants/franchise.constants.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { logger } from "@packages/logger/index.js";
import type { FranchiseOnboardingService } from "./franchise-onboarding.service.js";

/**
 * Franchise Service.
 *
 * Contains business logic for franchise operations.
 * Orchestrates transactional flows across multiple tables.
 */
export class FranchiseService {
    private readonly franchiseRepository: FranchiseRepository;
    private readonly franchiseOnboardingService: FranchiseOnboardingService;
    private readonly pool: Pool;

    constructor(
        franchiseRepository: FranchiseRepository,
        franchiseOnboardingService: FranchiseOnboardingService,
        pool: Pool
    ) {
        this.franchiseRepository = franchiseRepository;
        this.franchiseOnboardingService = franchiseOnboardingService;
        this.pool = pool;
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
            logger.info("FranchiseService.createFranchise — tenant created", { franchiseUid: tenant.uid });

            const ownerDetails = await this.franchiseRepository.createOwnerDetails(client, tenant.uid, data.owner, createdBy);
            logger.info("FranchiseService.createFranchise — owner details created", { franchiseUid: tenant.uid });

            await this.franchiseRepository.createBusinessDetails(client, tenant.uid, data.business, createdBy);
            logger.info("FranchiseService.createFranchise — business details created", { franchiseUid: tenant.uid });

            await client.query("COMMIT");
            logger.info("FranchiseService.createFranchise — transaction committed", { franchiseUid: tenant.uid });

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

        const owner = await this.franchiseRepository.getOwnerDetailsByFranchiseUid(uid);
        const business = await this.franchiseRepository.getBusinessDetailsByFranchiseUid(uid);

        return {
            franchise: toFranchiseSafe(tenant),
            owner: owner ? toOwnerDetailsSafe(owner) : null,
            business: business ? toBusinessDetailsSafe(business) : null,
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

            await client.query("COMMIT");
            logger.info("FranchiseService.updateFranchise — transaction committed", { franchiseUid: uid });

            const owner = await this.franchiseRepository.getOwnerDetailsByFranchiseUid(uid);
            const business = await this.franchiseRepository.getBusinessDetailsByFranchiseUid(uid);

            return {
                franchise: toFranchiseSafe(updatedTenant),
                owner: owner ? toOwnerDetailsSafe(owner) : null,
                business: business ? toBusinessDetailsSafe(business) : null,
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
            logger.info("FranchiseService.deleteFranchise — transaction committed", { franchiseUid: uid });
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
            logger.info("FranchiseService.restoreFranchise — transaction committed", { franchiseUid: uid });
        } catch (error) {
            await client.query("ROLLBACK");
            logger.error("FranchiseService.restoreFranchise — transaction rolled back", { error });

            if (error instanceof CustomError) throw error;
            throw new CustomError(FRANCHISE_MESSAGES.RESTORE_FAILED, 500);
        } finally {
            client.release();
        }
    }
}
