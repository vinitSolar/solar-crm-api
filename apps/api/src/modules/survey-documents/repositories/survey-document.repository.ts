import type { Pool, PoolClient } from "pg";
import type { ISiteSurveyDocument } from "../interfaces/survey-documents.interface.js";
import { v4 as uuidv4 } from "uuid";

const SURVEY_DOCUMENT_COLUMNS = `
    ssd.id, ssd.uid, ssd.tenant_uid AS "tenantUid", ssd.site_survey_uid AS "siteSurveyUid",
    ssd.document_type_uid AS "documentTypeUid", sdt.name AS "documentTypeName",
    ssd.original_name AS "originalName", ssd.file_name AS "fileName", ssd.file_url AS "fileUrl",
    ssd.mime_type AS "mimeType", ssd.file_size AS "fileSize", ssd.remarks,
    ssd.is_active AS "isActive", ssd.is_deleted AS "isDeleted",
    ssd.created_at AS "createdAt", ssd.updated_at AS "updatedAt",
    ssd.created_by AS "createdBy", ssd.updated_by AS "updatedBy", ssd.deleted_by AS "deletedBy"
`;

export class SurveyDocumentRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async create(
        tenantUid: string,
        siteSurveyUid: string,
        documentTypeUid: string,
        originalName: string,
        fileName: string,
        fileUrl: string,
        mimeType: string,
        fileSize: number,
        remarks: string | undefined,
        createdBy: string,
        client?: PoolClient
    ): Promise<ISiteSurveyDocument> {
        const uid = uuidv4();
        const query = `
            INSERT INTO site_survey_documents (
                uid, tenant_uid, site_survey_uid, document_type_uid,
                original_name, file_name, file_url, mime_type, file_size, remarks, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, uid, tenant_uid AS "tenantUid", site_survey_uid AS "siteSurveyUid",
                document_type_uid AS "documentTypeUid",
                original_name AS "originalName", file_name AS "fileName", file_url AS "fileUrl",
                mime_type AS "mimeType", file_size AS "fileSize", remarks,
                is_active AS "isActive", is_deleted AS "isDeleted",
                created_at AS "createdAt", updated_at AS "updatedAt",
                created_by AS "createdBy", updated_by AS "updatedBy", deleted_by AS "deletedBy"
        `;
        const values = [
            uid, tenantUid, siteSurveyUid, documentTypeUid,
            originalName, fileName, fileUrl, mimeType, fileSize, remarks ?? null, createdBy
        ];

        const result = client 
            ? await client.query(query, values)
            : await this.pool.query(query, values);
            
        return result.rows[0] as ISiteSurveyDocument;
    }

    async getBySurveyUid(tenantUid: string, siteSurveyUid: string): Promise<ISiteSurveyDocument[]> {
        const query = `
            SELECT ${SURVEY_DOCUMENT_COLUMNS}
            FROM site_survey_documents ssd
            LEFT JOIN survey_document_types sdt ON sdt.uid = ssd.document_type_uid
            WHERE ssd.site_survey_uid = $1 AND ssd.tenant_uid = $2 AND ssd.is_deleted = 0
            ORDER BY ssd.created_at DESC
        `;
        const result = await this.pool.query(query, [siteSurveyUid, tenantUid]);
        return result.rows as ISiteSurveyDocument[];
    }

    async getActiveDocumentsByType(tenantUid: string, siteSurveyUid: string, documentTypeUid: string): Promise<ISiteSurveyDocument[]> {
        const query = `
            SELECT ${SURVEY_DOCUMENT_COLUMNS}
            FROM site_survey_documents ssd
            LEFT JOIN survey_document_types sdt ON sdt.uid = ssd.document_type_uid
            WHERE ssd.site_survey_uid = $1 AND ssd.tenant_uid = $2 AND ssd.document_type_uid = $3 AND ssd.is_deleted = 0
        `;
        const result = await this.pool.query(query, [siteSurveyUid, tenantUid, documentTypeUid]);
        return result.rows as ISiteSurveyDocument[];
    }

    async softDelete(tenantUid: string, uid: string, deletedBy: string, client?: PoolClient): Promise<boolean> {
        const query = `
            UPDATE site_survey_documents
            SET is_deleted = 1, deleted_by = $3, updated_at = CURRENT_TIMESTAMP
            WHERE uid = $1 AND tenant_uid = $2 AND is_deleted = 0
        `;
        const result = client
            ? await client.query(query, [uid, tenantUid, deletedBy])
            : await this.pool.query(query, [uid, tenantUid, deletedBy]);
            
        return (result.rowCount ?? 0) > 0;
    }

    async softDeleteMultiple(tenantUid: string, uids: string[], deletedBy: string, client?: PoolClient): Promise<void> {
        if (!uids.length) return;
        const query = `
            UPDATE site_survey_documents
            SET is_deleted = 1, deleted_by = $3, updated_at = CURRENT_TIMESTAMP
            WHERE uid = ANY($1::text[]) AND tenant_uid = $2 AND is_deleted = 0
        `;
        if (client) {
            await client.query(query, [uids, tenantUid, deletedBy]);
        } else {
            await this.pool.query(query, [uids, tenantUid, deletedBy]);
        }
    }
}
