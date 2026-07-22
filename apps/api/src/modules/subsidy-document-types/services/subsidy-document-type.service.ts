import type { SubsidyDocumentTypeRepository } from "../repositories/subsidy-document-type.repository.js";
import type {
    ISubsidyDocumentType,
    ISubsidyDocumentTypeSafe,
    ICreateSubsidyDocumentType,
    IUpdateSubsidyDocumentType,
    ISubsidyDocumentTypeDropdown,
} from "../interfaces/subsidy-document-type.interface.js";
import type { ISubsidyDocumentTypeListRequest } from "../dto/subsidy-document-type.dto.js";
import { SUBSIDY_DOCUMENT_TYPE_MESSAGES, SUBSIDY_DOCUMENT_TYPE_AUDIT } from "../constants/subsidy-document-type.constants.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { TENANT_TYPE } from "../../franchises/constants/franchise.constants.js";
import type { AuditLogService } from "../../audit-logs/services/audit-logs.service.js";
import { AUDIT_LOG_ACTIONS } from "../../audit-logs/constants/audit-logs.constants.js";
import pool from "@packages/connection.js";

export class SubsidyDocumentTypeService {
    private readonly repository: SubsidyDocumentTypeRepository;
    private readonly auditLogService?: AuditLogService | undefined;

    constructor(repository: SubsidyDocumentTypeRepository, auditLogService?: AuditLogService | undefined) {
        this.repository = repository;
        this.auditLogService = auditLogService;
    }

    private sanitize(docType: ISubsidyDocumentType): ISubsidyDocumentTypeSafe {
        return {
            uid: docType.uid,
            name: docType.name,
            description: docType.description,
            allowMultiple: Boolean(docType.allow_multiple),
            isRequired: Boolean(docType.is_required),
            sortOrder: docType.sort_order,
            isActive: Boolean(docType.is_active),
            isDeleted: Boolean(docType.is_deleted),
            createdAt: docType.created_at,
            updatedAt: docType.updated_at,
        };
    }

    /**
     * Helper to verify if the acting user belongs to the Head Office.
     */
    private async verifyHeadOffice(tenantUid: string): Promise<void> {
        const query = `SELECT type FROM tenants WHERE uid = $1`;
        const result = await pool.query<{ type: number }>(query, [tenantUid]);

        if (!result.rows[0] || result.rows[0].type !== TENANT_TYPE.HEAD_OFFICE) {
            throw new CustomError(SUBSIDY_DOCUMENT_TYPE_MESSAGES.HEAD_OFFICE_ONLY, 403);
        }
    }

    public async createDocumentType(
        data: ICreateSubsidyDocumentType,
        userUid: string,
        tenantUid: string
    ): Promise<ISubsidyDocumentTypeSafe> {
        await this.verifyHeadOffice(tenantUid);

        if (!data.name || !data.name.trim()) {
            throw new CustomError(SUBSIDY_DOCUMENT_TYPE_MESSAGES.NAME_REQUIRED, 400);
        }

        const existing = await this.repository.findByName(data.name);
        if (existing) {
            throw new CustomError(SUBSIDY_DOCUMENT_TYPE_MESSAGES.NAME_ALREADY_EXISTS, 400);
        }

        const created = await this.repository.create(data, userUid);

        if (this.auditLogService) {
            await this.auditLogService.log({
                tenantUid,
                module: SUBSIDY_DOCUMENT_TYPE_AUDIT.MODULE,
                recordUid: created.uid,
                action: AUDIT_LOG_ACTIONS.CREATE,
                message: `${SUBSIDY_DOCUMENT_TYPE_AUDIT.ACTIONS.CREATE}: '${created.name}'`,
                createdBy: userUid,
            });
        }

        return this.sanitize(created);
    }

