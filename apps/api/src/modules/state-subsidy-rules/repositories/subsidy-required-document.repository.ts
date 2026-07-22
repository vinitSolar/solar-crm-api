import type { Pool, PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";

export interface ISubsidyRequiredDocumentRecord {
    id: number;
    uid: string;
    subsidy_uid: string;
    document_type_uid: string;
    sort_order: number;
    is_mandatory: number;
    is_active: number;
    is_deleted: number;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    created_by: string | null;
    updated_by: string | null;
    deleted_by: string | null;
}

export interface ISubsidyRequiredDocumentDetail {
    uid: string;
    documentTypeUid: string;
    name: string;
    allowMultiple: boolean;
    isRequired: boolean;
    sortOrder: number;
}

export interface ICombinedRequiredDocumentDetail {
    documentTypeUid: string;
    name: string;
    description: string | null;
    allowMultiple: boolean;
    isRequired: boolean;
    sortOrder: number;
    applicableSchemes: string[];
}

export class SubsidyRequiredDocumentRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    public async createMany(
        subsidyUid: string,
        documentTypeUids: string[],
        createdBy: string,
        client?: PoolClient
    ): Promise<ISubsidyRequiredDocumentRecord[]> {
        if (documentTypeUids.length === 0) return [];

        const executor = client || this.pool;
        const records: ISubsidyRequiredDocumentRecord[] = [];

        for (let i = 0; i < documentTypeUids.length; i++) {
            const docTypeUid = documentTypeUids[i]!;
            const uid = uuidv4();
            const query = `
                INSERT INTO subsidy_required_documents (
                    uid, subsidy_uid, document_type_uid, sort_order, is_mandatory, created_by, updated_by
                )
                VALUES ($1, $2, $3, $4, 1, $5, $5)
                RETURNING *
            `;
            const values = [uid, subsidyUid, docTypeUid, i + 1, createdBy];
            const result = await executor.query<ISubsidyRequiredDocumentRecord>(query, values);
            records.push(result.rows[0] as ISubsidyRequiredDocumentRecord);
        }

        return records;
    }

    public async softDeleteBySubsidyUid(
        subsidyUid: string,
        deletedBy: string,
        client?: PoolClient
    ): Promise<number> {
        const executor = client || this.pool;
        const query = `
            UPDATE subsidy_required_documents
            SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1, updated_by = $1, updated_at = CURRENT_TIMESTAMP
            WHERE subsidy_uid = $2 AND is_deleted = 0
        `;
        const result = await executor.query(query, [deletedBy, subsidyUid]);
        return result.rowCount || 0;
    }

    public async findBySubsidyUid(
        subsidyUid: string,
        client?: PoolClient
    ): Promise<ISubsidyRequiredDocumentDetail[]> {
        const executor = client || this.pool;
        const query = `
            SELECT 
                srd.uid,
                srd.document_type_uid AS "documentTypeUid",
                sdt.name,
                sdt.allow_multiple = 1 AS "allowMultiple",
                srd.is_mandatory = 1 AS "isRequired",
                srd.sort_order AS "sortOrder"
            FROM subsidy_required_documents srd
            JOIN subsidy_document_types sdt ON sdt.uid = srd.document_type_uid
            WHERE srd.subsidy_uid = $1
              AND srd.is_deleted = 0
              AND srd.is_active = 1
              AND sdt.is_deleted = 0
            ORDER BY srd.sort_order ASC, sdt.name ASC
        `;
        const result = await executor.query<ISubsidyRequiredDocumentDetail>(query, [subsidyUid]);
        return result.rows;
    }

    public async getCombinedRequiredDocuments(
        subsidyUids: string[],
        client?: PoolClient
    ): Promise<ICombinedRequiredDocumentDetail[]> {
        if (subsidyUids.length === 0) return [];

        const executor = client || this.pool;
        const query = `
            SELECT 
                sdt.uid AS "documentTypeUid",
                sdt.name,
                sdt.description,
                sdt.allow_multiple = 1 AS "allowMultiple",
                MAX(srd.is_mandatory) = 1 AS "isRequired",
                MIN(srd.sort_order) AS "sortOrder",
                ARRAY_AGG(DISTINCT COALESCE(ssr.scheme_name, 'Subsidy')) AS "applicableSchemes"
            FROM subsidy_required_documents srd
            JOIN subsidy_document_types sdt ON sdt.uid = srd.document_type_uid
            LEFT JOIN state_subsidy_rules ssr ON ssr.uid = srd.subsidy_uid
            WHERE srd.subsidy_uid = ANY($1::varchar[])
              AND srd.is_deleted = 0
              AND srd.is_active = 1
              AND sdt.is_deleted = 0
              AND sdt.is_active = 1
            GROUP BY sdt.uid, sdt.name, sdt.description, sdt.allow_multiple
            ORDER BY MIN(srd.sort_order) ASC, sdt.name ASC
        `;
        const result = await executor.query<ICombinedRequiredDocumentDetail>(query, [subsidyUids]);
        return result.rows;
    }

    public async getCountsBySubsidyUids(
        subsidyUids: string[],
        client?: PoolClient
    ): Promise<Record<string, number>> {
        if (subsidyUids.length === 0) return {};

        const executor = client || this.pool;
        const query = `
            SELECT subsidy_uid, COUNT(*) as count
            FROM subsidy_required_documents
            WHERE subsidy_uid = ANY($1::varchar[])
              AND is_deleted = 0
              AND is_active = 1
            GROUP BY subsidy_uid
        `;
        const result = await executor.query<{ subsidy_uid: string; count: string }>(query, [subsidyUids]);
        const map: Record<string, number> = {};
        for (const row of result.rows) {
            map[row.subsidy_uid] = parseInt(row.count, 10);
        }
        return map;
    }
}
