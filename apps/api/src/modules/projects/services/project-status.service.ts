import type { ProjectStatusRepository } from "../repositories/project-status.repository.js";
import type { ICreateProjectStatus, IUpdateProjectStatus, IProjectStatusSafe } from "../interfaces/project.interface.js";
import { toProjectStatusSafe } from "../dto/project.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { PROJECT_STATUS_MESSAGES } from "../constants/project.constants.js";
import { logger } from "@packages/logger/index.js";

export class ProjectStatusService {
    private readonly repository: ProjectStatusRepository;

    constructor(repository: ProjectStatusRepository) {
        this.repository = repository;
    }

    async createProjectStatus(tenantUid: string, data: ICreateProjectStatus, createdBy: string): Promise<IProjectStatusSafe> {
        logger.info("ProjectStatusService.createProjectStatus", { tenantUid });
        try {
            const projectStatus = await this.repository.create(tenantUid, data, createdBy);
            return toProjectStatusSafe(projectStatus);
        } catch (error) {
            logger.error("ProjectStatusService.createProjectStatus error", { error });
            throw new CustomError(PROJECT_STATUS_MESSAGES.CREATION_FAILED, 500);
        }
    }

    async getProjectStatusByUid(tenantUid: string, uid: string): Promise<IProjectStatusSafe> {
        const projectStatus = await this.repository.getByUid(tenantUid, uid);
        if (!projectStatus) {
            throw new CustomError(PROJECT_STATUS_MESSAGES.NOT_FOUND, 404);
        }
        return toProjectStatusSafe(projectStatus);
    }

    async getAllProjectStatuses(tenantUid: string, status: "active" | "deleted" | "all" = "active"): Promise<IProjectStatusSafe[]> {
        const projectStatuses = await this.repository.getAll(tenantUid, status);
        return projectStatuses.map(toProjectStatusSafe);
    }

    async updateProjectStatus(tenantUid: string, uid: string, data: IUpdateProjectStatus, updatedBy: string): Promise<IProjectStatusSafe> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(PROJECT_STATUS_MESSAGES.NOT_FOUND, 404);
        }

        try {
            const updated = await this.repository.update(tenantUid, uid, data, updatedBy);
            if (!updated) {
                throw new CustomError(PROJECT_STATUS_MESSAGES.UPDATE_FAILED, 500);
            }
            return toProjectStatusSafe(updated);
        } catch (error) {
            logger.error("ProjectStatusService.updateProjectStatus error", { error });
            throw new CustomError(PROJECT_STATUS_MESSAGES.UPDATE_FAILED, 500);
        }
    }

    async deleteProjectStatus(tenantUid: string, uid: string, deletedBy: string): Promise<void> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(PROJECT_STATUS_MESSAGES.NOT_FOUND, 404);
        }

        const success = await this.repository.softDelete(tenantUid, uid, deletedBy);
        if (!success) {
            throw new CustomError(PROJECT_STATUS_MESSAGES.DELETE_FAILED, 500);
        }
    }

    async restoreProjectStatus(tenantUid: string, uid: string, updatedBy: string): Promise<void> {
        const success = await this.repository.restore(tenantUid, uid, updatedBy);
        if (!success) {
            throw new CustomError(PROJECT_STATUS_MESSAGES.RESTORE_FAILED, 404);
        }
    }
}
