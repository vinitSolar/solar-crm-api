import type { Pool, PoolClient } from "pg";
import type { IProjectInstallationMilestone } from "../interfaces/project.interface.js";
import { v4 as uuidv4 } from "uuid";

const PROJECT_MILESTONE_COLUMNS = `
    id, uid, tenant_uid AS "tenantUid", project_uid AS "projectUid", 
    milestone_uid AS "milestoneUid", title, description, sequence_no AS "sequenceNo", 
    status, started_at AS "startedAt", completed_at AS "completedAt", 
    completed_by AS "completedBy", remarks,
    is_active AS "isActive", is_deleted AS "isDeleted", 
    created_at AS "createdAt", updated_at AS "updatedAt",
    created_by AS "createdBy", updated_by AS "updatedBy", deleted_by AS "deletedBy"
`;

export class ProjectInstallationMilestoneRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async bulkInsertFromTemplates(
        tenantUid: string,
        projectUid: string,
        createdBy: string,
        client?: PoolClient
    ): Promise<void> {
        const executor = client || this.pool;
        // Read templates
        const templatesRes = await executor.query(
            `SELECT uid, name, description, requires_document, allow_multiple_images 
             FROM installation_milestones 
             WHERE tenant_uid::varchar = $1 AND is_deleted = 0 AND is_active = 1
             ORDER BY sort_order ASC`,
            [tenantUid]
        );

        const templates = templatesRes.rows;
        if (templates.length === 0) return;

        for (let i = 0; i < templates.length; i++) {
            const template = templates[i];
            const isFirst = i === 0;
            const uid = uuidv4();
            
            await executor.query(
                `INSERT INTO project_installation_milestones (
                    uid, tenant_uid, project_uid, milestone_uid, title, description, 
                    sequence_no, status, started_at, created_by
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    uid, tenantUid, projectUid, template.uid, template.name, template.description,
                    i + 1, 
                    isFirst ? 1 : 0, // status: 1=InProgress, 0=Pending
                    isFirst ? new Date() : null,
                    createdBy
                ]
            );
        }
    }

    async getByProjectUid(tenantUid: string, projectUid: string): Promise<IProjectInstallationMilestone[]> {
        const result = await this.pool.query(
            `SELECT ${PROJECT_MILESTONE_COLUMNS} 
             FROM project_installation_milestones 
             WHERE project_uid::varchar = $1 AND tenant_uid::varchar = $2 AND is_deleted = 0
             ORDER BY sequence_no ASC`,
            [projectUid, tenantUid]
        );
        return result.rows as IProjectInstallationMilestone[];
    }

    async getByUid(tenantUid: string, uid: string): Promise<IProjectInstallationMilestone | null> {
        const result = await this.pool.query(
            `SELECT ${PROJECT_MILESTONE_COLUMNS} 
             FROM project_installation_milestones 
             WHERE uid::varchar = $1 AND tenant_uid::varchar = $2 AND is_deleted = 0`,
            [uid, tenantUid]
        );
        return result.rows.length > 0 ? (result.rows[0] as IProjectInstallationMilestone) : null;
    }

    async updateMilestoneStatus(
        tenantUid: string,
        uid: string,
        status: number,
        remarks: string | null,
        updatedBy: string,
        client?: PoolClient
    ): Promise<void> {
        const executor = client || this.pool;
        
        let updateQuery = `
            UPDATE project_installation_milestones 
            SET status = $1, remarks = $2, updated_at = CURRENT_TIMESTAMP, updated_by = $3
        `;
        const values: any[] = [status, remarks, updatedBy];
        let index = 4;

        if (status === 2) { // 2 = Completed
            updateQuery += `, completed_at = CURRENT_TIMESTAMP, completed_by = $3`;
        }

        updateQuery += ` WHERE uid::varchar = $${index} AND tenant_uid::varchar = $${index + 1}`;
        values.push(uid, tenantUid);

        await executor.query(updateQuery, values);
    }

    async startNextMilestone(
        tenantUid: string,
        projectUid: string,
        currentSequenceNo: number,
        updatedBy: string,
        client?: PoolClient
    ): Promise<boolean> {
        const executor = client || this.pool;
        // Find next pending milestone
        const nextRes = await executor.query(
            `SELECT uid FROM project_installation_milestones 
             WHERE project_uid::varchar = $1 AND tenant_uid::varchar = $2 AND sequence_no > $3 AND status = 0 AND is_deleted = 0
             ORDER BY sequence_no ASC LIMIT 1`,
            [projectUid, tenantUid, currentSequenceNo]
        );

        if (nextRes.rows.length > 0) {
            const nextUid = nextRes.rows[0].uid;
            await executor.query(
                `UPDATE project_installation_milestones 
                 SET status = 1, started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, updated_by = $1
                 WHERE uid::varchar = $2 AND tenant_uid::varchar = $3`,
                [updatedBy, nextUid, tenantUid]
            );
            return true; // There was a next milestone
        }
        return false; // No next milestone (all completed)
    }

    async getMilestoneTemplateRules(tenantUid: string, milestoneUid: string): Promise<{ requiresDocument: number, allowMultipleImages: number } | null> {
        const result = await this.pool.query(
            `SELECT requires_document AS "requiresDocument", allow_multiple_images AS "allowMultipleImages"
             FROM installation_milestones 
             WHERE uid::varchar = $1 AND tenant_uid::varchar = $2 AND is_deleted = 0`,
            [milestoneUid, tenantUid]
        );
        return result.rows.length > 0 ? result.rows[0] : null;
    }
}
