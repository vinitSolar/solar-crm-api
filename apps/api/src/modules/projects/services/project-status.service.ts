import type { ProjectStatusRepository } from "../repositories/project-status.repository.js";
import type { ICreateProjectStatus, IUpdateProjectStatus, IProjectStatusSafe } from "../interfaces/project.interface.js";
import { toProjectStatusSafe } from "../dto/project.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { PROJECT_STATUS_MESSAGES } from "../constants/project.constants.js";
import { logger } from "@packages/logger/index.js";
import { safeCacheGet, safeCacheSet, safeCacheDelPattern } from "@packages/redis/index.js";

export class ProjectStatusService {
    private readonly repository: ProjectStatusRepository;

    constructor(repository: ProjectStatusRepository) {
        this.repository = repository;
    }

    async createProjectStatus(tenantUid: string, data: ICreateProjectStatus, createdBy: string): Promise<IProjectStatusSafe> {
        logger.info("ProjectStatusService.createProjectStatus", { tenantUid });

        if (data.color && data.color.trim()) {
            const existing = await this.repository.getByColor(tenantUid, data.color.trim());
            if (existing) {
                throw new CustomError(PROJECT_STATUS_MESSAGES.COLOR_ALREADY_EXISTS, 400);
            }
        }

        try {
            const projectStatus = await this.repository.create(tenantUid, data, createdBy);
            await safeCacheDelPattern(`cache:project-statuses:*:${tenantUid}:*`);
            return toProjectStatusSafe(projectStatus);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
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
        const cacheKey = `cache:project-statuses:all:${tenantUid}:${status}`;
        const cached = await safeCacheGet<IProjectStatusSafe[]>(cacheKey);
        if (cached) {
            return cached;
        }

        const projectStatuses = await this.repository.getAll(tenantUid, status);
        const result = projectStatuses.map(toProjectStatusSafe);
        await safeCacheSet(cacheKey, result, 7200); // 2 hours
        return result;
    }

    async updateProjectStatus(tenantUid: string, uid: string, data: IUpdateProjectStatus, updatedBy: string): Promise<IProjectStatusSafe> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(PROJECT_STATUS_MESSAGES.NOT_FOUND, 404);
        }

        if (data.color !== undefined && data.color !== null && data.color.trim()) {
            const existingWithColor = await this.repository.getByColor(tenantUid, data.color.trim(), uid);
            if (existingWithColor) {
                throw new CustomError(PROJECT_STATUS_MESSAGES.COLOR_ALREADY_EXISTS, 400);
            }
        }

        try {
            const updated = await this.repository.update(tenantUid, uid, data, updatedBy);
            if (!updated) {
                throw new CustomError(PROJECT_STATUS_MESSAGES.UPDATE_FAILED, 500);
            }
            await safeCacheDelPattern(`cache:project-statuses:*:${tenantUid}:*`);
            return toProjectStatusSafe(updated);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
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
        await safeCacheDelPattern(`cache:project-statuses:*:${tenantUid}:*`);
    }

    async restoreProjectStatus(tenantUid: string, uid: string, updatedBy: string): Promise<void> {
        const existing = await this.repository.getByUidWithDeleted(tenantUid, uid);
        if (!existing) {
            throw new CustomError(PROJECT_STATUS_MESSAGES.NOT_FOUND, 404);
        }

        if (existing.color && existing.color.trim()) {
            const existingWithColor = await this.repository.getByColor(tenantUid, existing.color.trim(), uid);
            if (existingWithColor) {
                throw new CustomError(PROJECT_STATUS_MESSAGES.COLOR_ALREADY_EXISTS, 400);
            }
        }

        const success = await this.repository.restore(tenantUid, uid, updatedBy);
        if (!success) {
            throw new CustomError(PROJECT_STATUS_MESSAGES.RESTORE_FAILED, 404);
        }
        await safeCacheDelPattern(`cache:project-statuses:*:${tenantUid}:*`);
    }
}
