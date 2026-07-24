import type { InstallationMilestoneRepository } from "../repositories/installation-milestone.repository.js";
import type { ICreateInstallationMilestone, IUpdateInstallationMilestone, IInstallationMilestoneSafe } from "../interfaces/installation-milestone.interface.js";
import { toInstallationMilestoneSafe } from "../dto/installation-milestone.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { INSTALLATION_MILESTONE_MESSAGES } from "../constants/installation-milestone.constants.js";
import { logger } from "@packages/logger/index.js";

export class InstallationMilestoneService {
    private readonly repository: InstallationMilestoneRepository;

    constructor(repository: InstallationMilestoneRepository) {
        this.repository = repository;
    }

    async createInstallationMilestone(tenantUid: string, data: ICreateInstallationMilestone, createdBy: string): Promise<IInstallationMilestoneSafe> {
        logger.info("InstallationMilestoneService.createInstallationMilestone", { tenantUid });
        try {
            const milestone = await this.repository.create(tenantUid, data, createdBy);
            return toInstallationMilestoneSafe(milestone);
        } catch (error) {
            logger.error("InstallationMilestoneService.createInstallationMilestone error", { error });
            throw new CustomError(INSTALLATION_MILESTONE_MESSAGES.CREATION_FAILED, 500);
        }
    }

    async getInstallationMilestoneByUid(tenantUid: string, uid: string): Promise<IInstallationMilestoneSafe> {
        const milestone = await this.repository.getByUid(tenantUid, uid);
        if (!milestone) {
            throw new CustomError(INSTALLATION_MILESTONE_MESSAGES.NOT_FOUND, 404);
        }
        return toInstallationMilestoneSafe(milestone);
    }

    async getAllInstallationMilestones(tenantUid: string, status: "active" | "deleted" | "all" = "active"): Promise<IInstallationMilestoneSafe[]> {
        const milestones = await this.repository.getAll(tenantUid, status);
        return milestones.map(toInstallationMilestoneSafe);
    }

    async updateInstallationMilestone(tenantUid: string, uid: string, data: IUpdateInstallationMilestone, updatedBy: string): Promise<IInstallationMilestoneSafe> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(INSTALLATION_MILESTONE_MESSAGES.NOT_FOUND, 404);
        }

        try {
            const updated = await this.repository.update(tenantUid, uid, data, updatedBy);
            if (!updated) {
                throw new CustomError(INSTALLATION_MILESTONE_MESSAGES.UPDATE_FAILED, 500);
            }
            return toInstallationMilestoneSafe(updated);
        } catch (error) {
            logger.error("InstallationMilestoneService.updateInstallationMilestone error", { error });
            throw new CustomError(INSTALLATION_MILESTONE_MESSAGES.UPDATE_FAILED, 500);
        }
    }

    async deleteInstallationMilestone(tenantUid: string, uid: string, deletedBy: string): Promise<void> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(INSTALLATION_MILESTONE_MESSAGES.NOT_FOUND, 404);
        }
        
        if (existing.isSystem === 1) {
            throw new CustomError(INSTALLATION_MILESTONE_MESSAGES.CANNOT_DELETE_SYSTEM, 400);
        }

        // Additional checks like "Cannot delete milestones already used by Projects" would go here.
        // For now, we allow soft delete which just prevents it from being added to NEW projects.

        const success = await this.repository.softDelete(tenantUid, uid, deletedBy);
        if (!success) {
            throw new CustomError(INSTALLATION_MILESTONE_MESSAGES.DELETE_FAILED, 500);
        }
    }

    async restoreInstallationMilestone(tenantUid: string, uid: string, updatedBy: string): Promise<void> {
        const success = await this.repository.restore(tenantUid, uid, updatedBy);
        if (!success) {
            throw new CustomError(INSTALLATION_MILESTONE_MESSAGES.RESTORE_FAILED, 404);
        }
    }
}
