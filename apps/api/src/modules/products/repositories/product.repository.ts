import type { Pool } from "pg";
import type { IProduct } from "../interfaces/product.interface.js";

export class ProductRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async create(data: {
        uid: string;
        categoryUid: string;
        brandUid: string;
        unitUid: string;
        name: string;
        productCode: string;
        pricePerUnit: number;
        gstPercentage: number;
        capacity?: string;
        capacityUnit?: string;
        warranty?: string;
        description?: string;
        createdBy: string;
    }): Promise<IProduct> {
        const result = await this.pool.query(
            `INSERT INTO products (
                uid, category_uid, brand_uid, unit_uid, name, product_code, 
                price_per_unit, gst_percentage, capacity, capacity_unit, 
                warranty, description, created_by
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING *`,
            [
                data.uid, data.categoryUid, data.brandUid, data.unitUid, data.name, data.productCode,
                data.pricePerUnit, data.gstPercentage, data.capacity || null, data.capacityUnit || null,
                data.warranty || null, data.description || null, data.createdBy
            ]
        );
        return {
            ...result.rows[0],
            categoryUid: result.rows[0].category_uid,
            brandUid: result.rows[0].brand_uid,
            unitUid: result.rows[0].unit_uid,
            productCode: result.rows[0].product_code,
            pricePerUnit: result.rows[0].price_per_unit,
            gstPercentage: result.rows[0].gst_percentage,
            capacityUnit: result.rows[0].capacity_unit,
        };
    }

    async update(uid: string, data: {
        categoryUid?: string;
        brandUid?: string;
        unitUid?: string;
        name?: string;
        productCode?: string;
        pricePerUnit?: number;
        gstPercentage?: number;
        capacity?: string | null;
        capacityUnit?: string | null;
        warranty?: string | null;
        description?: string | null;
        isActive?: number;
        updatedBy: string;
    }): Promise<IProduct | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let index = 1;

        const pushField = (dbField: string, value: any) => {
            fields.push(`${dbField} = $${index++}`);
            values.push(value);
        };

        if (data.categoryUid !== undefined) pushField('category_uid', data.categoryUid);
        if (data.brandUid !== undefined) pushField('brand_uid', data.brandUid);
        if (data.unitUid !== undefined) pushField('unit_uid', data.unitUid);
        if (data.name !== undefined) pushField('name', data.name);
        if (data.productCode !== undefined) pushField('product_code', data.productCode);
        if (data.pricePerUnit !== undefined) pushField('price_per_unit', data.pricePerUnit);
        if (data.gstPercentage !== undefined) pushField('gst_percentage', data.gstPercentage);
        if (data.capacity !== undefined) pushField('capacity', data.capacity);
        if (data.capacityUnit !== undefined) pushField('capacity_unit', data.capacityUnit);
        if (data.warranty !== undefined) pushField('warranty', data.warranty);
        if (data.description !== undefined) pushField('description', data.description);
        if (data.isActive !== undefined) pushField('is_active', data.isActive);

        if (fields.length === 0) {
            return this.findByUid(uid);
        }

        pushField('updated_by', data.updatedBy);
        pushField('updated_at', 'CURRENT_TIMESTAMP'); // Need special handling for functions

        // Pop updated_at and updated_by to handle CURRENT_TIMESTAMP properly
        fields.pop(); 
        values.pop();
        fields.push(`updated_at = CURRENT_TIMESTAMP`);

        fields.push(`updated_by = $${index++}`);
        values.push(data.updatedBy);

        values.push(uid);

        const result = await this.pool.query(
            `UPDATE products
             SET ${fields.join(", ")}
             WHERE uid = $${index}
             RETURNING *`,
            values
        );
        
        if (!result.rows[0]) return null;

        return {
            ...result.rows[0],
            categoryUid: result.rows[0].category_uid,
            brandUid: result.rows[0].brand_uid,
            unitUid: result.rows[0].unit_uid,
            productCode: result.rows[0].product_code,
            pricePerUnit: result.rows[0].price_per_unit,
            gstPercentage: result.rows[0].gst_percentage,
            capacityUnit: result.rows[0].capacity_unit,
        };
    }

    async findByUid(uid: string): Promise<IProduct | null> {
        const result = await this.pool.query(`SELECT * FROM products WHERE uid = $1`, [uid]);
        if (!result.rows[0]) return null;
        return {
            ...result.rows[0],
            categoryUid: result.rows[0].category_uid,
            brandUid: result.rows[0].brand_uid,
            unitUid: result.rows[0].unit_uid,
            productCode: result.rows[0].product_code,
            pricePerUnit: result.rows[0].price_per_unit,
            gstPercentage: result.rows[0].gst_percentage,
            capacityUnit: result.rows[0].capacity_unit,
        };
    }

    async findByName(name: string): Promise<IProduct | null> {
        const result = await this.pool.query(`SELECT * FROM products WHERE name = $1`, [name]);
        if (!result.rows[0]) return null;
        return {
            ...result.rows[0],
            categoryUid: result.rows[0].category_uid,
            brandUid: result.rows[0].brand_uid,
            unitUid: result.rows[0].unit_uid,
            productCode: result.rows[0].product_code,
            pricePerUnit: result.rows[0].price_per_unit,
            gstPercentage: result.rows[0].gst_percentage,
            capacityUnit: result.rows[0].capacity_unit,
        };
    }

    async findByCode(code: string): Promise<IProduct | null> {
        const result = await this.pool.query(`SELECT * FROM products WHERE product_code = $1`, [code]);
        if (!result.rows[0]) return null;
        return {
            ...result.rows[0],
            categoryUid: result.rows[0].category_uid,
            brandUid: result.rows[0].brand_uid,
            unitUid: result.rows[0].unit_uid,
            productCode: result.rows[0].product_code,
            pricePerUnit: result.rows[0].price_per_unit,
            gstPercentage: result.rows[0].gst_percentage,
            capacityUnit: result.rows[0].capacity_unit,
        };
    }

    async findAll(status?: "active" | "deleted" | "all"): Promise<IProduct[]> {
        let query = `SELECT * FROM products`;
        const conditions: string[] = [];

        if (status === "active") {
            conditions.push(`is_deleted = 0`);
        } else if (status === "deleted") {
            conditions.push(`is_deleted = 1`);
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(" AND ")}`;
        }

        query += ` ORDER BY created_at DESC`;

        const result = await this.pool.query(query);
        return result.rows.map(row => ({
            ...row,
            categoryUid: row.category_uid,
            brandUid: row.brand_uid,
            unitUid: row.unit_uid,
            productCode: row.product_code,
            pricePerUnit: row.price_per_unit,
            gstPercentage: row.gst_percentage,
            capacityUnit: row.capacity_unit,
        }));
    }

    async findPaginated(page: number, limit: number, search?: string, categoryUid?: string, brandUid?: string, status: "active" | "deleted" | "all" = "active"): Promise<{ products: IProduct[]; total: number }> {
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
            conditions.push(`(name ILIKE $${index} OR product_code ILIKE $${index})`);
            values.push(`%${search}%`);
            index++;
        }

        if (categoryUid) {
            conditions.push(`category_uid = $${index}`);
            values.push(categoryUid);
            index++;
        }

        if (brandUid) {
            conditions.push(`brand_uid = $${index}`);
            values.push(brandUid);
            index++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const countResult = await this.pool.query(`SELECT COUNT(*) FROM products ${whereClause}`, values);
        const total = parseInt(countResult.rows[0].count, 10);

        values.push(limit);
        const limitIndex = index++;
        values.push(offset);
        const offsetIndex = index++;

        const result = await this.pool.query(
            `SELECT * FROM products ${whereClause} ORDER BY name ASC, created_at DESC LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
            values
        );

        const products = result.rows.map(row => ({
            ...row,
            categoryUid: row.category_uid,
            brandUid: row.brand_uid,
            unitUid: row.unit_uid,
            productCode: row.product_code,
            pricePerUnit: row.price_per_unit,
            gstPercentage: row.gst_percentage,
            capacityUnit: row.capacity_unit,
        }));

        return { products, total };
    }

    async softDelete(uid: string, deletedBy: string): Promise<IProduct | null> {
        const result = await this.pool.query(
            `UPDATE products SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1 WHERE uid = $2 RETURNING *`,
            [deletedBy, uid]
        );
        if (!result.rows[0]) return null;
        return {
            ...result.rows[0],
            categoryUid: result.rows[0].category_uid,
            brandUid: result.rows[0].brand_uid,
            unitUid: result.rows[0].unit_uid,
            productCode: result.rows[0].product_code,
            pricePerUnit: result.rows[0].price_per_unit,
            gstPercentage: result.rows[0].gst_percentage,
            capacityUnit: result.rows[0].capacity_unit,
        };
    }

    async restore(uid: string, updatedBy: string): Promise<IProduct | null> {
        const result = await this.pool.query(
            `UPDATE products SET is_deleted = 0, deleted_at = NULL, deleted_by = NULL, updated_at = CURRENT_TIMESTAMP, updated_by = $1 WHERE uid = $2 RETURNING *`,
            [updatedBy, uid]
        );
        if (!result.rows[0]) return null;
        return {
            ...result.rows[0],
            categoryUid: result.rows[0].category_uid,
            brandUid: result.rows[0].brand_uid,
            unitUid: result.rows[0].unit_uid,
            productCode: result.rows[0].product_code,
            pricePerUnit: result.rows[0].price_per_unit,
            gstPercentage: result.rows[0].gst_percentage,
            capacityUnit: result.rows[0].capacity_unit,
        };
    }
}
