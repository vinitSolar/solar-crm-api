import type { LeadRepository } from "../repositories/lead.repository.js";
import type { LeadSourceRepository } from "../repositories/lead-source.repository.js";
import type { LeadStatusRepository } from "../repositories/lead-status.repository.js";
import type { ICreateLead, IUpdateLead, ILeadSafe, IPaginationQuery, IPaginatedResponse } from "../interfaces/lead.interface.js";
import { toLeadSafe } from "../dto/lead.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { LEAD_MESSAGES, LEAD_SOURCE_MESSAGES, LEAD_STATUS_MESSAGES } from "../constants/lead.constants.js";
import { logger } from "@packages/logger/index.js";

export class LeadService {
    private readonly repository: LeadRepository;
    private readonly sourceRepository: LeadSourceRepository;
    private readonly statusRepository: LeadStatusRepository;

    constructor(
        repository: LeadRepository,
        sourceRepository: LeadSourceRepository,
        statusRepository: LeadStatusRepository
    ) {
        this.repository = repository;
        this.sourceRepository = sourceRepository;
        this.statusRepository = statusRepository;
    }

    async createLead(tenantUid: string, data: ICreateLead, createdBy: string): Promise<ILeadSafe> {
        logger.info("LeadService.createLead", { tenantUid });

        // Ensure lead source belongs to this tenant if provided
        if (data.leadSourceUid) {
            const leadSource = await this.sourceRepository.getByUid(tenantUid, data.leadSourceUid);
            if (!leadSource) {
                throw new CustomError(LEAD_SOURCE_MESSAGES.NOT_FOUND, 400);
            }
        }

        const defaultStatus = await this.statusRepository.getDefault(tenantUid);
        if (!defaultStatus) {
            throw new CustomError("No default lead status found", 400);
        }
        
        const finalStatusUid = defaultStatus.uid;

        try {
            const lastLeadNumber = await this.repository.getLastLeadNumber();
            let nextLeadNumber = "SS00001";
            
            if (lastLeadNumber) {
                const numStr = lastLeadNumber.replace("SS", "");
                const nextNum = parseInt(numStr, 10) + 1;
                nextLeadNumber = `SS${String(nextNum).padStart(5, "0")}`;
            }

            const createData = { ...data, statusUid: finalStatusUid, leadNumber: nextLeadNumber };
            const lead = await this.repository.create(tenantUid, createData, createdBy);
            return toLeadSafe(lead);
        } catch (error) {
            logger.error("LeadService.createLead error", { error });
            throw new CustomError(LEAD_MESSAGES.CREATION_FAILED, 500);
        }
    }

    async getLeadByUid(tenantUid: string, uid: string): Promise<ILeadSafe> {
        const lead = await this.repository.getByUid(tenantUid, uid);
        if (!lead) {
            throw new CustomError(LEAD_MESSAGES.NOT_FOUND, 404);
        }
        return toLeadSafe(lead);
    }

    async getLeadsPaginated(tenantUid: string, query: IPaginationQuery): Promise<IPaginatedResponse<ILeadSafe>> {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = query.limit && query.limit > 0 ? query.limit : 10;
        
        const result = await this.repository.getPaginated(tenantUid, page, limit, query.search, query.status);

        return {
            data: result.rows.map(toLeadSafe),
            meta: {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit),
            },
        };
    }

    async getAllLeads(tenantUid: string, status: "active" | "deleted" | "all" = "active"): Promise<ILeadSafe[]> {
        const leads = await this.repository.getAll(tenantUid, status);
        return leads.map(toLeadSafe);
    }

    async updateLead(tenantUid: string, uid: string, data: IUpdateLead, updatedBy: string): Promise<ILeadSafe> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(LEAD_MESSAGES.NOT_FOUND, 404);
        }

        if (data.leadSourceUid) {
            const leadSource = await this.sourceRepository.getByUid(tenantUid, data.leadSourceUid);
            if (!leadSource) throw new CustomError(LEAD_SOURCE_MESSAGES.NOT_FOUND, 400);
        }

        if (data.statusUid) {
            const leadStatus = await this.statusRepository.getByUid(tenantUid, data.statusUid);
            if (!leadStatus) throw new CustomError(LEAD_STATUS_MESSAGES.NOT_FOUND, 400);
        }

        try {
            const updated = await this.repository.update(tenantUid, uid, data, updatedBy);
            if (!updated) {
                throw new CustomError(LEAD_MESSAGES.UPDATE_FAILED, 500);
            }
            return toLeadSafe(updated);
        } catch (error) {
            logger.error("LeadService.updateLead error", { error });
            throw new CustomError(LEAD_MESSAGES.UPDATE_FAILED, 500);
        }
    }

    async changeLeadStatus(tenantUid: string, uid: string, statusUid: string, updatedBy: string): Promise<ILeadSafe> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(LEAD_MESSAGES.NOT_FOUND, 404);
        }

        const leadStatus = await this.statusRepository.getByUid(tenantUid, statusUid);
        if (!leadStatus) throw new CustomError(LEAD_STATUS_MESSAGES.NOT_FOUND, 400);

        try {
            const updated = await this.repository.update(tenantUid, uid, { statusUid }, updatedBy);
            if (!updated) {
                throw new CustomError(LEAD_MESSAGES.UPDATE_FAILED, 500);
            }
            return toLeadSafe(updated);
        } catch (error) {
            logger.error("LeadService.changeLeadStatus error", { error });
            throw new CustomError(LEAD_MESSAGES.UPDATE_FAILED, 500);
        }
    }

    async deleteLead(tenantUid: string, uid: string, deletedBy: string): Promise<void> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(LEAD_MESSAGES.NOT_FOUND, 404);
        }

        const success = await this.repository.softDelete(tenantUid, uid, deletedBy);
        if (!success) {
            throw new CustomError(LEAD_MESSAGES.DELETE_FAILED, 500);
        }
    }

    async restoreLead(tenantUid: string, uid: string, updatedBy: string): Promise<void> {
        const success = await this.repository.restore(tenantUid, uid, updatedBy);
        if (!success) {
            throw new CustomError(LEAD_MESSAGES.RESTORE_FAILED, 404);
        }
    }
}
