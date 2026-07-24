import type { Pool, PoolClient } from "pg";
import type { IProjectInstallationMilestoneDocument } from "../interfaces/project.interface.js";
import { v4 as uuidv4 } from "uuid";

const DOC_COLUMNS = `
    id, uid, tenant_uid AS "tenantUid", project_milestone_uid AS "projectMilestoneUid", 
    image_name AS "imageName", image_path AS "imagePath", image_url AS "imageUrl", 
    mime_type AS "mimeType", file_size AS "fileSize", remarks,
    is_active AS "isActive", is_deleted AS "isDeleted", 
    created_at AS "createdAt", updated_at AS "updatedAt",
    created_by AS "createdBy", updated_by AS "updatedBy", deleted_by AS "deletedBy"
`;

export class ProjectInstallationMilestoneDocumentRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async addDocument(
        tenantUid: string,
        projectMilestoneUid: string,
        data: {
            imageName: string;
            imagePath: string;
            imageUrl: string;
            mimeType: string;
            fileSize: number;
        },
        createdBy: string
    ): Promise<IProjectInstallationMilestoneDocument> {
        const uid = uuidv4();
        const result = await this.pool.query(
            `INSERT INTO project_installation_milestone_documents (
                uid, tenant_uid, project_milestone_uid, image_name, image_path, image_url, mime_type, file_size, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING ${DOC_COLUMNS}`,
            [
                uid, tenantUid, projectMilestoneUid, data.imageName, data.imagePath, 
                data.imageUrl, data.mimeType, data.fileSize, createdBy
            ]
        );
        return result.rows[0] as IProjectInstallationMilestoneDocument;
    }

    async getDocumentsByMilestoneUid(tenantUid: string, projectMilestoneUid: string): Promise<IProjectInstallationMilestoneDocument[]> {
        const result = await this.pool.query(
            `SELECT ${DOC_COLUMNS} 
             FROM project_installation_milestone_documents 
             WHERE project_milestone_uid::varchar = $1 AND tenant_uid::varchar = $2 AND is_deleted = 0
             ORDER BY created_at ASC`,
            [projectMilestoneUid, tenantUid]
        );
        return result.rows as IProjectInstallationMilestoneDocument[];
    }

    async getCountByMilestoneUid(tenantUid: string, projectMilestoneUid: string): Promise<number> {
        const result = await this.pool.query(
            `SELECT COUNT(*) AS count 
             FROM project_installation_milestone_documents 
             WHERE project_milestone_uid::varchar = $1 AND tenant_uid::varchar = $2 AND is_deleted = 0`,
            [projectMilestoneUid, tenantUid]
        );
        return parseInt(result.rows[0]?.count || "0", 10);
    }
}
