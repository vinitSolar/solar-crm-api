import type { LeadSourceRepository } from "../repositories/lead-source.repository.js";
import type { ICreateLeadSource, IUpdateLeadSource, ILeadSourceSafe } from "../interfaces/lead.interface.js";
import { toLeadSourceSafe } from "../dto/lead.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { LEAD_SOURCE_MESSAGES } from "../constants/lead.constants.js";
import { logger } from "@packages/logger/index.js";

export class LeadSourceService {
    private readonly repository: LeadSourceRepository;

    constructor(repository: LeadSourceRepository) {
        this.repository = repository;
    }

    async createLeadSource(tenantUid: string, data: ICreateLeadSource, createdBy: string): Promise<ILeadSourceSafe> {
        logger.info("LeadSourceService.createLeadSource", { tenantUid });
        try {
            const leadSource = await this.repository.create(tenantUid, data, createdBy);
            return toLeadSourceSafe(leadSource);
        } catch (error) {
            logger.error("LeadSourceService.createLeadSource error", { error });
            throw new CustomError(LEAD_SOURCE_MESSAGES.CREATION_FAILED, 500);
        }
    }

    async getLeadSourceByUid(tenantUid: string, uid: string): Promise<ILeadSourceSafe> {
        const leadSource = await this.repository.getByUid(tenantUid, uid);
        if (!leadSource) {
            throw new CustomError(LEAD_SOURCE_MESSAGES.NOT_FOUND, 404);
        }
        return toLeadSourceSafe(leadSource);
    }

    async getAllLeadSources(tenantUid: string, status: "active" | "deleted" | "all" = "active"): Promise<ILeadSourceSafe[]> {
        const leadSources = await this.repository.getAll(tenantUid, status);
        return leadSources.map(toLeadSourceSafe);
    }

    async updateLeadSource(tenantUid: string, uid: string, data: IUpdateLeadSource, updatedBy: string): Promise<ILeadSourceSafe> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(LEAD_SOURCE_MESSAGES.NOT_FOUND, 404);
        }

        try {
            const updated = await this.repository.update(tenantUid, uid, data, updatedBy);
            if (!updated) {
                throw new CustomError(LEAD_SOURCE_MESSAGES.UPDATE_FAILED, 500);
            }
            return toLeadSourceSafe(updated);
        } catch (error) {
            logger.error("LeadSourceService.updateLeadSource error", { error });
            throw new CustomError(LEAD_SOURCE_MESSAGES.UPDATE_FAILED, 500);
        }
    }

    async deleteLeadSource(tenantUid: string, uid: string, deletedBy: string): Promise<void> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(LEAD_SOURCE_MESSAGES.NOT_FOUND, 404);
        }

        const success = await this.repository.softDelete(tenantUid, uid, deletedBy);
        if (!success) {
            throw new CustomError(LEAD_SOURCE_MESSAGES.DELETE_FAILED, 500);
        }
    }

    async restoreLeadSource(tenantUid: string, uid: string, updatedBy: string): Promise<void> {
        const success = await this.repository.restore(tenantUid, uid, updatedBy);
        if (!success) {
            throw new CustomError(LEAD_SOURCE_MESSAGES.RESTORE_FAILED, 404);
        }
    }
}
