import { v4 as uuidv4 } from "uuid";
import type { Pool, PoolClient } from "pg";
import pool from "@packages/connection.js";
import type { IProductCellTechnology, ICreateProductCellTechnology, IUpdateProductCellTechnology, IPaginatedResponse } from "../interfaces/product-cell-technology.interface.js";

export class ProductCellTechnologyRepository {
    async findById(uid: string): Promise<IProductCellTechnology | null> {
        const query = `
            SELECT id, uid, name, description, sort_order, is_active, 
                   is_deleted, deleted_at, created_at, updated_at, 
                   created_by, updated_by, deleted_by
            FROM product_cell_technologies
            WHERE uid = $1
        `;
        const result = await pool.query(query, [uid]);

        if (result.rows.length === 0) return null;

        return this.mapToEntity(result.rows[0]);
    }

    async findByName(name: string): Promise<IProductCellTechnology | null> {
        const query = `
            SELECT id, uid, name, description, sort_order, is_active, 
                   is_deleted, deleted_at, created_at, updated_at, 
                   created_by, updated_by, deleted_by
            FROM product_cell_technologies
            WHERE name = $1 AND is_deleted = 0
        `;
        const result = await pool.query(query, [name]);

        if (result.rows.length === 0) return null;

        return this.mapToEntity(result.rows[0]);
    }

    async create(data: ICreateProductCellTechnology, userUid: string): Promise<IProductCellTechnology> {
        const uid = uuidv4();
        const query = `
            INSERT INTO product_cell_technologies (
                uid, name, description, sort_order, created_by
            ) VALUES (
                $1, $2, $3, $4, $5
            ) RETURNING *
        `;
        const values = [
            uid,
            data.name,
            data.description || null,
            data.sortOrder || 0,
            userUid,
        ];

        const result = await pool.query(query, values);
        return this.mapToEntity(result.rows[0]);
    }

    async update(uid: string, data: IUpdateProductCellTechnology, userUid: string): Promise<IProductCellTechnology> {
        const setClause: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (data.name !== undefined) {
            setClause.push(`name = $${index++}`);
            values.push(data.name);
        }
        if (data.description !== undefined) {
            setClause.push(`description = $${index++}`);
            values.push(data.description);
        }
        if (data.sortOrder !== undefined) {
            setClause.push(`sort_order = $${index++}`);
            values.push(data.sortOrder);
        }
        if (data.isActive !== undefined) {
            setClause.push(`is_active = $${index++}`);
            values.push(data.isActive);
        }

        setClause.push(`updated_by = $${index++}`);
        values.push(userUid);
        setClause.push(`updated_at = CURRENT_TIMESTAMP`);

        values.push(uid); // The UID for the WHERE clause

        const query = `
            UPDATE product_cell_technologies
            SET ${setClause.join(", ")}
            WHERE uid = $${index}
            RETURNING *
        `;

        const result = await pool.query(query, values);
        return this.mapToEntity(result.rows[0]);
    }

    async delete(uid: string, userUid: string): Promise<void> {
        const query = `
            UPDATE product_cell_technologies
            SET is_deleted = 1,
                deleted_at = CURRENT_TIMESTAMP,
                deleted_by = $1,
                is_active = 0
            WHERE uid = $2
        `;
        await pool.query(query, [userUid, uid]);
    }

    async list(page: number, limit: number, search?: string, status: "active" | "deleted" | "all" = "active"): Promise<IPaginatedResponse<IProductCellTechnology>> {
        const offset = (page - 1) * limit;
        let whereClause = "1=1";
        const values: any[] = [];
        let index = 1;

        if (status === "active") {
            whereClause += " AND is_deleted = 0 AND is_active = 1";
        } else if (status === "deleted") {
            whereClause += " AND is_deleted = 1";
        }

        if (search) {
            whereClause += ` AND name ILIKE $${index++}`;
            values.push(`%${search}%`);
        }

        const countQuery = `SELECT COUNT(*) FROM product_cell_technologies WHERE ${whereClause}`;
        const countResult = await pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count);

        values.push(limit, offset);
        const dataQuery = `
            SELECT id, uid, name, description, sort_order, is_active, 
                   is_deleted, deleted_at, created_at, updated_at, 
                   created_by, updated_by, deleted_by
            FROM product_cell_technologies
            WHERE ${whereClause}
            ORDER BY sort_order ASC, created_at DESC
            LIMIT $${index++} OFFSET $${index++}
        `;

        const result = await pool.query(dataQuery, values);

        return {
            data: result.rows.map((row) => this.mapToEntity(row)),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findAll(status: "active" | "deleted" | "all" = "active"): Promise<IProductCellTechnology[]> {
        let whereClause = "1=1";
        if (status === "active") {
            whereClause += " AND is_deleted = 0 AND is_active = 1";
        } else if (status === "deleted") {
            whereClause += " AND is_deleted = 1";
        }

        const query = `
            SELECT id, uid, name, description, sort_order, is_active, 
                   is_deleted, deleted_at, created_at, updated_at, 
                   created_by, updated_by, deleted_by
            FROM product_cell_technologies
            WHERE ${whereClause}
            ORDER BY sort_order ASC, name ASC
        `;
        const result = await pool.query(query);

        return result.rows.map((row) => this.mapToEntity(row));
    }

    async checkInUse(uid: string): Promise<boolean> {
        const query = `SELECT 1 FROM products WHERE cell_technology_uid = $1 LIMIT 1`;
        const result = await pool.query(query, [uid]);
        return (result.rowCount || 0) > 0;
    }

    private mapToEntity(row: any): IProductCellTechnology {
        return {
            id: row.id,
            uid: row.uid,
            name: row.name,
            description: row.description,
            sortOrder: row.sort_order,
            isActive: row.is_active,
            isDeleted: row.is_deleted,
            deletedAt: row.deleted_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            createdBy: row.created_by,
            updatedBy: row.updated_by,
            deletedBy: row.deleted_by,
        };
    }
}
