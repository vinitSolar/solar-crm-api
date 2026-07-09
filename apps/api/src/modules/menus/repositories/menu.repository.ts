import type { Pool } from "pg";
import type { IMenu } from "../dto/menu.dto.js";

export class MenuRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }
    async create(data: { uid: string; name: string; code: string; route?: string; icon?: string; parentUid?: string; sortOrder?: number }): Promise<IMenu> {
        const result = await this.pool.query(
            `INSERT INTO menus (uid, name, code, route, icon, parent_uid, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [data.uid, data.name, data.code, data.route || null, data.icon || null, data.parentUid || null, data.sortOrder || null]
        );
        return result.rows[0];
    }

    async update(uid: string, data: { name?: string; code?: string; route?: string; icon?: string; parentUid?: string | null; sortOrder?: number | null; isActive?: number }): Promise<IMenu | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (data.name !== undefined) {
            fields.push(`name = $${index++}`);
            values.push(data.name);
        }
        if (data.code !== undefined) {
            fields.push(`code = $${index++}`);
            values.push(data.code);
        }
        if (data.route !== undefined) {
            fields.push(`route = $${index++}`);
            values.push(data.route);
        }
        if (data.icon !== undefined) {
            fields.push(`icon = $${index++}`);
            values.push(data.icon);
        }
        if (data.parentUid !== undefined) {
            fields.push(`parent_uid = $${index++}`);
            values.push(data.parentUid);
        }
        if (data.sortOrder !== undefined) {
            fields.push(`sort_order = $${index++}`);
            values.push(data.sortOrder);
        }
        if (data.isActive !== undefined) {
            fields.push(`is_active = $${index++}`);
            values.push(data.isActive);
        }

        if (fields.length === 0) {
            return this.findByUid(uid);
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(uid);

        const result = await this.pool.query(
            `UPDATE menus
             SET ${fields.join(", ")}
             WHERE uid = $${index}
             RETURNING *`,
            values
        );
        return result.rows[0] || null;
    }

    async findByUid(uid: string): Promise<IMenu | null> {
        const result = await this.pool.query(`SELECT * FROM menus WHERE uid = $1`, [uid]);
        return result.rows[0] || null;
    }

    async findByUids(uids: string[]): Promise<IMenu[]> {
        if (!uids || uids.length === 0) return [];
        const result = await this.pool.query(`SELECT * FROM menus WHERE uid = ANY($1)`, [uids]);
        return result.rows;
    }

    async findByCode(code: string): Promise<IMenu | null> {
        const result = await this.pool.query(`SELECT * FROM menus WHERE code = $1`, [code]);
        return result.rows[0] || null;
    }

    async findAll(status?: "active" | "deleted" | "all"): Promise<IMenu[]> {
        let query = `SELECT * FROM menus`;
        const conditions: string[] = [];

        if (status === "active") {
            conditions.push(`deleted_at IS NULL`);
        } else if (status === "deleted") {
            conditions.push(`deleted_at IS NOT NULL`);
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(" AND ")}`;
        }

        query += ` ORDER BY sort_order ASC NULLS LAST, created_at DESC`;

        const result = await this.pool.query(query);
        return result.rows;
    }

    async findPaginated(page: number, limit: number, search?: string, status: "active" | "deleted" | "all" = "active"): Promise<{ menus: IMenu[]; total: number }> {
        const offset = (page - 1) * limit;
        const values: any[] = [];
        const conditions: string[] = [];
        let index = 1;

        if (status === "active") {
            conditions.push(`deleted_at IS NULL`);
        } else if (status === "deleted") {
            conditions.push(`deleted_at IS NOT NULL`);
        }

        if (search) {
            conditions.push(`(name ILIKE $${index} OR code ILIKE $${index})`);
            values.push(`%${search}%`);
            index++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const countResult = await this.pool.query(`SELECT COUNT(*) FROM menus ${whereClause}`, values);
        const total = parseInt(countResult.rows[0].count, 10);

        values.push(limit);
        const limitIndex = index++;
        values.push(offset);
        const offsetIndex = index++;

        const result = await this.pool.query(
            `SELECT * FROM menus ${whereClause} ORDER BY sort_order ASC NULLS LAST, created_at DESC LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
            values
        );

        return { menus: result.rows, total };
    }

    async softDelete(uid: string): Promise<IMenu | null> {
        const result = await this.pool.query(
            `UPDATE menus SET deleted_at = CURRENT_TIMESTAMP WHERE uid = $1 RETURNING *`,
            [uid]
        );
        return result.rows[0] || null;
    }

    async restore(uid: string): Promise<IMenu | null> {
        const result = await this.pool.query(
            `UPDATE menus SET deleted_at = NULL WHERE uid = $1 RETURNING *`,
            [uid]
        );
        return result.rows[0] || null;
    }
}
