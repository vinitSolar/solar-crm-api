import type { Pool, PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import type { IProduct } from "../interfaces/product.interface.js";

export class ProductRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    private mapRowToProduct(row: any): IProduct {
        return {
            ...row,
            categoryUid: row.category_uid,
            brandUid: row.brand_uid,
            unitUid: row.unit_uid,
            productCode: row.product_code,
            pricePerUnit: row.price_per_unit,
            gstPercentage: row.gst_percentage,
            capacityUnit: row.capacity_unit,
            modelNumber: row.model_number,
            images: row.images || [],
            brandName: row.brand_name,
            categoryName: row.category_name,
            unitName: row.unit_name,
            cellTechnologyUid: row.cell_technology_uid,
            cellTechnologyName: row.cell_technology_name,
        };
    }

    private mapRowToSpecValue(row: any): { specificationUid: string; value: string; specificationName?: string; } {
        return {
            specificationUid: row.specification_uid,
            value: row.value,
            specificationName: row.specification_name,
        };
    }

    async getProductSpecifications(productUid: string, client?: PoolClient): Promise<{ specificationUid: string; value: string; specificationName?: string; }[]> {
        const query = `
            SELECT v.specification_uid, v.value, s.title as specification_name 
            FROM product_specification_values v
            JOIN product_specifications s ON v.specification_uid = s.uid
            JOIN products p ON v.product_uid = p.uid
            LEFT JOIN product_category_specifications pcs ON pcs.category_uid = p.category_uid AND pcs.specification_uid = v.specification_uid AND pcs.is_deleted = 0
            WHERE v.product_uid = $1 AND v.is_deleted = 0
            ORDER BY pcs.sort_order ASC, s.title ASC
        `;
        const dbClient = client || this.pool;
        const result = await dbClient.query(query, [productUid]);
        return result.rows.map(this.mapRowToSpecValue);
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
        capacity?: string | undefined;
        capacityUnit?: string | undefined;
        warranty?: string | undefined;
        description?: string | undefined;
        modelNumber?: string | undefined;
        images?: string[] | undefined;
        cellTechnologyUid?: string | null | undefined;
        specifications?: { specificationUid: string; value: string; }[] | undefined;
        createdBy: string;
    }, client?: PoolClient): Promise<IProduct> {
        const dbClient = client || await this.pool.connect();
        try {
            if (!client) await dbClient.query("BEGIN");

            const productQuery = `INSERT INTO products (
                uid, category_uid, brand_uid, unit_uid, name, product_code, 
                price_per_unit, gst_percentage, capacity, capacity_unit, 
                warranty, description, model_number, images, cell_technology_uid, created_by
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::varchar, $10::varchar, $11::varchar, $12::text, $13::varchar, $14::text[], $15, $16)
             RETURNING *`;
            const productValues = [
                data.uid, data.categoryUid, data.brandUid, data.unitUid, data.name, data.productCode,
                data.pricePerUnit, data.gstPercentage, data.capacity || null, data.capacityUnit || null,
                data.warranty || null, data.description || null, data.modelNumber || null, data.images || [], data.cellTechnologyUid || null, data.createdBy
            ];
            await dbClient.query(productQuery, productValues);
            
            if (data.specifications && data.specifications.length > 0) {
                for (const spec of data.specifications) {
                    await dbClient.query(`
                        INSERT INTO product_specification_values (uid, product_uid, specification_uid, value, created_by)
                        VALUES ($1, $2, $3, $4, $5)
                    `, [uuidv4(), data.uid, spec.specificationUid, spec.value, data.createdBy]);
                }
            }

            if (!client) await dbClient.query("COMMIT");

            const product = await this.findByUid(data.uid, dbClient);
            return product!;
        } catch (error) {
            if (!client) await dbClient.query("ROLLBACK");
            throw error;
        } finally {
            if (!client) (dbClient as any).release();
        }
    }

    async update(uid: string, data: {
        categoryUid?: string | undefined;
        brandUid?: string | undefined;
        unitUid?: string | undefined;
        name?: string | undefined;
        productCode?: string | undefined;
        pricePerUnit?: number | undefined;
        gstPercentage?: number | undefined;
        capacity?: string | null | undefined;
        capacityUnit?: string | null | undefined;
        warranty?: string | null | undefined;
        description?: string | null | undefined;
        modelNumber?: string | null | undefined;
        images?: string[] | undefined;
        isActive?: number | undefined;
        cellTechnologyUid?: string | null | undefined;
        specifications?: { specificationUid: string; value: string; }[] | undefined;
        updatedBy: string;
    }, client?: PoolClient): Promise<IProduct | null> {
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
        if (data.modelNumber !== undefined) pushField('model_number', data.modelNumber);
        if (data.images !== undefined) {
            fields.push(`images = $${index++}::text[]`);
            values.push(data.images);
        }
        if (data.cellTechnologyUid !== undefined) pushField('cell_technology_uid', data.cellTechnologyUid);
        if (data.isActive !== undefined) pushField('is_active', data.isActive);

        const dbClient = client || await this.pool.connect();
        try {
            if (!client) await dbClient.query("BEGIN");

            if (fields.length > 0) {
                fields.push(`updated_at = CURRENT_TIMESTAMP`);
                fields.push(`updated_by = $${index++}`);
                values.push(data.updatedBy);

                const query = `UPDATE products
                     SET ${fields.join(", ")}
                     WHERE uid = $${index}`;
                values.push(uid);
                
                await dbClient.query(query, values);
            }

            if (data.specifications !== undefined) {
                // Soft delete existing specifications not in the new list, update existing, insert new
                const existingSpecsRes = await dbClient.query(`
                    SELECT uid, specification_uid FROM product_specification_values WHERE product_uid = $1 AND is_deleted = 0
                `, [uid]);
                
                const existingSpecs = existingSpecsRes.rows;
                const newSpecUids = data.specifications.map(s => s.specificationUid);

                // Soft delete specs that are removed
                for (const existing of existingSpecs) {
                    if (!newSpecUids.includes(existing.specification_uid)) {
                        await dbClient.query(`
                            UPDATE product_specification_values 
                            SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1
                            WHERE uid = $2
                        `, [data.updatedBy, existing.uid]);
                    }
                }

                // Insert or Update provided specs
                for (const spec of data.specifications) {
                    const existing = existingSpecs.find(e => e.specification_uid === spec.specificationUid);
                    if (existing) {
                        await dbClient.query(`
                            UPDATE product_specification_values 
                            SET value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
                            WHERE uid = $3
                        `, [spec.value, data.updatedBy, existing.uid]);
                    } else {
                        await dbClient.query(`
                            INSERT INTO product_specification_values (uid, product_uid, specification_uid, value, created_by)
                            VALUES ($1, $2, $3, $4, $5)
                        `, [uuidv4(), uid, spec.specificationUid, spec.value, data.updatedBy]);
                    }
                }
            }

            if (!client) await dbClient.query("COMMIT");

            return this.findByUid(uid, dbClient);
        } catch (error) {
            if (!client) await dbClient.query("ROLLBACK");
            throw error;
        } finally {
            if (!client) (dbClient as any).release();
        }
    }

    async findByUid(uid: string, client?: PoolClient): Promise<IProduct | null> {
        const query = `SELECT p.*, b.name as brand_name, c.name as category_name, u.name as unit_name, pct.name as cell_technology_name
             FROM products p 
             LEFT JOIN product_brands b ON p.brand_uid = b.uid 
             LEFT JOIN product_categories c ON p.category_uid = c.uid 
             LEFT JOIN product_units u ON p.unit_uid = u.uid 
             LEFT JOIN product_cell_technologies pct ON p.cell_technology_uid = pct.uid 
             WHERE p.uid = $1`;
        const result = client
            ? await client.query(query, [uid])
            : await this.pool.query(query, [uid]);
        if (!result.rows[0]) return null;
        
        const product = this.mapRowToProduct(result.rows[0]);
        product.specifications = await this.getProductSpecifications(uid, client);
        return product;
    }

    async findByName(name: string, client?: PoolClient): Promise<IProduct | null> {
        const query = `SELECT p.*, b.name as brand_name, c.name as category_name, u.name as unit_name, pct.name as cell_technology_name
             FROM products p 
             LEFT JOIN product_brands b ON p.brand_uid = b.uid 
             LEFT JOIN product_categories c ON p.category_uid = c.uid 
             LEFT JOIN product_units u ON p.unit_uid = u.uid 
             LEFT JOIN product_cell_technologies pct ON p.cell_technology_uid = pct.uid 
             WHERE p.name = $1`;
        const result = client
            ? await client.query(query, [name])
            : await this.pool.query(query, [name]);
        if (!result.rows[0]) return null;
        
        const product = this.mapRowToProduct(result.rows[0]);
        product.specifications = await this.getProductSpecifications(product.uid, client);
        return product;
    }

    async findByCode(code: string, client?: PoolClient): Promise<IProduct | null> {
        const query = `SELECT p.*, b.name as brand_name, c.name as category_name, u.name as unit_name, pct.name as cell_technology_name
             FROM products p 
             LEFT JOIN product_brands b ON p.brand_uid = b.uid 
             LEFT JOIN product_categories c ON p.category_uid = c.uid 
             LEFT JOIN product_units u ON p.unit_uid = u.uid 
             LEFT JOIN product_cell_technologies pct ON p.cell_technology_uid = pct.uid 
             WHERE p.product_code = $1`;
        const result = client
            ? await client.query(query, [code])
            : await this.pool.query(query, [code]);
        if (!result.rows[0]) return null;
        
        const product = this.mapRowToProduct(result.rows[0]);
        product.specifications = await this.getProductSpecifications(product.uid, client);
        return product;
    }

    async findAll(status?: "active" | "deleted" | "all"): Promise<IProduct[]> {
        let query = `SELECT p.*, b.name as brand_name, c.name as category_name, u.name as unit_name, pct.name as cell_technology_name
             FROM products p 
             LEFT JOIN product_brands b ON p.brand_uid = b.uid 
             LEFT JOIN product_categories c ON p.category_uid = c.uid 
             LEFT JOIN product_units u ON p.unit_uid = u.uid 
             LEFT JOIN product_cell_technologies pct ON p.cell_technology_uid = pct.uid`;
        const conditions: string[] = [];

        if (status === "active") {
            conditions.push(`p.is_deleted = 0`);
        } else if (status === "deleted") {
            conditions.push(`p.is_deleted = 1`);
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(" AND ")}`;
        }

        query += ` ORDER BY p.created_at DESC`;

        const result = await this.pool.query(query);
        const products = result.rows.map(row => this.mapRowToProduct(row));
        
        // Fetch specs for all
        for (const product of products) {
             product.specifications = await this.getProductSpecifications(product.uid);
        }
        return products;
    }

    async findPaginated(page: number, limit: number, search?: string, categoryUid?: string, brandUid?: string, status: "active" | "deleted" | "all" = "active"): Promise<{ products: IProduct[]; total: number }> {
        const offset = (page - 1) * limit;
        const values: any[] = [];
        const conditions: string[] = [];
        let index = 1;

        if (status === "active") {
            conditions.push(`p.is_deleted = 0`);
        } else if (status === "deleted") {
            conditions.push(`p.is_deleted = 1`);
        }

        if (search) {
            conditions.push(`(p.name ILIKE $${index} OR p.product_code ILIKE $${index})`);
            values.push(`%${search}%`);
            index++;
        }

        if (categoryUid && categoryUid !== "" && categoryUid !== "null" && categoryUid !== "undefined") {
            conditions.push(`p.category_uid = $${index}`);
            values.push(categoryUid);
            index++;
        }

        if (brandUid && brandUid !== "" && brandUid !== "null" && brandUid !== "undefined") {
            conditions.push(`p.brand_uid = $${index}`);
            values.push(brandUid);
            index++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const countResult = await this.pool.query(`SELECT COUNT(*) FROM products p ${whereClause}`, values);
        const total = parseInt(countResult.rows[0].count, 10);

        values.push(limit);
        const limitIndex = index++;
        values.push(offset);
        const offsetIndex = index++;

        const result = await this.pool.query(
            `SELECT p.*, b.name as brand_name, c.name as category_name, u.name as unit_name, pct.name as cell_technology_name
             FROM products p 
             LEFT JOIN product_brands b ON p.brand_uid = b.uid 
             LEFT JOIN product_categories c ON p.category_uid = c.uid 
             LEFT JOIN product_units u ON p.unit_uid = u.uid 
             LEFT JOIN product_cell_technologies pct ON p.cell_technology_uid = pct.uid 
             ${whereClause} 
             ORDER BY p.name ASC, p.created_at DESC 
             LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
            values
        );

        const products = result.rows.map(row => this.mapRowToProduct(row));
        for (const product of products) {
            product.specifications = await this.getProductSpecifications(product.uid);
        }

        return { products, total };
    }

    async softDelete(uid: string, deletedBy: string, client?: PoolClient): Promise<IProduct | null> {
        const query = `UPDATE products SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1 WHERE uid = $2 RETURNING *`;
        const result = client
            ? await client.query(query, [deletedBy, uid])
            : await this.pool.query(query, [deletedBy, uid]);
        if (!result.rows[0]) return null;
        return this.mapRowToProduct(result.rows[0]);
    }

    async restore(uid: string, updatedBy: string, client?: PoolClient): Promise<IProduct | null> {
        const query = `UPDATE products SET is_deleted = 0, deleted_at = NULL, deleted_by = NULL, updated_at = CURRENT_TIMESTAMP, updated_by = $1 WHERE uid = $2 RETURNING *`;
        const result = client
            ? await client.query(query, [updatedBy, uid])
            : await this.pool.query(query, [updatedBy, uid]);
        if (!result.rows[0]) return null;
        return this.mapRowToProduct(result.rows[0]);
    }
}
