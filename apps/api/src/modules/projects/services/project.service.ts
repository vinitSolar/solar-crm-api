import type { ProjectRepository } from "../repositories/project.repository.js";
import type { ProjectStatusRepository } from "../repositories/project-status.repository.js";
import type { QuotationRepository } from "../../quotations/repositories/quotation.repository.js";
import type { StateSubsidyRuleRepository } from "../../state-subsidy-rules/repositories/state-subsidy-rule.repository.js";
import type { SubsidyRequiredDocumentRepository, ICombinedRequiredDocumentDetail } from "../../state-subsidy-rules/repositories/subsidy-required-document.repository.js";
import type { ProjectSubsidyDocumentRepository, IProjectSubsidyDocument } from "../repositories/project-subsidy-document.repository.js";
import type { AuditLogService } from "../../audit-logs/services/audit-logs.service.js";
import type { ICreateProject, IUpdateProject, IProjectSafe, IPaginationQuery, IPaginatedResponse } from "../interfaces/project.interface.js";
import { toProjectSafe } from "../dto/project.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { PROJECT_MESSAGES, PROJECT_STATUS_MESSAGES } from "../constants/project.constants.js";
import { AUDIT_LOG_ACTIONS } from "../../audit-logs/constants/audit-logs.constants.js";
import { logger } from "@packages/logger/index.js";

export class ProjectService {
    private readonly repository: ProjectRepository;
    private readonly statusRepository: ProjectStatusRepository;
    private readonly quotationRepository: QuotationRepository;
    private readonly subsidyRuleRepository: StateSubsidyRuleRepository;
    private readonly requiredDocRepository: SubsidyRequiredDocumentRepository;
    private readonly subsidyDocumentRepository: ProjectSubsidyDocumentRepository;
    private readonly auditLogService: AuditLogService;

    constructor(
        repository: ProjectRepository,
        statusRepository: ProjectStatusRepository,
        subsidyDocumentRepository: ProjectSubsidyDocumentRepository,
        quotationRepository: QuotationRepository,
        subsidyRuleRepository: StateSubsidyRuleRepository,
        requiredDocRepository: SubsidyRequiredDocumentRepository,
        auditLogService: AuditLogService
    ) {
        this.repository = repository;
        this.statusRepository = statusRepository;
        this.subsidyDocumentRepository = subsidyDocumentRepository;
        this.quotationRepository = quotationRepository;
        this.subsidyRuleRepository = subsidyRuleRepository;
        this.requiredDocRepository = requiredDocRepository;
        this.auditLogService = auditLogService;
    }

