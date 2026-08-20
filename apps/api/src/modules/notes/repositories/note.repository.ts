import type { Pool, PoolClient } from "pg";
import type { INote, ICreateNote, IUpdateNote } from "../interfaces/note.interface.js";
import { v4 as uuidv4 } from "uuid";

const NOTE_COLUMNS = `
    n.id, n.uid, n.tenant_uid AS "tenantUid", n.module, n.module_uid AS "moduleUid", n.note,
    n.is_active AS "isActive", n.is_deleted AS "isDeleted",
    n.created_at AS "createdAt", n.updated_at AS "updatedAt",
    n.created_by AS "createdBy", n.updated_by AS "updatedBy", n.deleted_by AS "deletedBy"
`;

export class NoteRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async create(tenantUid: string, module: string, moduleUid: string, note: string, createdBy: string | undefined, client?: PoolClient): Promise<INote> {
        const executor = client || this.pool;
        const uid = uuidv4();
        
        const query = `
            INSERT INTO notes (
                uid, tenant_uid, module, module_uid, note, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING ${NOTE_COLUMNS.replace(/n\./g, '')}
        `;
        const values = [uid, tenantUid, module, moduleUid, note, createdBy || null];
        
        const result = await executor.query(query, values);
        return result.rows[0] as INote;
    }

    async getByUid(uid: string, tenantUid: string, client?: PoolClient): Promise<INote | null> {
        const executor = client || this.pool;
        const query = `
            SELECT ${NOTE_COLUMNS}
            FROM notes n
            WHERE n.uid = $1 AND n.tenant_uid = $2 AND n.is_deleted = 0
        `;
        const result = await executor.query(query, [uid, tenantUid]);
        return result.rows.length > 0 ? result.rows[0] as INote : null;
    }

    async getLatestByModule(tenantUid: string, module: string, moduleUid: string, client?: PoolClient): Promise<INote | null> {
        const executor = client || this.pool;
        const query = `
            SELECT ${NOTE_COLUMNS}
            FROM notes n
            WHERE n.tenant_uid = $1 AND n.module = $2 AND n.module_uid = $3 AND n.is_deleted = 0
            ORDER BY n.created_at DESC
            LIMIT 1
        `;
        const result = await executor.query(query, [tenantUid, module, moduleUid]);
        return result.rows.length > 0 ? result.rows[0] as INote : null;
    }

    async getAllByModule(tenantUid: string, module: string, moduleUid: string, client?: PoolClient): Promise<INote[]> {
        const executor = client || this.pool;
        const query = `
            SELECT ${NOTE_COLUMNS}
            FROM notes n
            WHERE n.tenant_uid = $1 AND n.module = $2 AND n.module_uid = $3 AND n.is_deleted = 0
            ORDER BY n.created_at DESC
        `;
        const result = await executor.query(query, [tenantUid, module, moduleUid]);
        return result.rows as INote[];
    }

    async getPaginated(
        tenantUid: string,
        moduleUid: string,
        page: number,
        limit: number,
        module?: string,
        client?: PoolClient
    ): Promise<{ rows: INote[]; total: number }> {
        const executor = client || this.pool;
        const offset = (page - 1) * limit;

        const params: any[] = [tenantUid, moduleUid];
        let whereClause = `n.tenant_uid = $1 AND n.module_uid = $2 AND n.is_deleted = 0`;

        if (module) {
            params.push(module);
            whereClause += ` AND n.module = $${params.length}`;
        }

        const countQuery = `SELECT COUNT(*) FROM notes n WHERE ${whereClause}`;
        const countResult = await executor.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        params.push(limit, offset);
        const dataQuery = `
            SELECT ${NOTE_COLUMNS}
            FROM notes n
            WHERE ${whereClause}
            ORDER BY n.created_at DESC
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `;
        const result = await executor.query(dataQuery, params);

        return { rows: result.rows as INote[], total };
    }

    async update(uid: string, tenantUid: string, data: IUpdateNote, updatedBy: string | undefined, client?: PoolClient): Promise<INote | null> {
        const executor = client || this.pool;
        const query = `
            UPDATE notes
            SET note = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
            WHERE uid = $3 AND tenant_uid = $4 AND is_deleted = 0
            RETURNING ${NOTE_COLUMNS.replace(/n\./g, '')}
        `;
        const result = await executor.query(query, [data.note, updatedBy || null, uid, tenantUid]);
        return result.rows.length > 0 ? result.rows[0] as INote : null;
    }

    async softDelete(uid: string, tenantUid: string, deletedBy: string | undefined, client?: PoolClient): Promise<boolean> {
        const executor = client || this.pool;
        const query = `
            UPDATE notes
            SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1, updated_at = CURRENT_TIMESTAMP
            WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 0
        `;
        const result = await executor.query(query, [deletedBy || null, uid, tenantUid]);
        return (result.rowCount ?? 0) > 0;
    }
}
