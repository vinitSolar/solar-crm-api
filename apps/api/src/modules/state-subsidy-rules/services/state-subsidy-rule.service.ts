import type { StateSubsidyRuleRepository } from "../repositories/state-subsidy-rule.repository.js";
import type { IStateSubsidyRule, IStateSubsidyRuleSafe, IStateSubsidyRuleDropdown } from "../interfaces/state-subsidy-rule.interface.js";
import { STATE_SUBSIDY_RULE_MESSAGES } from "../constants/state-subsidy-rule.constants.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { TENANT_TYPE } from "../../franchises/constants/franchise.constants.js";
import pool from "@packages/connection.js";

export class StateSubsidyRuleService {
    private readonly repository: StateSubsidyRuleRepository;

    constructor(repository: StateSubsidyRuleRepository) {
        this.repository = repository;
    }

    private sanitize(rule: IStateSubsidyRule): IStateSubsidyRuleSafe {
        return {
            uid: rule.uid,
            stateUid: rule.state_uid,
            state: rule.state,
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

    public async createRule(data: Partial<IStateSubsidyRule>, userUid: string, tenantUid: string): Promise<IStateSubsidyRuleSafe> {
        await this.verifyHeadOffice(tenantUid);

        if (!data.state) {
            throw new CustomError(STATE_SUBSIDY_RULE_MESSAGES.STATE_REQUIRED, 400);
        }

        const existing = await this.repository.findByState(data.state);
        if (existing) {
            throw new CustomError(STATE_SUBSIDY_RULE_MESSAGES.STATE_ALREADY_EXISTS, 400);
        }

        const rule = await this.repository.create(data, userUid);
        return this.sanitize(rule);
    }

    public async updateRule(uid: string, data: Partial<IStateSubsidyRule>, userUid: string, tenantUid: string): Promise<IStateSubsidyRuleSafe> {
        await this.verifyHeadOffice(tenantUid);

        const existingRule = await this.repository.findByUid(uid);
        if (!existingRule) {
            throw new CustomError(STATE_SUBSIDY_RULE_MESSAGES.NOT_FOUND, 404);
        }

        if (data.state && data.state.toLowerCase() !== existingRule.state.toLowerCase()) {
            const stateExists = await this.repository.findByState(data.state);
            if (stateExists && stateExists.uid !== uid) {
                throw new CustomError(STATE_SUBSIDY_RULE_MESSAGES.STATE_ALREADY_EXISTS, 400);
            }
        }

        const rule = await this.repository.update(uid, data, userUid);
        return this.sanitize(rule);
    }

    public async getRuleByUid(uid: string): Promise<IStateSubsidyRuleSafe> {
        const rule = await this.repository.findByUid(uid);
        if (!rule) {
            throw new CustomError(STATE_SUBSIDY_RULE_MESSAGES.NOT_FOUND, 404);
        }
        return this.sanitize(rule);
    }

    public async getRulesByState(state: string): Promise<IStateSubsidyRuleSafe[]> {
        const rules = await this.repository.findByStateOrAll(state);
        return rules.map(r => this.sanitize(r));
    }

    public async getPaginatedRules(params: {
        page: number;
        limit: number;
        search?: string;
        status?: "active" | "deleted" | "all";
    }): Promise<{ data: IStateSubsidyRuleSafe[]; total: number; totalPages: number }> {
        const { page, limit, search, status = "active" } = params;
        const result = await this.repository.getPaginated(page, limit, search, status);

        return {
            data: result.data.map((rule) => this.sanitize(rule)),
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
        if (!rule) {
            throw new CustomError(STATE_SUBSIDY_RULE_MESSAGES.NOT_FOUND, 404);
        }

        if (rule.is_deleted === 1) {
            return;
        }

        await this.repository.softDelete(uid, userUid);
    }

    public async restoreRule(uid: string, userUid: string, tenantUid: string): Promise<void> {
        await this.verifyHeadOffice(tenantUid);

        const rule = await this.repository.findByUid(uid);
        if (!rule) {
            throw new CustomError(STATE_SUBSIDY_RULE_MESSAGES.RESTORE_FAILED, 404);
        }

        if (rule.is_deleted === 0) {
            return;
        }

        await this.repository.restore(uid, userUid);
    }
}