    async createProject(tenantUid: string, data: ICreateProject, createdBy: string, ipAddress?: string, userAgent?: string): Promise<IProjectSafe> {
        logger.info("ProjectService.createProject", { tenantUid, quotationUid: data.quotationUid });

        // 1. Validate quotation
        const quotation = await this.quotationRepository.findByUid(tenantUid, data.quotationUid);
        if (!quotation) {
            throw new CustomError(PROJECT_MESSAGES.QUOTATION_NOT_FOUND, 404);
        }

        // status 2 = Approved, status 4 = Converted
        if (quotation.status !== 2 && quotation.status !== 4) {
            throw new CustomError(PROJECT_MESSAGES.QUOTATION_NOT_APPROVED, 400);
        }

        // 2. Check if an active project already exists for this quotation
        const existingProject = await this.repository.getActiveProjectByQuotationUid(tenantUid, data.quotationUid);
        if (existingProject) {
            throw new CustomError(PROJECT_MESSAGES.ALREADY_EXISTS, 400);
        }

        // 3. Get default project status
        let defaultStatus = await this.statusRepository.getDefault(tenantUid);
        if (!defaultStatus) {
            const activeStatuses = await this.statusRepository.getAll(tenantUid, "active");
            if (activeStatuses.length > 0 && activeStatuses[0]) {
                defaultStatus = activeStatuses[0];
            }
        }
        if (!defaultStatus) {
            throw new CustomError("No default project status found. Please create one.", 400);
        }

        // 4. Generate Project Number
        const projectNumber = await this.repository.generateProjectNumber(tenantUid);

        // 5. Insert Project
        const createData = {
            ...data,
            leadUid: quotation.leadUid,
            statusUid: defaultStatus.uid,
            projectNumber
        };

        try {
            const project = await this.repository.create(tenantUid, createData, createdBy);

            // Audit Log
            await this.auditLogService.log({
                tenantUid,
                module: "Project",
                recordUid: project.uid,
                action: AUDIT_LOG_ACTIONS.CREATE,
                message: `Project ${project.projectNumber} created from Quotation ${quotation.quotationNumber}.`,
                ipAddress,
                userAgent,
                createdBy
            });

            return toProjectSafe(project);
        } catch (error) {
            logger.error("ProjectService.createProject error", {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(PROJECT_MESSAGES.CREATION_FAILED, 500);
        }
    }

    async getProjectByUid(tenantUid: string, uid: string): Promise<IProjectSafe> {
        const project = await this.repository.getByUid(tenantUid, uid);
        if (!project) {
            throw new CustomError(PROJECT_MESSAGES.NOT_FOUND, 404);
        }
        return toProjectSafe(project);
    }

    async getProjectRequiredSubsidyDocuments(
        tenantUid: string,
        uid: string,
        subsidyUids?: string[]
    ): Promise<(ICombinedRequiredDocumentDetail & { isUploaded: boolean; fileUrl: string | null; uploadedByUid: string | null; uploadedByName: string | null; uploadedAt: Date | null })[]> {
        const projectInfo = await this.repository.getProjectLeadState(tenantUid, uid);
        if (!projectInfo) {
            throw new CustomError(PROJECT_MESSAGES.NOT_FOUND, 404);
        }

        let targetSubsidyUids = subsidyUids || [];

        // Auto-resolve subsidy rules matching project's customer state if not explicitly specified
        if (targetSubsidyUids.length === 0 && projectInfo.state) {
            const rules = await this.subsidyRuleRepository.findByStateUidOrAll(projectInfo.state);
            targetSubsidyUids = rules.map((r) => r.uid);
        }

        if (targetSubsidyUids.length === 0) {
            return [];
        }

        const requiredDocs = await this.requiredDocRepository.getCombinedRequiredDocuments(targetSubsidyUids);
        const uploadedDocs = await this.subsidyDocumentRepository.getByProjectUid(uid, tenantUid);

        return requiredDocs.map(doc => {
            const uploaded = uploadedDocs.find(u => u.documentTypeUid === doc.documentTypeUid);
            return {
                ...doc,
                isUploaded: !!uploaded,
                fileUrl: uploaded ? uploaded.fileUrl : null,
                uploadedByUid: uploaded?.createdBy || null,
                uploadedByName: uploaded?.createdByName || null,
                uploadedAt: uploaded?.createdAt || null
            };
        });
    }

    async getProjectsPaginated(tenantUid: string, query: IPaginationQuery): Promise<IPaginatedResponse<IProjectSafe>> {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = query.limit && query.limit > 0 ? query.limit : 10;
        
        const filters: { projectStatusUid?: string; projectManagerUid?: string; startDate?: string; endDate?: string } = {};
        if (query.projectStatusUid !== undefined) filters.projectStatusUid = query.projectStatusUid;
        if (query.projectManagerUid !== undefined) filters.projectManagerUid = query.projectManagerUid;
        if (query.startDate !== undefined) filters.startDate = query.startDate;
        if (query.endDate !== undefined) filters.endDate = query.endDate;

        const result = await this.repository.getPaginated(tenantUid, page, limit, query.search, query.status, filters);

        return {
            data: result.rows.map(toProjectSafe),
            meta: {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit),
            },
        };
    }

    async updateProject(tenantUid: string, uid: string, data: IUpdateProject, updatedBy: string, ipAddress?: string, userAgent?: string): Promise<IProjectSafe> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(PROJECT_MESSAGES.NOT_FOUND, 404);
        }

        if (data.projectStatusUid) {
            const status = await this.statusRepository.getByUid(tenantUid, data.projectStatusUid);
            if (!status) throw new CustomError(PROJECT_STATUS_MESSAGES.NOT_FOUND, 400);
        }

        try {
            const updated = await this.repository.update(tenantUid, uid, data, updatedBy);
            if (!updated) {
                throw new CustomError(PROJECT_MESSAGES.UPDATE_FAILED, 500);
            }

            await this.auditLogService.logUpdate({
                tenantUid,
                module: "Project",
                recordUid: uid,
                oldRecord: existing,
                newRecord: updated,
                ipAddress,
                userAgent,
                createdBy: updatedBy
            });

            return toProjectSafe(updated);
        } catch (error) {
            logger.error("ProjectService.updateProject error", {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(PROJECT_MESSAGES.UPDATE_FAILED, 500);
        }
    }

    async assignProjectManager(tenantUid: string, uid: string, projectManagerUid: string, updatedBy: string, ipAddress?: string, userAgent?: string): Promise<IProjectSafe> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(PROJECT_MESSAGES.NOT_FOUND, 404);
        }

