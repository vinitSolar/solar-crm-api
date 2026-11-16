import type { Pool } from "pg";

export interface IWorkflowRule {
    id: string;
    uid: string;
    tenantUid: string;
    ruleKey: string;
    ruleName: string;
    description: string | null;
    isEnabled: number;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

const RULE_COLUMNS = `
    id, uid, tenant_uid AS "tenantUid", rule_key AS "ruleKey", rule_name AS "ruleName",
    description, is_enabled AS "isEnabled", sort_order AS "sortOrder",
    created_at AS "createdAt", updated_at AS "updatedAt"
`;

export class WorkflowAutomationRuleRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async getAllByTenant(tenantUid: string): Promise<IWorkflowRule[]> {
        const result = await this.pool.query(
            `SELECT ${RULE_COLUMNS} FROM workflow_automation_rules 
             WHERE tenant_uid = $1 ORDER BY sort_order ASC`,
            [tenantUid]
        );
        return result.rows as IWorkflowRule[];
    }

    async isRuleEnabled(tenantUid: string, ruleKey: string): Promise<boolean> {
        const result = await this.pool.query(
            `SELECT is_enabled FROM workflow_automation_rules 
             WHERE tenant_uid = $1 AND rule_key = $2`,
            [tenantUid, ruleKey]
        );
        // If no rule found, default to enabled (so automation works even before seeding)
        if (result.rows.length === 0) return true;
        return result.rows[0]?.is_enabled === 1;
    }

    async toggleRule(tenantUid: string, ruleKey: string, isEnabled: boolean, updatedBy: string): Promise<IWorkflowRule | null> {
        const result = await this.pool.query(
            `UPDATE workflow_automation_rules 
             SET is_enabled = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
             WHERE tenant_uid = $3 AND rule_key = $4
             RETURNING ${RULE_COLUMNS}`,
            [isEnabled ? 1 : 0, updatedBy, tenantUid, ruleKey]
        );
        return result.rows.length > 0 ? (result.rows[0] as IWorkflowRule) : null;
    }

    async bulkToggle(tenantUid: string, rules: { ruleKey: string; isEnabled: boolean }[], updatedBy: string): Promise<IWorkflowRule[]> {
        const results: IWorkflowRule[] = [];
        for (const rule of rules) {
            const updated = await this.toggleRule(tenantUid, rule.ruleKey, rule.isEnabled, updatedBy);
            if (updated) results.push(updated);
        }
        return results;
    }
}

