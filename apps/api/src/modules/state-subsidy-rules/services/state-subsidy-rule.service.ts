import type { StateSubsidyRuleRepository, IStateSubsidyRuleWithStateName } from "../repositories/state-subsidy-rule.repository.js";
import type { SubsidyRequiredDocumentRepository } from "../repositories/subsidy-required-document.repository.js";
import type { SubsidyDocumentTypeRepository } from "../../subsidy-document-types/repositories/subsidy-document-type.repository.js";
import type { AuditLogService } from "../../audit-logs/services/audit-logs.service.js";
import type { IStateSubsidyRule, IStateSubsidyRuleSafe, IStateSubsidyRuleDropdown } from "../interfaces/state-subsidy-rule.interface.js";
import { STATE_SUBSIDY_RULE_MESSAGES } from "../constants/state-subsidy-rule.constants.js";
import { SUBSIDY_DOCUMENT_TYPE_MESSAGES } from "../../subsidy-document-types/constants/subsidy-document-type.constants.js";
import { AUDIT_LOG_ACTIONS } from "../../audit-logs/constants/audit-logs.constants.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { TENANT_TYPE } from "../../franchises/constants/franchise.constants.js";
import pool from "@packages/connection.js";

export interface ICreateSubsidyPayload {
    schemeName?: string;
    stateUid?: string | null;
    subsidyPerKw: number;
    maximumSubsidyAmount: number;
    description?: string | null;
    documentTypeUids?: string[];
}

export interface IUpdateSubsidyPayload {
    schemeName?: string;
    stateUid?: string | null;
    subsidyPerKw?: number;
    maximumSubsidyAmount?: number;
    description?: string | null;
    isActive?: number;
    documentTypeUids?: string[];
}

export class StateSubsidyRuleService {
    private readonly repository: StateSubsidyRuleRepository;
    private readonly requiredDocRepository: SubsidyRequiredDocumentRepository;
    private readonly docTypeRepository: SubsidyDocumentTypeRepository;
    private readonly auditLogService?: AuditLogService | undefined;

    constructor(
        repository: StateSubsidyRuleRepository,
        requiredDocRepository: SubsidyRequiredDocumentRepository,
        docTypeRepository: SubsidyDocumentTypeRepository,
        auditLogService?: AuditLogService | undefined
    ) {
        this.repository = repository;
        this.requiredDocRepository = requiredDocRepository;
        this.docTypeRepository = docTypeRepository;
        this.auditLogService = auditLogService;
    }

    private sanitize(rule: IStateSubsidyRuleWithStateName): IStateSubsidyRuleSafe {
        return {
            uid: rule.uid,
            schemeName: rule.scheme_name,
            stateUid: rule.state_uid,
            state: rule.state_name || (rule.state_uid ? null : "All States"),
            subsidyPerKw: Number(rule.subsidy_per_kw),
            maximumSubsidyAmount: Number(rule.maximum_subsidy_amount),
            description: rule.description,
            isActive: rule.is_active,
            isDeleted: rule.is_deleted,
            createdAt: rule.created_at,
            updatedAt: rule.updated_at,
        };
    }

    /**
     * Helper to verify if the acting user belongs to the Head Office.
     */
    private async verifyHeadOffice(tenantUid: string): Promise<void> {
        const query = `SELECT type FROM tenants WHERE uid = $1`;
        const result = await pool.query<{ type: number }>(query, [tenantUid]);

        if (!result.rows[0] || result.rows[0].type !== TENANT_TYPE.HEAD_OFFICE) {
            throw new CustomError(STATE_SUBSIDY_RULE_MESSAGES.HEAD_OFFICE_ONLY, 403);
        }
    }

