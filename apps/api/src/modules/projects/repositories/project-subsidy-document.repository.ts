import { Pool, type QueryResult } from "pg";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@packages/logger/index.js";

export interface IProjectSubsidyDocument {
    id?: number;
    uid: string;
    tenantUid: string;
    projectUid: string;
    documentTypeUid: string;
    originalName: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
    remarks?: string;
    isActive?: number;
    isDeleted?: number;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
    createdBy?: string;
    createdByName?: string;
    updatedBy?: string;
    deletedBy?: string;
}

export class ProjectSubsidyDocumentRepository {
    constructor(private db: Pool) {}

    async create(data: Omit<IProjectSubsidyDocument, "id" | "uid" | "createdAt" | "updatedAt" | "isActive" | "isDeleted">): Promise<IProjectSubsidyDocument> {
        const uid = uuidv4();
        
        const query = `
            INSERT INTO project_subsidy_documents (
                uid, tenant_uid, project_uid, document_type_uid,
                original_name, file_name, file_url, mime_type, file_size, remarks, created_by
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            ) RETURNING *;
        `;

        const values = [
            uid,
            data.tenantUid,
            data.projectUid,
            data.documentTypeUid,
            data.originalName,
            data.fileName,
            data.fileUrl,
            data.mimeType,
            data.fileSize,
            data.remarks || null,
            data.createdBy || null
        ];

        try {
            const result: QueryResult = await this.db.query(query, values);
            return this.mapToEntity(result.rows[0]);
        } catch (error) {
            logger.error("Error creating project subsidy document:", error);
            throw error;
        }
    }

    async getByProjectUid(projectUid: string, tenantUid: string): Promise<IProjectSubsidyDocument[]> {
        const query = `
            SELECT psd.*, TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))) AS created_by_name
            FROM project_subsidy_documents psd
            LEFT JOIN users u ON psd.created_by::varchar = u.uid
            WHERE psd.project_uid = $1 AND psd.tenant_uid = $2 AND psd.is_deleted = 0
            ORDER BY psd.created_at DESC;
        `;
        const values = [projectUid, tenantUid];

        try {
            const result: QueryResult = await this.db.query(query, values);
            return result.rows.map(this.mapToEntity);
        } catch (error) {
            logger.error("Error getting project subsidy documents:", error);
            throw error;
        }
    }
    
    async getByUid(uid: string, tenantUid: string): Promise<IProjectSubsidyDocument | null> {
        const query = `
            SELECT * FROM project_subsidy_documents 
            WHERE uid = $1 AND tenant_uid = $2 AND is_deleted = 0;
        `;
        const values = [uid, tenantUid];

        try {
            const result: QueryResult = await this.db.query(query, values);
            if (result.rows.length === 0) return null;
            return this.mapToEntity(result.rows[0]);
        } catch (error) {
            logger.error("Error getting project subsidy document by UID:", error);
            throw error;
        }
    }

    async delete(uid: string, tenantUid: string, deletedBy: string): Promise<boolean> {
        const query = `
            UPDATE project_subsidy_documents 
            SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $3 
            WHERE uid = $1 AND tenant_uid = $2 AND is_deleted = 0
            RETURNING id;
        `;
        const values = [uid, tenantUid, deletedBy];

        try {
            const result: QueryResult = await this.db.query(query, values);
            return result.rowCount ? result.rowCount > 0 : false;
        } catch (error) {
            logger.error("Error deleting project subsidy document:", error);
            throw error;
        }
    }

    private mapToEntity(row: any): IProjectSubsidyDocument {
        return {
            id: row.id,
            uid: row.uid,
            tenantUid: row.tenant_uid,
            projectUid: row.project_uid,
            documentTypeUid: row.document_type_uid,
            originalName: row.original_name,
            fileName: row.file_name,
            fileUrl: row.file_url,
            mimeType: row.mime_type,
            fileSize: row.file_size,
            remarks: row.remarks,
            isActive: row.is_active,
            isDeleted: row.is_deleted,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at,
            createdBy: row.created_by,
            createdByName: row.created_by_name,
            updatedBy: row.updated_by,
            deletedBy: row.deleted_by,
        };
    }
}
