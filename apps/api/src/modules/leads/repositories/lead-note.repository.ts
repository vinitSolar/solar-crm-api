import type { Pool } from "pg";
import type { ILeadNote, ICreateLeadNote, IUpdateLeadNote } from "../interfaces/lead-note.interface.js";
import { v4 as uuidv4 } from "uuid";

const LEAD_NOTE_COLUMNS = `
    id, uid, tenant_uid AS "tenantUid", lead_uid AS "leadUid", note,
    is_active AS "isActive", is_deleted AS "isDeleted",
    created_at AS "createdAt", updated_at AS "updatedAt",
    created_by AS "createdBy", updated_by AS "updatedBy", deleted_by AS "deletedBy"
`;

export class LeadNoteRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async create(tenantUid: string, leadUid: string, data: ICreateLeadNote, createdBy: string): Promise<ILeadNote> {
        const uid = uuidv4();
        const query = `
            INSERT INTO lead_notes (uid, tenant_uid, lead_uid, note, created_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING ${LEAD_NOTE_COLUMNS}
        `;
        const values = [uid, tenantUid, leadUid, data.note, createdBy];
        const result = await this.pool.query(query, values);
        return result.rows[0] as ILeadNote;
    }

    async getByUid(tenantUid: string, leadUid: string, uid: string): Promise<ILeadNote | null> {
        const query = `
            SELECT ${LEAD_NOTE_COLUMNS}
            FROM lead_notes
            WHERE tenant_uid = $1 AND lead_uid = $2 AND uid = $3 AND is_deleted = 0
        `;
        const result = await this.pool.query(query, [tenantUid, leadUid, uid]);
        return (result.rows[0] as ILeadNote) || null;
    }

    async update(tenantUid: string, leadUid: string, uid: string, data: IUpdateLeadNote, updatedBy: string): Promise<ILeadNote | null> {
        const query = `
            UPDATE lead_notes
            SET note = COALESCE($1, note),
                updated_at = CURRENT_TIMESTAMP,
                updated_by = $2
            WHERE tenant_uid = $3 AND lead_uid = $4 AND uid = $5 AND is_deleted = 0
            RETURNING ${LEAD_NOTE_COLUMNS}
        `;
        const values = [data.note, updatedBy, tenantUid, leadUid, uid];
        const result = await this.pool.query(query, values);
        return (result.rows[0] as ILeadNote) || null;
    }

    async softDelete(tenantUid: string, leadUid: string, uid: string, deletedBy: string): Promise<boolean> {
        const query = `
            UPDATE lead_notes
            SET is_deleted = 1,
                is_active = 0,
                deleted_by = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE tenant_uid = $2 AND lead_uid = $3 AND uid = $4 AND is_deleted = 0
        `;
        const result = await this.pool.query(query, [deletedBy, tenantUid, leadUid, uid]);
        return (result.rowCount ?? 0) > 0;
    }

    async getPaginated(tenantUid: string, leadUid: string, page: number, limit: number, search?: string): Promise<{ rows: ILeadNote[], total: number }> {
        const offset = (page - 1) * limit;
        let whereClause = `WHERE tenant_uid = $1 AND lead_uid = $2 AND is_deleted = 0`;
        const queryParams: any[] = [tenantUid, leadUid];

        if (search) {
            whereClause += ` AND note ILIKE $3`;
            queryParams.push(`%${search}%`);
        }

        const countQuery = `SELECT COUNT(*) FROM lead_notes ${whereClause}`;
        const countResult = await this.pool.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT ${LEAD_NOTE_COLUMNS}
            FROM lead_notes
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `;
        const result = await this.pool.query(dataQuery, [...queryParams, limit, offset]);

        return {
            rows: result.rows as ILeadNote[],
            total
        };
    }

    async getAll(tenantUid: string, leadUid: string): Promise<ILeadNote[]> {
        const query = `
            SELECT ${LEAD_NOTE_COLUMNS}
            FROM lead_notes
            WHERE tenant_uid = $1 AND lead_uid = $2 AND is_deleted = 0
            ORDER BY created_at DESC
        `;
        const result = await this.pool.query(query, [tenantUid, leadUid]);
        return result.rows as ILeadNote[];
    }
}
