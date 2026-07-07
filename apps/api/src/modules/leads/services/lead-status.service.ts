import type { LeadStatusRepository } from "../repositories/lead-status.repository.js";
import type { ICreateLeadStatus, IUpdateLeadStatus, ILeadStatusSafe } from "../interfaces/lead.interface.js";
import { toLeadStatusSafe } from "../dto/lead.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { LEAD_STATUS_MESSAGES } from "../constants/lead.constants.js";
import { logger } from "@packages/logger/index.js";

export class LeadStatusService {
    private readonly repository: LeadStatusRepository;

    constructor(repository: LeadStatusRepository) {
        this.repository = repository;
    }

    async createLeadStatus(tenantUid: string, data: ICreateLeadStatus, createdBy: string): Promise<ILeadStatusSafe> {
        logger.info("LeadStatusService.createLeadStatus", { tenantUid });
        try {
            const leadStatus = await this.repository.create(tenantUid, data, createdBy);
            return toLeadStatusSafe(leadStatus);
        } catch (error) {
            logger.error("LeadStatusService.createLeadStatus error", { error });
            throw new CustomError(LEAD_STATUS_MESSAGES.CREATION_FAILED, 500);
        }
    }

    async getLeadStatusByUid(tenantUid: string, uid: string): Promise<ILeadStatusSafe> {
        const leadStatus = await this.repository.getByUid(tenantUid, uid);
        if (!leadStatus) {
            throw new CustomError(LEAD_STATUS_MESSAGES.NOT_FOUND, 404);
        }
        return toLeadStatusSafe(leadStatus);
    }

    async getAllLeadStatuses(tenantUid: string, status: "active" | "deleted" | "all" = "active"): Promise<ILeadStatusSafe[]> {
        const leadStatuses = await this.repository.getAll(tenantUid, status);
        return leadStatuses.map(toLeadStatusSafe);
    }

    async updateLeadStatus(tenantUid: string, uid: string, data: IUpdateLeadStatus, updatedBy: string): Promise<ILeadStatusSafe> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(LEAD_STATUS_MESSAGES.NOT_FOUND, 404);
        }

        try {
            const updated = await this.repository.update(tenantUid, uid, data, updatedBy);
            if (!updated) {
                throw new CustomError(LEAD_STATUS_MESSAGES.UPDATE_FAILED, 500);
            }
            return toLeadStatusSafe(updated);
        } catch (error) {
            logger.error("LeadStatusService.updateLeadStatus error", { error });
            throw new CustomError(LEAD_STATUS_MESSAGES.UPDATE_FAILED, 500);
        }
    }

    async deleteLeadStatus(tenantUid: string, uid: string, deletedBy: string): Promise<void> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(LEAD_STATUS_MESSAGES.NOT_FOUND, 404);
        }

        const success = await this.repository.softDelete(tenantUid, uid, deletedBy);
        if (!success) {
            throw new CustomError(LEAD_STATUS_MESSAGES.DELETE_FAILED, 500);
        }
    }

    async restoreLeadStatus(tenantUid: string, uid: string, updatedBy: string): Promise<void> {
        const success = await this.repository.restore(tenantUid, uid, updatedBy);
        if (!success) {
            throw new CustomError(LEAD_STATUS_MESSAGES.RESTORE_FAILED, 404);
        }
    }
}