        try {
            const updated = await this.repository.update(tenantUid, uid, { projectManagerUid }, updatedBy);
            if (!updated) {
                throw new CustomError(PROJECT_MESSAGES.UPDATE_FAILED, 500);
            }

            await this.auditLogService.log({
                tenantUid,
                module: "Project",
                recordUid: uid,
                action: AUDIT_LOG_ACTIONS.UPDATE,
                message: `Assigned project manager to Project ${existing.projectNumber}.`,
                ipAddress,
                userAgent,
                createdBy: updatedBy
            });

            return toProjectSafe(updated);
        } catch (error) {
            logger.error("ProjectService.assignProjectManager error", {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(PROJECT_MESSAGES.UPDATE_FAILED, 500);
        }
    }

    async changeProjectStatus(tenantUid: string, uid: string, statusUid: string, updatedBy: string, ipAddress?: string, userAgent?: string): Promise<IProjectSafe> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(PROJECT_MESSAGES.NOT_FOUND, 404);
        }

        const newStatus = await this.statusRepository.getByUid(tenantUid, statusUid);
        if (!newStatus) throw new CustomError(PROJECT_STATUS_MESSAGES.NOT_FOUND, 400);

        try {
            const updated = await this.repository.update(tenantUid, uid, { projectStatusUid: statusUid }, updatedBy);
            if (!updated) {
                throw new CustomError(PROJECT_MESSAGES.UPDATE_FAILED, 500);
            }

            await this.auditLogService.log({
                tenantUid,
                module: "Project",
                recordUid: uid,
                action: AUDIT_LOG_ACTIONS.UPDATE,
                message: `Project status changed from '${existing.statusName}' to '${newStatus.name}'.`,
                ipAddress,
                userAgent,
                createdBy: updatedBy
            });

            return toProjectSafe(updated);
        } catch (error) {
            logger.error("ProjectService.changeProjectStatus error", {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(PROJECT_MESSAGES.UPDATE_FAILED, 500);
        }
    }

    async deleteProject(tenantUid: string, uid: string, deletedBy: string, ipAddress?: string, userAgent?: string): Promise<void> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(PROJECT_MESSAGES.NOT_FOUND, 404);
        }

        const success = await this.repository.softDelete(tenantUid, uid, deletedBy);
        if (!success) {
            throw new CustomError(PROJECT_MESSAGES.DELETE_FAILED, 500);
        }

        await this.auditLogService.log({
            tenantUid,
            module: "Project",
            recordUid: uid,
            action: AUDIT_LOG_ACTIONS.DELETE,
            message: `Project ${existing.projectNumber} was deleted.`,
            ipAddress,
            userAgent,
            createdBy: deletedBy
        });
    }

    async restoreProject(tenantUid: string, uid: string, updatedBy: string, ipAddress?: string, userAgent?: string): Promise<void> {
        const success = await this.repository.restore(tenantUid, uid, updatedBy);
        if (!success) {
            throw new CustomError(PROJECT_MESSAGES.RESTORE_FAILED, 404);
        }

        await this.auditLogService.log({
            tenantUid,
            module: "Project",
            recordUid: uid,
            action: AUDIT_LOG_ACTIONS.UPDATE, // or restore
            message: `Project was restored.`,
            ipAddress,
            userAgent,
            createdBy: updatedBy
        });
    }

    async addSubsidyDocument(
        tenantUid: string,
        projectUid: string,
        data: {
            documentTypeUid: string;
            originalName: string;
            fileName: string;
            fileUrl: string;
            mimeType: string;
            fileSize: number;
            remarks?: string;
        },
        createdBy: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<IProjectSubsidyDocument> {
        // Verify project exists
        const project = await this.repository.getByUid(tenantUid, projectUid);
        if (!project) {
            throw new CustomError(PROJECT_MESSAGES.NOT_FOUND, 404);
        }

        const document = await this.subsidyDocumentRepository.create({
            tenantUid,
            projectUid,
            ...data,
            createdBy,
        });

        await this.auditLogService.log({
            tenantUid,
            module: "ProjectSubsidyDocument",
            recordUid: document.uid,
            action: AUDIT_LOG_ACTIONS.CREATE,
            message: `Uploaded subsidy document for project ${project.projectNumber}.`,
            ipAddress,
            userAgent,
            createdBy,
        });

        return document;
    }
}