    public async updateDocumentType(
        uid: string,
        data: IUpdateSubsidyDocumentType,
        userUid: string,
        tenantUid: string
    ): Promise<ISubsidyDocumentTypeSafe> {
        await this.verifyHeadOffice(tenantUid);

        const existing = await this.repository.findByUid(uid);
        if (!existing || existing.is_deleted === 1) {
            throw new CustomError(SUBSIDY_DOCUMENT_TYPE_MESSAGES.NOT_FOUND, 404);
        }

        if (data.name !== undefined && data.name.trim().toLowerCase() !== existing.name.toLowerCase()) {
            const nameConflict = await this.repository.findByName(data.name, uid);
            if (nameConflict) {
                throw new CustomError(SUBSIDY_DOCUMENT_TYPE_MESSAGES.NAME_ALREADY_EXISTS, 400);
            }
        }

        const updated = await this.repository.update(uid, data, userUid);

        if (this.auditLogService) {
            await this.auditLogService.logUpdate({
                tenantUid,
                module: SUBSIDY_DOCUMENT_TYPE_AUDIT.MODULE,
                recordUid: uid,
                oldRecord: existing,
                newRecord: updated,
                createdBy: userUid,
            });
        }

        return this.sanitize(updated);
    }

    public async getDocumentTypeByUid(uid: string): Promise<ISubsidyDocumentTypeSafe> {
        const docType = await this.repository.findByUid(uid);
        if (!docType || docType.is_deleted === 1) {
            throw new CustomError(SUBSIDY_DOCUMENT_TYPE_MESSAGES.NOT_FOUND, 404);
        }
        return this.sanitize(docType);
    }

    public async getPaginatedDocumentTypes(params: ISubsidyDocumentTypeListRequest): Promise<{
        data: ISubsidyDocumentTypeSafe[];
        total: number;
        totalPages: number;
    }> {
        const { page, limit, search, status = "active" } = params;
        const result = await this.repository.getPaginated(page, limit, search, status);

        return {
            data: result.data.map((docType) => this.sanitize(docType)),
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
        };
    }

    public async getAllDocumentTypes(status: "active" | "deleted" | "all" = "active"): Promise<ISubsidyDocumentTypeDropdown[]> {
        const docTypes = await this.repository.getAll(status);
        return docTypes.map((docType) => ({
            uid: docType.uid,
            name: docType.name,
            allowMultiple: Boolean(docType.allow_multiple),
            isRequired: Boolean(docType.is_required),
            sortOrder: docType.sort_order,
        }));
    }

    public async softDeleteDocumentType(uid: string, userUid: string, tenantUid: string): Promise<void> {
        await this.verifyHeadOffice(tenantUid);

        const docType = await this.repository.findByUid(uid);
        if (!docType || docType.is_deleted === 1) {
            throw new CustomError(SUBSIDY_DOCUMENT_TYPE_MESSAGES.NOT_FOUND, 404);
        }

        await this.repository.softDelete(uid, userUid);

        if (this.auditLogService) {
            await this.auditLogService.log({
                tenantUid,
                module: SUBSIDY_DOCUMENT_TYPE_AUDIT.MODULE,
                recordUid: uid,
                action: AUDIT_LOG_ACTIONS.DELETE,
                message: `${SUBSIDY_DOCUMENT_TYPE_AUDIT.ACTIONS.DELETE}: '${docType.name}'`,
                createdBy: userUid,
            });
        }
    }

    public async restoreDocumentType(uid: string, userUid: string, tenantUid: string): Promise<void> {
        await this.verifyHeadOffice(tenantUid);

        const docType = await this.repository.findByUid(uid);
        if (!docType || docType.is_deleted === 0) {
            throw new CustomError(SUBSIDY_DOCUMENT_TYPE_MESSAGES.RESTORE_FAILED, 404);
        }

        await this.repository.restore(uid, userUid);

        if (this.auditLogService) {
            await this.auditLogService.log({
                tenantUid,
                module: SUBSIDY_DOCUMENT_TYPE_AUDIT.MODULE,
                recordUid: uid,
                action: AUDIT_LOG_ACTIONS.UPDATE,
                message: `${SUBSIDY_DOCUMENT_TYPE_AUDIT.ACTIONS.RESTORE}: '${docType.name}'`,
                createdBy: userUid,
            });
        }
    }
}
