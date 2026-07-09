import type { Pool } from "pg";
import type { IProductBrand } from "../interfaces/product-brand.interface.js";

export class ProductBrandRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async create(data: { uid: string; name: string; description?: string; logo?: string; sortOrder?: number; createdBy: string }): Promise<IProductBrand> {
        const result = await this.pool.query(
            `INSERT INTO product_brands (uid, name, description, logo, sort_order, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [data.uid, data.name, data.description || null, data.logo || null, data.sortOrder || 0, data.createdBy]
        );
        return result.rows[0];
    }

    async update(uid: string, data: { name?: string; description?: string; logo?: string; sortOrder?: number; isActive?: number; updatedBy: string }): Promise<IProductBrand | null> {
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
        if (data.logo !== undefined) {
            fields.push(`logo = $${index++}`);
            values.push(data.logo);
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
            `UPDATE product_brands
             SET ${fields.join(", ")}
             WHERE uid = $${index}
             RETURNING *`,
            values
        );
        return result.rows[0] || null;
    }

    async findByUid(uid: string): Promise<IProductBrand | null> {
        const result = await this.pool.query(`SELECT * FROM product_brands WHERE uid = $1`, [uid]);
        return result.rows[0] || null;
    }

    async findByName(name: string): Promise<IProductBrand | null> {
        const result = await this.pool.query(`SELECT * FROM product_brands WHERE name = $1`, [name]);
        return result.rows[0] || null;
    }

    async findAll(status?: "active" | "deleted" | "all"): Promise<IProductBrand[]> {
        let query = `SELECT * FROM product_brands`;
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

    async findPaginated(page: number, limit: number, search?: string, status: "active" | "deleted" | "all" = "active"): Promise<{ brands: IProductBrand[]; total: number }> {
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

        const countResult = await this.pool.query(`SELECT COUNT(*) FROM product_brands ${whereClause}`, values);
        const total = parseInt(countResult.rows[0].count, 10);

        values.push(limit);
        const limitIndex = index++;
        values.push(offset);
        const offsetIndex = index++;

        const result = await this.pool.query(
            `SELECT * FROM product_brands ${whereClause} ORDER BY sort_order ASC NULLS LAST, created_at DESC LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
            values
        );

        return { brands: result.rows, total };
    }

    async isUsedByProducts(uid: string): Promise<boolean> {
        const result = await this.pool.query(`SELECT 1 FROM products WHERE brand_uid = $1 AND is_deleted = 0 LIMIT 1`, [uid]);
        return result.rowCount !== null && result.rowCount > 0;
    }

    async softDelete(uid: string, deletedBy: string): Promise<IProductBrand | null> {
        const result = await this.pool.query(
            `UPDATE product_brands SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1 WHERE uid = $2 RETURNING *`,
            [deletedBy, uid]
        );
        return result.rows[0] || null;
    }

    async restore(uid: string, updatedBy: string): Promise<IProductBrand | null> {
        const result = await this.pool.query(
            `UPDATE product_brands SET is_deleted = 0, deleted_at = NULL, deleted_by = NULL, updated_at = CURRENT_TIMESTAMP, updated_by = $1 WHERE uid = $2 RETURNING *`,
            [updatedBy, uid]
        );
        return result.rows[0] || null;
    }
}
