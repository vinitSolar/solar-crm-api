import type { Pool } from "pg";
import type { IProductCategory } from "../interfaces/product-category.interface.js";

export class ProductCategoryRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async create(data: { uid: string; name: string; description?: string; image?: string; sortOrder?: number; createdBy: string }): Promise<IProductCategory> {
        let sortOrder = data.sortOrder;
        if (sortOrder === undefined || sortOrder === null) {
            const maxRes = await this.pool.query(
                `SELECT COALESCE(MAX(sort_order), 0) AS max_sort FROM product_categories WHERE is_deleted = 0`
            );
            sortOrder = Number(maxRes.rows[0]?.max_sort || 0) + 1;
        }

        const result = await this.pool.query(
            `INSERT INTO product_categories (uid, name, description, image, sort_order, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [data.uid, data.name, data.description || null, data.image || null, sortOrder, data.createdBy]
        );
        return result.rows[0];
    }

    async update(uid: string, data: { name?: string; description?: string; image?: string; sortOrder?: number; isActive?: number; updatedBy: string }): Promise<IProductCategory | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (data.name !== undefined) {
            fields.push(`name = $${index++}`);
            values.push(data.name);
        }
        if (data.description !== undefined) {
            fields.push(`description = $${index++}`);
            values.push(data.description);
        }
        if (data.image !== undefined) {
            fields.push(`image = $${index++}`);
            values.push(data.image);
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

        fields.push(`updated_by = $${index++}`);
        values.push(data.updatedBy);

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(uid);

        const result = await this.pool.query(
            `UPDATE product_categories
             SET ${fields.join(", ")}
             WHERE uid = $${index}
             RETURNING *`,
            values
        );
        return result.rows[0] || null;
    }

    async findByUid(uid: string): Promise<IProductCategory | null> {
        const result = await this.pool.query(`SELECT * FROM product_categories WHERE uid = $1`, [uid]);
        return result.rows[0] || null;
    }

    async findByName(name: string): Promise<IProductCategory | null> {
        const result = await this.pool.query(`SELECT * FROM product_categories WHERE name = $1`, [name]);
        return result.rows[0] || null;
    }

    async findAll(status?: "active" | "deleted" | "all"): Promise<IProductCategory[]> {
        let query = `SELECT * FROM product_categories`;
        const conditions: string[] = [];

        if (status === "active") {
            conditions.push(`is_deleted = 0`);
        } else if (status === "deleted") {
            conditions.push(`is_deleted = 1`);
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(" AND ")}`;
        }

        query += ` ORDER BY sort_order ASC NULLS LAST, created_at DESC`;

        const result = await this.pool.query(query);
        return result.rows;
    }

    async findPaginated(page: number, limit: number, search?: string, status: "active" | "deleted" | "all" = "active"): Promise<{ categories: IProductCategory[]; total: number }> {
        const offset = (page - 1) * limit;
        const values: any[] = [];
        const conditions: string[] = [];
        let index = 1;

        if (status === "active") {
            conditions.push(`is_deleted = 0`);
        } else if (status === "deleted") {
            conditions.push(`is_deleted = 1`);
        }

        if (search) {
            conditions.push(`name ILIKE $${index}`);
            values.push(`%${search}%`);
            index++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const countResult = await this.pool.query(`SELECT COUNT(*) FROM product_categories ${whereClause}`, values);
        const total = parseInt(countResult.rows[0].count, 10);

        values.push(limit);
        const limitIndex = index++;
        values.push(offset);
        const offsetIndex = index++;

        const result = await this.pool.query(
            `SELECT * FROM product_categories ${whereClause} ORDER BY sort_order ASC NULLS LAST, created_at DESC LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
            values
        );

        return { categories: result.rows, total };
    }

    async isUsedByProducts(uid: string): Promise<boolean> {
        const result = await this.pool.query(`SELECT 1 FROM products WHERE category_uid = $1 AND is_deleted = 0 LIMIT 1`, [uid]);
        return result.rowCount !== null && result.rowCount > 0;
    }

    async softDelete(uid: string, deletedBy: string): Promise<IProductCategory | null> {
        const result = await this.pool.query(
            `UPDATE product_categories SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1 WHERE uid = $2 RETURNING *`,
            [deletedBy, uid]
        );
        return result.rows[0] || null;
    }

    async restore(uid: string, updatedBy: string): Promise<IProductCategory | null> {
        const result = await this.pool.query(
            `UPDATE product_categories SET is_deleted = 0, deleted_at = NULL, deleted_by = NULL, updated_at = CURRENT_TIMESTAMP, updated_by = $1 WHERE uid = $2 RETURNING *`,
            [updatedBy, uid]
        );
        return result.rows[0] || null;
    }
}
