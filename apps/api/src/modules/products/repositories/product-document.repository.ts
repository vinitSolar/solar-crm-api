import type { Pool, PoolClient } from "pg";

export interface IProductDocument {
    id: string;
    uid: string;
    tenantUid: string;
    productUid: string;
    documentTypeUid: string;
    originalFileName: string;
    storedFileName: string;
    filePath: string;
    mimeType: string;
    fileSize: number;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
    documentTypeName?: string; // Joined from product_document_types
}

export class ProductDocumentRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    private mapRowToProductDocument(row: any): IProductDocument {
        return {
            id: row.id,
            uid: row.uid,
            tenantUid: row.tenantUid || row.tenant_uid,
            productUid: row.product_uid,
            documentTypeUid: row.document_type_uid,
            originalFileName: row.original_file_name,
            storedFileName: row.stored_file_name,
            filePath: row.file_path,
            mimeType: row.mime_type,
            fileSize: Number(row.file_size),
            isActive: row.is_active,
            isDeleted: row.is_deleted,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            createdBy: row.created_by,
            updatedBy: row.updated_by,
            deletedBy: row.deleted_by,
            documentTypeName: row.document_type_name,
        };
    }

    async create(
        tenantUid: string,
        productUid: string,
        documentTypeUid: string,
        originalFileName: string,
        storedFileName: string,
        filePath: string,
        mimeType: string,
        fileSize: number,
        createdBy: string,
        client?: PoolClient
    ): Promise<IProductDocument> {
        const query = `
            INSERT INTO product_documents (
                uid, tenant_uid, product_uid, document_type_uid, original_file_name, 
                stored_file_name, file_path, mime_type, file_size, created_by
            )
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        const values = [
            tenantUid, productUid, documentTypeUid, originalFileName, storedFileName, 
            filePath, mimeType, fileSize, createdBy
        ];

        const res = client
            ? await client.query(query, values)
            : await this.pool.query(query, values);

        return this.mapRowToProductDocument(res.rows[0]);
    }

    async softDelete(tenantUid: string, uid: string, deletedBy: string, client?: PoolClient): Promise<boolean> {
        const query = `
            UPDATE product_documents
            SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1
            WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 0
            RETURNING *
        `;
        const res = client
            ? await client.query(query, [deletedBy, uid, tenantUid])
            : await this.pool.query(query, [deletedBy, uid, tenantUid]);

        return res.rowCount !== 0;
    }

    async softDeleteMultiple(tenantUid: string, uids: string[], deletedBy: string, client?: PoolClient): Promise<void> {
        if (uids.length === 0) return;
        const query = `
            UPDATE product_documents
            SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1
            WHERE uid = ANY($2) AND tenant_uid = $3 AND is_deleted = 0
        `;
        client
            ? await client.query(query, [deletedBy, uids, tenantUid])
            : await this.pool.query(query, [deletedBy, uids, tenantUid]);
    }

    async getByProductUid(tenantUid: string, productUid: string, client?: PoolClient): Promise<IProductDocument[]> {
        const query = `
            SELECT pd.*, pdt.name as document_type_name
            FROM product_documents pd
            LEFT JOIN product_document_types pdt ON pd.document_type_uid = pdt.uid
            WHERE pd.product_uid = $1 AND pd.tenant_uid = $2 AND pd.is_deleted = 0 AND pd.is_active = 1
            ORDER BY pd.created_at ASC
        `;
        const res = client
            ? await client.query(query, [productUid, tenantUid])
            : await this.pool.query(query, [productUid, tenantUid]);

        return res.rows.map(row => this.mapRowToProductDocument(row));
    }

    async getActiveDocumentsByType(tenantUid: string, productUid: string, documentTypeUid: string, client?: PoolClient): Promise<IProductDocument[]> {
        const query = `
            SELECT pd.*, pdt.name as document_type_name
            FROM product_documents pd
            LEFT JOIN product_document_types pdt ON pd.document_type_uid = pdt.uid
            WHERE pd.product_uid = $1 AND pd.tenant_uid = $2 AND pd.document_type_uid = $3 AND pd.is_deleted = 0 AND pd.is_active = 1
        `;
        const res = client
            ? await client.query(query, [productUid, tenantUid, documentTypeUid])
            : await this.pool.query(query, [productUid, tenantUid, documentTypeUid]);

        return res.rows.map(row => this.mapRowToProductDocument(row));
    }
}
