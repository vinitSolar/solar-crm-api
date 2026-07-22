import type { Pool, PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import type {
    ISubsidyDocumentType,
    ICreateSubsidyDocumentType,
    IUpdateSubsidyDocumentType,
} from "../interfaces/subsidy-document-type.interface.js";

const SUBSIDY_DOC_TYPE_COLUMNS = `
    sdt.id,
    sdt.uid,
    sdt.name,
    sdt.description,
    sdt.allow_multiple,
    sdt.is_required,
    sdt.sort_order,
    sdt.is_active,
    sdt.is_deleted,
    sdt.created_at,
    sdt.updated_at,
    sdt.deleted_at,
    sdt.created_by,
    sdt.updated_by,
    sdt.deleted_by
`;

export class SubsidyDocumentTypeRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    public async create(
        data: ICreateSubsidyDocumentType,
        createdBy: string,
        client?: PoolClient
    ): Promise<ISubsidyDocumentType> {
        const uid = uuidv4();
        const query = `
            INSERT INTO subsidy_document_types (
                uid, name, description, allow_multiple, is_required, sort_order, created_by, updated_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const values = [
            uid,
            data.name.trim(),
            data.description ?? null,
            data.allowMultiple ? 1 : 0,
            data.isRequired ? 1 : 0,
            data.sortOrder ?? 0,
            createdBy,
            createdBy,
        ];

        const executor = client || this.pool;
        const result = await executor.query<ISubsidyDocumentType>(query, values);
        return result.rows[0] as ISubsidyDocumentType;
    }

    public async findByUid(uid: string, client?: PoolClient): Promise<ISubsidyDocumentType | null> {
        const query = `
            SELECT ${SUBSIDY_DOC_TYPE_COLUMNS}
            FROM subsidy_document_types sdt
            WHERE sdt.uid = $1
        `;
        const executor = client || this.pool;
        const result = await executor.query<ISubsidyDocumentType>(query, [uid]);
        return result.rows[0] || null;
    }

    public async findByName(name: string, excludeUid?: string, client?: PoolClient): Promise<ISubsidyDocumentType | null> {
        let query = `
            SELECT ${SUBSIDY_DOC_TYPE_COLUMNS}
            FROM subsidy_document_types sdt
            WHERE LOWER(sdt.name) = LOWER($1)
              AND sdt.is_deleted = 0
        `;
        const values: any[] = [name.trim()];

        if (excludeUid) {
            query += ` AND sdt.uid != $2`;
            values.push(excludeUid);
        }

        const executor = client || this.pool;
        const result = await executor.query<ISubsidyDocumentType>(query, values);
        return result.rows[0] || null;
    }

    public async findByUids(uids: string[], client?: PoolClient): Promise<ISubsidyDocumentType[]> {
        if (uids.length === 0) return [];
        const query = `
            SELECT ${SUBSIDY_DOC_TYPE_COLUMNS}
            FROM subsidy_document_types sdt
            WHERE sdt.uid = ANY($1::varchar[])
              AND sdt.is_deleted = 0
              AND sdt.is_active = 1
        `;
        const executor = client || this.pool;
        const result = await executor.query<ISubsidyDocumentType>(query, [uids]);
        return result.rows;
    }

    public async getPaginated(
        page: number,
        limit: number,
        search?: string,
        status: "active" | "deleted" | "all" = "active"
    ): Promise<{ data: ISubsidyDocumentType[]; total: number }> {
        const offset = (page - 1) * limit;
        const whereClauses: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (status === "active") {
            whereClauses.push(`sdt.is_deleted = 0`);
        } else if (status === "deleted") {
            whereClauses.push(`sdt.is_deleted = 1`);
        }

        if (search) {
            whereClauses.push(`(sdt.name ILIKE $${index} OR sdt.description ILIKE $${index})`);
            values.push(`%${search}%`);
            index++;
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

        const countQuery = `
            SELECT COUNT(*) 
            FROM subsidy_document_types sdt 
            ${whereString}
        `;

        const dataQuery = `
            SELECT ${SUBSIDY_DOC_TYPE_COLUMNS} 
            FROM subsidy_document_types sdt 
            ${whereString}
            ORDER BY sdt.sort_order ASC, sdt.created_at DESC
            LIMIT $${index} OFFSET $${index + 1}
        `;

        const [countResult, dataResult] = await Promise.all([
            this.pool.query<{ count: string }>(countQuery, values),
            this.pool.query<ISubsidyDocumentType>(dataQuery, [...values, limit, offset]),
        ]);

        return {
            data: dataResult.rows,
            total: parseInt(countResult.rows[0]?.count || "0", 10),
        };
    }

    public async getAll(status: "active" | "deleted" | "all" = "active"): Promise<ISubsidyDocumentType[]> {
        const whereClauses: string[] = [];
        if (status === "active") {
            whereClauses.push(`sdt.is_deleted = 0 AND sdt.is_active = 1`);
        } else if (status === "deleted") {
            whereClauses.push(`sdt.is_deleted = 1`);
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

        const query = `
            SELECT ${SUBSIDY_DOC_TYPE_COLUMNS}
            FROM subsidy_document_types sdt
            ${whereString}
            ORDER BY sdt.sort_order ASC, sdt.name ASC
        `;
        const result = await this.pool.query<ISubsidyDocumentType>(query);
        return result.rows;
    }

    public async update(
        uid: string,
        data: IUpdateSubsidyDocumentType,
        updatedBy: string,
        client?: PoolClient
    ): Promise<ISubsidyDocumentType> {
        const setClause: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (data.name !== undefined) {
            setClause.push(`name = $${index++}`);
            values.push(data.name.trim());
        }
        if (data.description !== undefined) {
            setClause.push(`description = $${index++}`);
            values.push(data.description ?? null);
        }
        if (data.allowMultiple !== undefined) {
            setClause.push(`allow_multiple = $${index++}`);
            values.push(data.allowMultiple ? 1 : 0);
        }
        if (data.isRequired !== undefined) {
            setClause.push(`is_required = $${index++}`);
            values.push(data.isRequired ? 1 : 0);
        }
        if (data.sortOrder !== undefined) {
            setClause.push(`sort_order = $${index++}`);
            values.push(data.sortOrder);
        }
        if (data.isActive !== undefined) {
            setClause.push(`is_active = $${index++}`);
            values.push(data.isActive ? 1 : 0);
        }

        setClause.push(`updated_by = $${index++}`);
        values.push(updatedBy);
        setClause.push(`updated_at = CURRENT_TIMESTAMP`);

        values.push(uid);

        const query = `
            UPDATE subsidy_document_types
            SET ${setClause.join(", ")}
            WHERE uid = $${index}
            RETURNING *
        `;

        const executor = client || this.pool;
        const result = await executor.query<ISubsidyDocumentType>(query, values);
        return result.rows[0] as ISubsidyDocumentType;
    }

    public async softDelete(uid: string, deletedBy: string, client?: PoolClient): Promise<void> {
        const query = `
            UPDATE subsidy_document_types 
            SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1, updated_by = $1, updated_at = CURRENT_TIMESTAMP
            WHERE uid = $2
        `;
        const executor = client || this.pool;
        await executor.query(query, [deletedBy, uid]);
    }

    public async restore(uid: string, updatedBy: string, client?: PoolClient): Promise<void> {
        const query = `
            UPDATE subsidy_document_types 
            SET is_deleted = 0, deleted_at = NULL, deleted_by = NULL, updated_by = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE uid = $2
        `;
        const executor = client || this.pool;
        await executor.query(query, [updatedBy, uid]);
    }
}