    /**
     * Validates an array of document type UIDs against the database.
     */
    private async validateDocumentTypes(documentTypeUids: string[]): Promise<void> {
        if (!documentTypeUids || documentTypeUids.length === 0) {
            throw new CustomError(SUBSIDY_DOCUMENT_TYPE_MESSAGES.AT_LEAST_ONE_DOCUMENT_REQUIRED, 400);
        }

        // Check for duplicate UIDs in array
        const uniqueUids = new Set(documentTypeUids);
        if (uniqueUids.size !== documentTypeUids.length) {
            throw new CustomError(SUBSIDY_DOCUMENT_TYPE_MESSAGES.DUPLICATE_DOCUMENT_TYPES, 400);
        }

        // Query database to check if all UIDs exist and are active
        const foundDocTypes = await this.docTypeRepository.findByUids(Array.from(uniqueUids));
        if (foundDocTypes.length !== uniqueUids.size) {
            throw new CustomError(SUBSIDY_DOCUMENT_TYPE_MESSAGES.INVALID_DOCUMENT_TYPES, 400);
        }
    }

    public async createRule(
        payload: ICreateSubsidyPayload,
        userUid: string,
        tenantUid: string
    ): Promise<IStateSubsidyRuleSafe> {
        await this.verifyHeadOffice(tenantUid);

        if (payload.stateUid === undefined) {
            throw new CustomError(STATE_SUBSIDY_RULE_MESSAGES.STATE_UID_REQUIRED, 400);
        }

        const documentTypeUids = payload.documentTypeUids || [];
        await this.validateDocumentTypes(documentTypeUids);

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const dbPayload: Partial<IStateSubsidyRule> & { scheme_name?: string | null } = {
                scheme_name: payload.schemeName ?? null,
                state_uid: payload.stateUid ?? null,
                subsidy_per_kw: payload.subsidyPerKw,
                maximum_subsidy_amount: payload.maximumSubsidyAmount,
                description: payload.description ?? null,
            };

            const createdRule = await this.repository.create(dbPayload, userUid, client);

            await this.requiredDocRepository.createMany(createdRule.uid, documentTypeUids, userUid, client);

            await client.query("COMMIT");

            // Audit Logs
            if (this.auditLogService) {
                await this.auditLogService.log({
                    tenantUid,
                    module: "Subsidy",
                    recordUid: createdRule.uid,
                    action: AUDIT_LOG_ACTIONS.CREATE,
                    message: `Subsidy Scheme Created: '${payload.schemeName || createdRule.uid}'`,
                    createdBy: userUid,
                });

                await this.auditLogService.log({
                    tenantUid,
                    module: "Subsidy",
                    recordUid: createdRule.uid,
                    action: AUDIT_LOG_ACTIONS.UPDATE,
                    message: `Required Documents Added: ${documentTypeUids.length} document type(s) attached`,
                    createdBy: userUid,
                });
            }

            return await this.getRuleByUid(createdRule.uid);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    public async updateRule(
        uid: string,
        payload: IUpdateSubsidyPayload,
        userUid: string,
        tenantUid: string
    ): Promise<IStateSubsidyRuleSafe> {
        await this.verifyHeadOffice(tenantUid);

        const existingRule = await this.repository.findByUid(uid);
        if (!existingRule || existingRule.is_deleted === 1) {
            throw new CustomError(STATE_SUBSIDY_RULE_MESSAGES.NOT_FOUND, 404);
        }

        if (payload.documentTypeUids !== undefined) {
            await this.validateDocumentTypes(payload.documentTypeUids);
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const dbPayload: Partial<IStateSubsidyRule> & { scheme_name?: string | null } = {};
            if (payload.schemeName !== undefined) dbPayload.scheme_name = payload.schemeName;
            if (payload.stateUid !== undefined) dbPayload.state_uid = payload.stateUid;
            if (payload.subsidyPerKw !== undefined) dbPayload.subsidy_per_kw = payload.subsidyPerKw;
            if (payload.maximumSubsidyAmount !== undefined) dbPayload.maximum_subsidy_amount = payload.maximumSubsidyAmount;
            if (payload.description !== undefined) dbPayload.description = payload.description;
            if (payload.isActive !== undefined) dbPayload.is_active = payload.isActive;

            const updatedRule = await this.repository.update(uid, dbPayload, userUid, client);

            if (payload.documentTypeUids !== undefined) {
                await this.requiredDocRepository.softDeleteBySubsidyUid(uid, userUid, client);
                await this.requiredDocRepository.createMany(uid, payload.documentTypeUids, userUid, client);
            }

            await client.query("COMMIT");

            // Audit Logs
            if (this.auditLogService) {
                await this.auditLogService.logUpdate({
                    tenantUid,
                    module: "Subsidy",
                    recordUid: uid,
                    oldRecord: existingRule,
                    newRecord: updatedRule,
                    createdBy: userUid,
                });

                if (payload.documentTypeUids !== undefined) {
                    await this.auditLogService.log({
                        tenantUid,
                        module: "Subsidy",
                        recordUid: uid,
                        action: AUDIT_LOG_ACTIONS.UPDATE,
                        message: `Required Documents Updated: ${payload.documentTypeUids.length} document type(s) attached`,
                        createdBy: userUid,
                    });
                }
            }

            return await this.getRuleByUid(uid);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    public async getRuleByUid(uid: string): Promise<IStateSubsidyRuleSafe> {
        const rule = await this.repository.findByUid(uid);
        if (!rule || rule.is_deleted === 1) {
            throw new CustomError(STATE_SUBSIDY_RULE_MESSAGES.NOT_FOUND, 404);
        }

        const sanitized = this.sanitize(rule);
        sanitized.requiredDocuments = await this.requiredDocRepository.findBySubsidyUid(uid);
        return sanitized;
    }

    public async getRulesByStateUid(stateUid: string): Promise<IStateSubsidyRuleSafe[]> {
        const rules = await this.repository.findByStateUidOrAll(stateUid);
        const subsidyUids = rules.map((r) => r.uid);
        const countsMap = await this.requiredDocRepository.getCountsBySubsidyUids(subsidyUids);

        return rules.map((r) => {
            const sanitized = this.sanitize(r);
            sanitized.requiredDocumentsCount = countsMap[r.uid] || 0;
            return sanitized;
        });
    }

    public async getPaginatedRules(params: {
        page: number;
        limit: number;
        search?: string;
        status?: "active" | "deleted" | "all";
    }): Promise<{ data: IStateSubsidyRuleSafe[]; total: number; totalPages: number }> {
        const { page, limit, search, status = "active" } = params;
        const result = await this.repository.getPaginated(page, limit, search, status);
        const subsidyUids = result.data.map((r) => r.uid);
        const countsMap = await this.requiredDocRepository.getCountsBySubsidyUids(subsidyUids);

        const sanitizedData = result.data.map((rule) => {
            const sanitized = this.sanitize(rule);
            sanitized.requiredDocumentsCount = countsMap[rule.uid] || 0;
            return sanitized;
        });

        return {
            data: sanitizedData,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
        };
    }

    public async getDropdownRules(): Promise<IStateSubsidyRuleDropdown[]> {
        return await this.repository.getDropdown();
    }

    public async softDeleteRule(uid: string, userUid: string, tenantUid: string): Promise<void> {
        await this.verifyHeadOffice(tenantUid);

        const rule = await this.repository.findByUid(uid);
        if (!rule || rule.is_deleted === 1) {
            throw new CustomError(STATE_SUBSIDY_RULE_MESSAGES.NOT_FOUND, 404);
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            await this.repository.softDelete(uid, userUid, client);
            await this.requiredDocRepository.softDeleteBySubsidyUid(uid, userUid, client);
            await client.query("COMMIT");

            if (this.auditLogService) {
                await this.auditLogService.log({
                    tenantUid,
                    module: "Subsidy",
                    recordUid: uid,
                    action: AUDIT_LOG_ACTIONS.DELETE,
                    message: `Subsidy Deleted: '${rule.scheme_name || uid}'`,
                    createdBy: userUid,
                });
            }
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    public async restoreRule(uid: string, userUid: string, tenantUid: string): Promise<void> {
        await this.verifyHeadOffice(tenantUid);

        const rule = await this.repository.findByUid(uid);
        if (!rule || rule.is_deleted === 0) {
            throw new CustomError(STATE_SUBSIDY_RULE_MESSAGES.RESTORE_FAILED, 404);
        }

        await this.repository.restore(uid, userUid);

        if (this.auditLogService) {
            await this.auditLogService.log({
                tenantUid,
                module: "Subsidy",
                recordUid: uid,
                action: AUDIT_LOG_ACTIONS.UPDATE,
                message: `Subsidy Restored: '${rule.scheme_name || uid}'`,
                createdBy: userUid,
            });
        }
    }
}
